import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios'; // يفضل استخدام axios لاستقرار الطلبات

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... (إبقاء إعدادات CORS كما هي)

  try {
    const { paymentId, userId, amount } = req.body;
    const PI_API_KEY = process.env.PI_API_KEY; // تأكد من تسميته هكذا في Vercel

    // 1. الاتصال بخادم Pi Network لإبلاغهم بموافقتك الرسمية
    const piResponse = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {}, // لا يحتاج body
      {
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (piResponse.status !== 200) {
      throw new Error('Pi Network rejected the approval');
    }

    console.log(`[APPROVE SUCCESS] Payment ${paymentId} officially approved by Pi Server`);

    return res.status(200).json({
      approved: true,
      paymentId: piResponse.data.identifier, // نستخدم المعرف العائد من باي
      message: 'Payment approved successfully'
    });

  } catch (error: any) {
    console.error('[APPROVE ERROR]', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Approval failed',
      details: error.response?.data || error.message 
    });
  }
}
