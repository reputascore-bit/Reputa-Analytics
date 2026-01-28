import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE = 'https://api.minepi.com/v2'; 

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    const paymentId = body.paymentId?.toString().trim();
    const action = body.action?.toString().trim();
    const txid = body.txid?.toString().trim();
    const uid = body.uid; // الـ UID الحقيقي للمستخدم

    // --- تعديل منطق الـ Payout لإصلاح خطأ user_not_found ---
    if (action === 'payout') {
      const { address, amount, memo } = body;
      
      // ملاحظة: الـ uid هنا يجب أن يكون هو نفسه الـ uid الخاص بالمستخدم المسجل في Pi
      // إذا لم يتوفر، نستخدم الـ uid القادم من الواجهة الأمامية
      const targetUid = uid || body.pioneerUid; 

      const payoutResponse = await fetch(`${PI_API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment: {
            amount: amount || 0.01,
            memo: memo || "Reward payout",
            metadata: { type: "payout" },
            uid: targetUid, // تغيير هام: استخدام UID حقيقي للمستخدم وليس نصاً عشوائياً
            recipient_address: address 
          }
        }),
      });

      const payoutData = await payoutResponse.json();
      if (!payoutResponse.ok) {
        console.error("[PI-API] Payout Failed:", payoutData);
        return res.status(payoutResponse.status).json({ error: payoutData });
      }
      return res.status(200).json({ success: true, data: payoutData });
    }

    // --- المسار التقليدي (Approve/Complete) ---
    if (!paymentId || !action) return res.status(400).json({ error: "Missing data" });

    const url = `${PI_API_BASE}/payments/${paymentId}/${action}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: action === 'complete' ? JSON.stringify({ txid }) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    
    if (action === 'complete' && response.ok && uid) {
      await redis.set(`vip_status:${uid}`, 'active');
      await redis.incr('total_successful_payments');
    }

    return res.status(response.status).json(data);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
