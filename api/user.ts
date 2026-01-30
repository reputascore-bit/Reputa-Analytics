/**
 * User API - Consolidated user data operations
 * Handles: VIP check, save pioneer data, save feedback, user reputation storage
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'; 
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}

async function handleCheckVip(uid: string, res: VercelResponse) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  const vipStatus = await redis.get(`vip_status:${uid}`);
  const isVip = vipStatus === 'active';
  const txCount = await redis.get(`tx_count:${uid}`);
  const count = parseInt(txCount as string) || 0;

  return res.status(200).json({ isVip, count });
}

async function handleSavePioneer(body: any, res: VercelResponse) {
  const { username, wallet, timestamp } = body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const cleanWallet = wallet ? wallet.trim().replace(/[^a-zA-Z0-9_]/g, "") : "";

  const userData = JSON.stringify({
    username: username.trim(),
    wallet: cleanWallet,
    timestamp: timestamp || new Date().toISOString()
  });

  await redis.lpush('pioneers', userData);
  await redis.rpush('registered_pioneers', userData);
  await redis.incr('total_pioneers');

  console.log(`[SAVE] Pioneer stored: ${username}`);
  return res.status(200).json({ success: true, message: "Pioneer saved" });
}

async function handleSaveFeedback(body: any, res: VercelResponse) {
  const { username, text, timestamp } = body;

  if (!text) {
    return res.status(400).json({ error: "Feedback text is required" });
  }

  const feedbackData = JSON.stringify({
    username: username || "Anonymous",
    text: text.trim(),
    timestamp: timestamp || new Date().toISOString()
  });

  await redis.lpush('feedbacks', feedbackData);
  
  console.log(`[SAVE] Feedback stored from: ${username}`);
  return res.status(200).json({ success: true, message: "Feedback saved" });
}

async function handleGetReputation(uid: string, res: VercelResponse) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  const reputationData = await redis.get(`reputation:${uid}`);
  
  if (!reputationData) {
    return res.status(200).json({
      success: true,
      data: {
        uid,
        reputationScore: 0,
        blockchainScore: 0,
        dailyCheckInPoints: 0,
        totalCheckInDays: 0,
        lastCheckIn: null,
        interactionHistory: [],
        blockchainEvents: [],
        walletSnapshot: null,
        lastUpdated: null,
        lastBlockchainSync: null,
        isNew: true
      }
    });
  }

  const parsed = typeof reputationData === 'string' ? JSON.parse(reputationData) : reputationData;
  return res.status(200).json({ success: true, data: parsed });
}

async function handleSaveReputation(body: any, res: VercelResponse) {
  const { 
    uid, 
    walletAddress,
    reputationScore, 
    blockchainScore,
    dailyCheckInPoints, 
    totalCheckInDays, 
    lastCheckIn, 
    interactionHistory,
    blockchainEvents,
    walletSnapshot,
    lastBlockchainSync
  } = body;

  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  const reputationData = {
    uid,
    walletAddress: walletAddress || null,
    reputationScore: reputationScore || 0,
    blockchainScore: blockchainScore || 0,
    dailyCheckInPoints: dailyCheckInPoints || 0,
    totalCheckInDays: totalCheckInDays || 0,
    lastCheckIn: lastCheckIn || null,
    interactionHistory: (interactionHistory || []).slice(0, 100),
    blockchainEvents: (blockchainEvents || []).slice(0, 100),
    walletSnapshot: walletSnapshot || null,
    lastBlockchainSync: lastBlockchainSync || null,
    lastUpdated: new Date().toISOString()
  };

  await redis.set(`reputation:${uid}`, JSON.stringify(reputationData));
  
  console.log(`[REPUTATION] Saved for user: ${uid}, blockchain: ${blockchainScore}, total: ${reputationScore}`);
  return res.status(200).json({ success: true, data: reputationData });
}

async function handleMergeCheckInPoints(body: any, res: VercelResponse) {
  const { uid, pointsToMerge } = body;

  if (!uid || typeof pointsToMerge !== 'number') {
    return res.status(400).json({ error: 'Missing uid or pointsToMerge' });
  }

  const existing = await redis.get(`reputation:${uid}`);
  const parsed = existing ? (typeof existing === 'string' ? JSON.parse(existing) : existing) : {
    uid,
    reputationScore: 0,
    blockchainScore: 0,
    dailyCheckInPoints: 0,
    totalCheckInDays: 0,
    lastCheckIn: null,
    interactionHistory: [],
    blockchainEvents: []
  };

  if (parsed.dailyCheckInPoints < pointsToMerge) {
    return res.status(400).json({ error: 'Not enough check-in points to merge' });
  }

  parsed.reputationScore += pointsToMerge;
  parsed.dailyCheckInPoints -= pointsToMerge;
  parsed.lastUpdated = new Date().toISOString();
  
  parsed.interactionHistory = [
    {
      type: 'weekly_merge',
      points: pointsToMerge,
      timestamp: new Date().toISOString(),
      description: `Merged ${pointsToMerge} check-in points to reputation`
    },
    ...(parsed.interactionHistory || []).slice(0, 99)
  ];

  await redis.set(`reputation:${uid}`, JSON.stringify(parsed));

  console.log(`[REPUTATION] Merged ${pointsToMerge} points for user: ${uid}`);
  return res.status(200).json({ success: true, data: parsed });
}

async function handleGetWalletState(uid: string, res: VercelResponse) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  const walletState = await redis.get(`wallet_state:${uid}`);
  
  if (!walletState) {
    return res.status(200).json({
      success: true,
      data: null
    });
  }

  const parsed = typeof walletState === 'string' ? JSON.parse(walletState) : walletState;
  return res.status(200).json({ success: true, data: parsed });
}

async function handleSaveWalletState(body: any, res: VercelResponse) {
  const { uid, walletState } = body;

  if (!uid || !walletState) {
    return res.status(400).json({ error: 'Missing uid or walletState' });
  }

  const stateToSave = {
    ...walletState,
    savedAt: new Date().toISOString()
  };

  await redis.set(`wallet_state:${uid}`, JSON.stringify(stateToSave));
  
  console.log(`[WALLET STATE] Saved for user: ${uid}, wallet: ${walletState.walletAddress}`);
  return res.status(200).json({ success: true, data: stateToSave });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { action, uid } = req.query;
      
      switch (action) {
        case 'checkVip':
          return handleCheckVip(uid as string, res);
        case 'getReputation':
          return handleGetReputation(uid as string, res);
        case 'getWalletState':
          return handleGetWalletState(uid as string, res);
        default:
          return res.status(200).json({ status: "API Ready", endpoints: ["checkVip", "getReputation", "getWalletState", "pioneer", "feedback", "saveReputation", "mergePoints", "saveWalletState"] });
      }
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { type, action } = body;

      switch (type || action) {
        case 'pioneer':
          return handleSavePioneer(body, res);
        case 'feedback':
          return handleSaveFeedback(body, res);
        case 'saveReputation':
          return handleSaveReputation(body, res);
        case 'mergePoints':
          return handleMergeCheckInPoints(body, res);
        case 'saveWalletState':
          return handleSaveWalletState(body, res);
        default:
          return res.status(400).json({ error: "Invalid type. Use 'pioneer', 'feedback', 'saveReputation', 'mergePoints', or 'saveWalletState'." });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error: any) {
    console.error("[USER API ERROR]", error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
