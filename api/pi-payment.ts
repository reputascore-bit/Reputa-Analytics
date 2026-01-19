import { Redis } from '@upstash/redis';

// 1. إعداد الاتصال بـ Upstash Redis (لقراءة المتغيرات التي رأيناها في Vercel)
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// مفتاح API الخاص بـ Pi (يجب إضافته في إعدادات Vercel)
const PI_API_KEY = process.env.PI_API_KEY; 

export default async function handler(req: any, res: any) {
  // السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { paymentId, txid, action } = req.body;

  try {
    // --- المرحلة الأولى: الموافقة (Approve) ---
    if (action === 'approve') {
      const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({ error: "Pi API Approval Failed", details: errorData });
      }

      return res.status(200).json({ success: true });
    }

    // --- المرحلة الثانية: الإتمام (Complete) ---
    if (action === 'complete') {
      const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({ error: "Pi API Completion Failed", details: errorData });
      }

      // ✅ نجاح الدفع: تفعيل خاصية VIP للمستخدم في قاعدة البيانات
      // نفترض أننا نربط المعاملة بـ paymentId أو يمكنك إرسال userId إضافي
      await redis.set(`vip_status:${paymentId}`, 'active');
      await redis.incr('total_successful_payments');

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (error: any) {
    console.error("Payment API Error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
