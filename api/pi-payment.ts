import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE = 'https://api.minepi.com/v2';

export default async function handler(req: any, res: any) {
  // ---- CORS ----
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  if (!PI_API_KEY) {
    console.error('Missing PI_API_KEY');
    return res.status(500).end();
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

    const { paymentId, txid, action, uid } = body || {};

    // ---- APPROVE ----
    if (action === 'approve') {
      if (!paymentId) {
        return res.status(400).end();
      }

      const response = await fetch(
        `${PI_API_BASE}/payments/${paymentId}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${PI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Approve failed', await response.text());
        return res.status(400).end();
      }

      // ⚠️ Pi SDK يحتاج فقط 200
      return res.status(200).end();
    }

    // ---- COMPLETE ----
    if (action === 'complete') {
      if (!paymentId || !txid) {
        return res.status(400).end();
      }

      const response = await fetch(
        `${PI_API_BASE}/payments/${paymentId}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${PI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ txid }),
        }
      );

      if (!response.ok) {
        console.error('Complete failed', await response.text());
        return res.status(400).end();
      }

      // ---- Business Logic ----
      if (uid) {
        await redis.set(`vip_status:${uid}`, 'active');
        await redis.incr('total_successful_payments');
      }

      return res.status(200).end();
    }

    // ---- INVALID ACTION ----
    return res.status(400).end();
  } catch (error) {
    console.error('Payment API Error:', error);
    return res.status(500).end();
  }
}
