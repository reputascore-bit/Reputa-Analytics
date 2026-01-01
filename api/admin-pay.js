const PiNetwork = require('@pinetwork-js/sdk');

const pi = new PiNetwork({
  apiKey: process.env.PI_API_KEY,
  walletPrivateSeed: process.env.APP_WALLET_SEED 
});

module.exports = async (req, res) => {
  // تفعيل الـ CORS للسماح بالطلب من الفرونت اند
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { recipientAddress, adminSecret } = req.body;

  if (adminSecret !== "123456") return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payment = await pi.createPayment({
      amount: 0.1,
      memo: "App to User Transfer",
      metadata: { target: recipientAddress },
      uid: "tx-" + Date.now()
    });

    const txid = await pi.submitPayment(payment.identifier);
    res.status(200).json({ success: true, txid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
