import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// ربط مباشر باستخدام المتغيرات المتاحة في صورتك
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(req: Request) {
  try {
    const { username, wallet } = await req.json();

    // نستخدم rpush لضمان الإضافة في نهاية القائمة
    await redis.rpush('registered_pioneers', JSON.stringify({
      username,
      wallet,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // هذا السطر سيظهر لك سبب الفشل الحقيقي في الـ Logs
    console.error("Redis connection error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
