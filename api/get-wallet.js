export default async function handler(req, res) {
  // 1. استخراج وتنظيف العنوان
  const address = req.query.address ? req.query.address.trim() : null;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    // 2. إرسال الطلب مع تحديد رؤوس البيانات (Headers)
    const response = await fetch(`https://horizon-testnet.pi-blockchain.net/accounts/${address}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Reputa-Analytics-v2' // لتعريف طلبك للشبكة
      }
    });

    // 3. التحقق من حالة الرد قبل تحويله لـ JSON
    if (response.status === 404) {
      return res.status(404).json({ 
        error: "Wallet not found", 
        details: "تأكد أن المحفظة مفعلة في Testnet (تم إرسال باي إليها سابقاً)" 
      });
    }

    const data = await response.json();
    
    // 4. إرسال البيانات النهائية للتطبيق
    return res.status(200).json(data);

  } catch (error) {
    console.error("Fetch Error:", error);
    return res.status(500).json({ error: "Blockchain Connection Failed" });
  }
}
