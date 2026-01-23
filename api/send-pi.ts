import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PI_API_KEY = process.env.PI_API_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // أضفنا recipientUid لكي نأخذه من واجهة التطبيق
    const { toAddress, amount, recipientUid } = req.body;

    if (!toAddress || !amount || !recipientUid) {
      return res.status(400).json({ error: "Missing data: address, amount, or recipientUid" });
    }

    const response = await fetch(`https://api.minepi.com/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment: {
          amount: parseFloat(amount),
          memo: "Mainnet Checklist Transaction",
          metadata: { type: "app_payout" },
          uid: recipientUid, // تم التعديل: نستخدم الـ UID الحقيقي للمستلم المسجل في باي
          recipient_address: toAddress
        }
      })
    });

    // قراءة البيانات مرة واحدة لتجنب خطأ Body is unusable
    const responseData = await response.json();

    if (response.ok) {
        await redis.incr('total_app_transactions');
        return res.status(200).json({ success: true, data: responseData });
    } else {
        console.error("Pi API Error Detail:", responseData);
        // نعيد تفاصيل الخطأ بدقة لنعرف سبب الرفض (مثلاً رصيد غير كافٍ)
        return res.status(400).json({ 
          error: responseData.error_message || responseData.message || "Transaction Rejected",
          code: responseData.error || "unknown_error"
        });
    }

  } catch (error: any) {
    console.error("Server Error:", error.message);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
