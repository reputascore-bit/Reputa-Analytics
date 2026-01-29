import { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

// إعداد Redis (تأكد من وجود المتغيرات في Vercel Env)
const redis = Redis.fromEnv();

export default async function (req: VercelRequest, res: VercelResponse) {
  // 1. استخراج البيانات من الطلب (Request Body)
  const { amount, cleanAddress, recipientUid, responseData, responseOk } = req.body;

  // التحقق من وجود البيانات لتجنب أخطاء TypeScript (Cannot find name)
  if (!responseOk) {
    return res.status(400).json({ success: false, message: "Response not okay" });
  }

  try {
    // --- الجزء الذي طلبته مع التصحيحات التقنية ---
    const now = new Date();
    const txTimestamp = now.toISOString();
    
    // تحديد نوع المعاملة
    const isDexSwap = parseFloat(amount) === 3.14; 
    const txType = isDexSwap ? "Pi DEX Swap" : "Sent";
    const subType = isDexSwap ? "Ecosystem Exchange" : "Wallet Transfer";

    // إنشاء كائن المعاملة التفصيلي
    const transactionDetail = JSON.stringify({
      id: responseData?.identifier ? (responseData.identifier as string).substring(0, 8) : Math.random().toString(36).substring(2, 10),
      type: txType,
      subType: subType,
      amount: parseFloat(amount).toFixed(2),
      status: "Success",
      exactTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      dateLabel: "Today", 
      timestamp: txTimestamp,
      to: cleanAddress
    });

    // تنفيذ عمليات Redis
    // حفظ المعاملة في القائمة
    await redis.lpush(`history:${cleanAddress}`, transactionDetail);
    await redis.ltrim(`history:${cleanAddress}`, 0, 9);

    // تحديث العدادات
    await redis.incr(`tx_count:${cleanAddress}`);
    if (recipientUid) {
      await redis.incr(`tx_count:${recipientUid}`);
    }
    await redis.incr('total_app_transactions');
    
    // إرسال الرد النهائي
    return res.status(200).json({ success: true, data: responseData });

  } catch (error) {
    console.error("Error processing transaction:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
