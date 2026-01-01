export default async function handler(req, res) {
  // 1. السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { paymentId } = req.body;
  const apiKey = process.env.VITE_PI_API_KEY;
  
  // --- الإضافة الضرورية هنا ---
  // استدعاء المفتاح السري للمحفظة من متغيرات البيئة (يبدأ بحرف S)
  const walletSeed = process.env.MY_APP_WALLET_SEED; 

  // التحقق من وجود المعطيات الأساسية
  if (!paymentId || !apiKey || !walletSeed) {
    return res.status(400).json({ error: 'Missing paymentId, API Key or Wallet Seed' });
  }

  try {
    // 2. طلب الموافقة من خادم Pi الرسمي
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
        // --- هذه هي الإضافة التي ستمكنك من إرسال Pi من محفظة التطبيق للمستخدم ---
        'X-Payment-Secret-Seed': walletSeed 
      }
    });

    const data = await response.json();

    // 3. التحقق مما إذا كانت شبكة Pi قد قبلت الموافقة
    if (!response.ok) {
      console.error("Pi Network Error:", data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Vercel Fetch Error:", error);
    return res.status(500).json({ error: "Approve request failed on server" });
  }
}
