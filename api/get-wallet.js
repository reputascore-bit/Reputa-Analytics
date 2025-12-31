export default async function handler(req, res) {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: "Address required" });

  // الرابط الجديد لشبكة الاختبار
  const API_URL = `https://api.testnet.minepi.com/accounts/${address.trim()}`;

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.status === 404) {
      return res.status(404).json({ error: "Wallet not found on Testnet" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Connection Error:", error);
    return res.status(500).json({ error: "Blockchain Connection Failed" });
  }
}
