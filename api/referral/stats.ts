/**
 * GET /api/referral/stats
 * Fetch referral stats for a user
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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    console.log('✅ [REFERRAL STATS] Fetching for:', walletAddress);

    // In-memory demo data (replace with MongoDB in production)
    const referralCode = walletAddress.substring(0, 6).toUpperCase().padEnd(6, 'X');
    const referralLink = `${process.env.VERCEL_URL || 'https://reputa-score.vercel.app'}/?ref=${referralCode}`;

    return res.status(200).json({
      success: true,
      data: {
        referralCode,
        referralLink,
        confirmedReferrals: 0,
        pendingReferrals: 0,
        totalPointsEarned: 0,
        claimablePoints: 0,
        pointsBalance: 0,
      },
    });
  } catch (error: any) {
    console.error('❌ [REFERRAL STATS] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
