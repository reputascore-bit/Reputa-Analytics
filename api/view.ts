import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// كلمة سر بسيطة لحماية بياناتك
const ADMIN_SECRET = "med@2026"; 

export default async function handler(req: any, res: any) {
  /
  const { key } = req.query;

  if (key !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized access. Please provide the correct secret key." });
  }

  try {
    const rawData = await redis.lrange('pioneers', 0, -1);

    const formattedData = rawData.map((item: any) => {
      if (typeof item === 'object' && item !== null) return item;
      try { return JSON.parse(item); } catch { return { raw: item }; }
    });

    // إحصائيات سريعة
    const stats = {
      total_entries: formattedData.length,
      real_wallets: formattedData.filter((u: any) => u.wallet?.startsWith('G')).length,
      last_update: formattedData[0]?.timestamp || "N/A"
    };

    // تنظيم البيانات: عرض المحافظ الحقيقية أولاً ثم البقية
    const organizedData = [
      ...formattedData.filter((u: any) => u.wallet?.startsWith('G')),
      ...formattedData.filter((u: any) => !u.wallet?.startsWith('G'))
    ];

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({
      status: "Success",
      statistics: stats,
      pioneers: organizedData
    }, null, 2));

  } catch (error: any) {
    return res.status(500).json({ error: "Fetch Error", detail: error.message });
  }
}
