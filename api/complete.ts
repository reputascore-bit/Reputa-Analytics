import type { VercelRequest, VercelResponse } from '@vercel/node';

interface CompleteRequest {
  paymentId: string;
  txid: string;
  userId: string;
  amount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // إضافة رؤوس CORS للسماح لمتصفح المستخدم بإرسال طلبات POST بنجاح
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // التعامل مع طلب OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId, txid, userId, amount } = req.body as CompleteRequest;

    if (!paymentId || !txid || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        completed: false 
      });
    }

    // الحفاظ على المنطق الأصلي كما هو دون تغيير
    console.log(`[COMPLETE] Payment ${paymentId}, TXID: ${txid}, User: ${userId}`);

    // محاكاة تحديث قاعدة البيانات (بنفس الهيكل الأصلي)
    const subscriptionData = {
      userId,
      paymentId,
      txid,
      amount,
      type: 'vip_subscription',
      status: 'completed',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      reputationBonus: 50
    };

    console.log('[SUBSCRIPTION UPDATED]', subscriptionData);

    return res.status(200).json({
      completed: true,
      subscription: subscriptionData,
      message: 'VIP subscription activated successfully'
    });

  } catch (error) {
    console.error('[COMPLETE ERROR]', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      completed: false 
    });
  }
}
