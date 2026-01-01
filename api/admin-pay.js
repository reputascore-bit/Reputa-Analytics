import StellarSdk from 'stellar-sdk';

export default async function handler(req, res) {
  // تفعيل CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') return res.status(200).json({ status: 'Online' });

  const { recipientAddress, adminSecret } = req.body;
  if (adminSecret !== "123456") return res.status(401).json({ error: 'Wrong Secret' });

  // الربط مع شبكة Pi Testnet
  const server = new StellarSdk.Horizon.Server('https://api.testnet.minepi.com');
  const sourceKeys = StellarSdk.Keypair.fromSecret(process.env.APP_WALLET_SEED);

  try {
    const account = await server.loadAccount(sourceKeys.publicKey());
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: 'Pi Network Testnet',
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: recipientAddress,
        asset: StellarSdk.Asset.native(),
        amount: '0.1',
      }))
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeys);
    const result = await server.submitTransaction(transaction);
    
    return res.status(200).json({ success: true, txid: result.hash });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
