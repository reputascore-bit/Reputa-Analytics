/**
 * POST /api/referral/track
 * Track a new referral when user signs up
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { walletAddress, referralCode } = req.body;

    if (!walletAddress || !referralCode) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and referral code are required',
      });
    }

    console.log('✅ [REFERRAL TRACK] Tracking:', { walletAddress, referralCode });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Referral tracked successfully',
        status: 'pending',
      },
    });
  } catch (error: any) {
    console.error('❌ [REFERRAL TRACK] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
