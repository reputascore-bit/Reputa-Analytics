export default async function handler(req, res) {
  // 1. السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // استلام البيانات من الطلب (أضفنا isAppToUser)
  const { paymentId, isAppToUser } = req.body;
  const apiKey = process.env.VITE_PI_API_KEY;
  const walletSeed = process.env.MY_APP_WALLET_SEED; 

  // التحقق من وجود المعطيات الأساسية
  if (!paymentId || !apiKey) {
    return res.status(400).json({ error: 'Missing paymentId or API Key' });
  }

  try {
    // إعداد الـ Headers الأساسية
    const headers = {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    };

    /**
     * الحطوة الحاسمة:
     * إذا كانت العملية "App-to-User" (من لوحة تحكم المطور)، 
     * نرسل الـ Wallet Seed لإخبار شبكة Pi أن التطبيق هو من سيدفع.
     */
    if (isAppToUser) {
      if (!walletSeed) {
        return res.status(500).json({ error: 'App Wallet Seed not configured in server variables' });
      }
      headers['X-Payment-Secret-Seed'] = walletSeed;
    }

    // 2. طلب الموافقة من خادم Pi الرسمي
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: headers
    });

    const data = await response.json();

    // 3. التحقق من استجابة الشبكة
    if (!response.ok) {
      console.error("Pi Network Approval Error:", data);
      return res.status(response.status).json({
        error: "Network rejection",
        details: data
      });
    }

    // النجاح
    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Side Error:", error);
    return res.status(500).json({ error: "Internal server error during approval" });
  }
}
