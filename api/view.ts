import { Redis } from '@upstash/redis'

export default async function handler(req, res) {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  try {
    const rawData = await redis.lrange('pioneers', 0, -1);
    // تحويل النصوص إلى كائنات JSON حقيقية لعرضها بشكل جميل
    const cleanData = rawData.map(item => JSON.parse(item));

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(cleanData, null, 2)); // 2 لعمل مسافات وتنظيم (Prettify)
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
