import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export default async function handler(req, res) {
  // للتحقق من الاتصال
  if (req.method === 'GET') {
    return res.status(200).json({ status: "API is working with Upstash" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, wallet } = req.body;
    
    // تسجيل البيانات في القائمة
    await redis.rpush('registered_pioneers', JSON.stringify({
      username,
      wallet,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({ success: true, message: "Pioneer saved" });
  } catch (error) {
    console.error("Redis Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
