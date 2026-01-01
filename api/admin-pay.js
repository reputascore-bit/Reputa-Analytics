// api/admin-pay.js
const { PiClient } = require('@pinetwork-js/sdk');

// تهيئة العميل باستخدام البيانات من Vercel Environment Variables
const pi = new PiClient({
  apiKey: process.env.PI_API_KEY,
  walletPrivateSeed: process.env.APP_WALLET_SEED // المفتاح السري الذي يبدأ بـ S
});

export default async function handler(req, res) {
  // السماح فقط بطلبات POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { recipientAddress } = req.body;

  if (!recipientAddress) {
    return res.status(400).json({ error: 'Recipient address is required' });
  }

  try {
    // 1. إنشاء معاملة من نوع App-to-User
    // ملاحظة: الـ uid هنا هو معرف وهمي لعملية الإدارة
    const payment = await pi.createPayment({
      amount: 0.1,
      memo: "Mainnet Verification Flow - App to User",
      metadata: { target: recipientAddress },
      uid: "admin-verification-" + Date.now()
    });

    // 2. توقيع وإرسال المعاملة فوراً باستخدام مفتاح التطبيق السري
    const txid = await pi.submitPayment(payment.identifier);

    // 3. إرجاع رقم المعاملة للتأكيد
    return res.status(200).json({ 
      success: true, 
      txid: txid,
      message: "العملية تمت بنجاح من محفظة التطبيق" 
    });
  } catch (error) {
    console.error("Payment Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
