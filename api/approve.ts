import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ApproveRequest {
  paymentId: string;
  userId: string;
  amount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId, userId, amount } = req.body as ApproveRequest;
    const PI_API_KEY = process.env.VITE_PI_API_KEY;

    if (!paymentId || !userId || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        approved: false 
      });
    }

    console.log(`[APPROVE] Processing payment ${paymentId} for user ${userId}`);

    // في بيئة الاختبار، نوافق تلقائياً بدون استدعاء Pi API
    // في الإنتاج، استخدم الكود التالي:
    /*
    const fetch = (await import('node-fetch')).default;
    const piResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!piResponse.ok) {
      throw new Error('Pi API approval failed');
    }
    */

    // موافقة تلقائية في Demo/Test
    console.log(`[APPROVE SUCCESS] Payment ${paymentId} approved`);
    
    return res.status(200).json({
      approved: true,
      paymentId,
      userId,
      amount,
      timestamp: new Date().toISOString(),
      message: 'Payment approved successfully'
    });

  } catch (error: any) {
    console.error('[APPROVE ERROR]', error.message);
    return res.status(500).json({ 
      error: 'Approval failed',
      approved: false,
      details: error.message
    });
  }
}
