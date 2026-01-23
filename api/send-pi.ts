import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PI_API_KEY = process.env.PI_API_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { toAddress, amount } = req.body;

    if (!toAddress || !amount) {
      return res.status(400).json({ error: "Missing data" });
    }

    // استدعاء API منصة باي
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
          uid: "admin-payout-" + Date.now(), // استخدام معرف فريد لكل عملية
          recipient_address: toAddress // التأكد من تحديد المستلم بشكل صحيح
        }
      })
    });

    const responseData = await response.json(); // محاولة قراءة الاستجابة كـ JSON

    if (response.ok) {
        await redis.incr('total_app_transactions');
        return res.status(200).json({ success: true, data: responseData });
    } else {
        // إرسال الخطأ التفصيلي من Pi API إلى الفرونت إند
        console.error("Pi API Error Details:", responseData);
        return res.status(400).json({ 
          error: responseData.message || "Pi Network rejected the transaction",
          details: responseData 
        });
    }

  } catch (error: any) {
    console.error("Server Crash Error:", error);
    return res.status(500).json({ error: "Server Error", message: error.message });
  }
}
