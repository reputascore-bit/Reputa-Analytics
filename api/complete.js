export default async function handler(req, res) {
  // التأكد من أن الطلب من نوع POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId, txid } = req.body;
  const apiKey = process.env.VITE_PI_API_KEY;

  try {
    // إخبار شبكة Pi أن المعاملة اكتملت بنجاح
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid }) 
    });

    const data = await response.json();
    
    // إرجاع النتيجة للتطبيق
    return res.status(200).json(data);
  } catch (error) {
    console.error("Complete Error:", error);
    return res.status(500).json({ error: 'Failed to complete payment' });
  }
}
