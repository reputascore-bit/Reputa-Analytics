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

    // --- تعديل منطق الـ Payout لمعالجة التضارب وضمان التنفيذ الحقيقي ---
    if (action === 'payout') {
      const { address, amount, memo } = body;
      const targetUid = uid || body.pioneerUid;

      if (!targetUid) {
        return res.status(400).json({ error: "User UID is required for payouts" });
      }

      // 1. طلب إنشاء عملية Payout من خوادم Pi
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
            uid: targetUid, 
            recipient_address: address 
          }
        }),
      });

      const payoutData = await payoutResponse.json();

      if (!payoutResponse.ok) {
        // إذا ظهر خطأ "ongoing payment"، يتم إرسال التفاصيل كاملة للواجهة
        console.error("[PI-API] Payout Conflict/Error:", payoutData);
        return res.status(payoutResponse.status).json({ error: payoutData });
      }

      // 2. تسجيل الـ identifier في Redis لضمان تتبع المعاملة الحقيقية
      if (payoutData.identifier) {
        await redis.set(`last_payout:${targetUid}`, {
          id: payoutData.identifier,
          status: 'initiated',
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({ success: true, data: payoutData });
    }

    // --- المسار التقليدي (Approve/Complete) المستخدم في User-to-App ---
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
    
    // عند اكتمال الدفع من المستخدم للتطبيق
    if (action === 'complete' && response.ok && uid) {
      await redis.set(`vip_status:${uid}`, 'active');
      await redis.incr('total_successful_payments');
    }

    return res.status(response.status).json(data);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
