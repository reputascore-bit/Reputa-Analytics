import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: any, res: any) {
  try {
    // جلب البيانات الخام من Redis
    const rawData = await redis.lrange('pioneers', 0, -1);

    // معالجة البيانات بأمان لتجنب خطأ [object Object]
    const formattedData = rawData.map((item: any) => {
      // إذا كان العنصر عبارة عن كائن أصلاً (Object)
      if (typeof item === 'object' && item !== null) {
        return item;
      }
      // إذا كان نصاً، نحاول تحويله لـ JSON
      try {
        return JSON.parse(item);
      } catch (e) {
        return { raw_text: item }; // في حال وجود نص غير صالح
      }
    });

    // إرسال البيانات النهائية
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(formattedData, null, 2));

  } catch (error: any) {
    return res.status(500).json({ 
      error: "Data Fetch Error", 
      message: error.message 
    });
  }
}
