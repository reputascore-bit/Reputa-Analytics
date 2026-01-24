import { Redis } from '@upstash/redis'

export default async function handler(req, res) {
  // 1. تحقق من وجود المفاتيح قبل البدء
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: "Missing Environment Variables" });
  }

  const redis = new Redis({ url, token });

  // للتحقق من أن الـ API يعمل عند فتحه في المتصفح
  if (req.method === 'GET') {
    return res.status(200).json({ status: "API Ready" });
  }

  // السماح بطلبات POST فقط للحفظ
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // الحصول على البيانات سواء كانت نصاً (JSON.parse) أو كائناً جاهزاً
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { username, wallet } = body || {};
    
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    // --- التعديل الجوهري: تنظيف المحفظة قبل الحفظ ---
    // إزالة المسافات وأي رموز غريبة قد تسبب فشل الفحص لاحقاً
    const cleanWallet = wallet ? wallet.trim().replace(/[^a-zA-Z0-9_]/g, "") : "";

    // تجهيز البيانات النظيفة
    const userData = JSON.stringify({
      username: username.trim(),
      wallet: cleanWallet, // الحفظ هنا أصبح نظيفاً 100%
      timestamp: new Date().toISOString()
    });

    // ✅ الحفظ في 'pioneers' لكي تظهر في الـ CLI والداشبورد
    await redis.lpush('pioneers', userData);

    // ✅ الحفظ في 'registered_pioneers' (حسب كودك الأصلي)
    await redis.rpush('registered_pioneers', userData);

    // ✅ تحديث العداد الكلي
    await redis.incr('total_pioneers');

    // طباعة سجل للتأكد من نجاح العملية (اختياري)
    console.log(`[SAVE-PIONEER] User: ${username} | Wallet Sanitized: ${cleanWallet}`);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Redis Error:", error);
    return res.status(500).json({ error: "Database Connection Failed", message: error.message });
  }
}
