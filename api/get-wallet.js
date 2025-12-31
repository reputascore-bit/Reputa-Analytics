export default async function handler(req, res) {
  // تنظيف العنوان من أي فراغات
  const address = req.query.address ? req.query.address.trim() : null;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    const response = await fetch(`https://horizon-testnet.pi-blockchain.net/accounts/${address}`);
    const data = await response.json();

    if (response.status === 404) {
      return res.status(404).json({ error: "Wallet not found on Testnet" });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Network Error" });
  }
}
