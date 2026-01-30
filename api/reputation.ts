/**
 * Reputation API - Real Reputation System with Vercel KV
 * Single Source of Truth for all Reputation Data
 * 
 * Features:
 * - KV storage as primary source
 * - Delta system for accumulation
 * - Daily check-in with same-day prevention
 * - Wallet snapshots for change detection
 * - Strict Demo mode separation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// ============= TYPE DEFINITIONS =============

interface ScoreEvent {
  id: string;
  type: 'daily_checkin' | 'ad_bonus' | 'wallet_scan' | 'streak_bonus' | 'transaction_detected' | 'manual_merge';
  points: number;
  timestamp: string;
  description: string;
  metadata?: Record<string, any>;
}

interface WalletSnapshot {
  id: string;
  walletAddress: string;
  timestamp: string;
  balance: number;
  transactionCount: number;
  lastActivityDate: string | null;
  contactsCount: number;
  stakingAmount: number;
  accountAgeDays: number;
}

interface DailyCheckInRecord {
  date: string; // YYYY-MM-DD format
  timestamp: string;
  streak: number;
  pointsEarned: number;
  adBonusClaimed: boolean;
  adBonusPoints: number;
}

interface ReputationData {
  uid: string;
  walletAddress: string | null;
  
  // Core scores
  totalReputationScore: number;
  reputationLevel: number;
  blockchainScore: number;
  checkInScore: number;
  
  // Snapshots and history
  walletSnapshots: WalletSnapshot[];
  dailyCheckinHistory: DailyCheckInRecord[];
  scoreEvents: ScoreEvent[];
  
  // Check-in state
  currentStreak: number;
  longestStreak: number;
  totalCheckInDays: number;
  lastCheckInDate: string | null;
  
  // Timestamps
  lastScanTimestamp: string | null;
  lastUpdated: string;
  createdAt: string;
}

// ============= SCORING RULES =============

const SCORING_RULES = {
  DAILY_CHECKIN: { basePoints: 3, cooldownHours: 24 },
  AD_BONUS: { basePoints: 5, perCheckIn: true },
  STREAK_MILESTONES: [
    { days: 7, bonus: 10, name: '7-Day Streak' },
    { days: 14, bonus: 25, name: '14-Day Streak' },
    { days: 30, bonus: 50, name: '30-Day Streak' },
    { days: 60, bonus: 100, name: '60-Day Streak' },
  ],
  WALLET_SCAN: {
    newTransaction: 2,
    balanceIncrease: 1, // per 10 Pi
    stakingBonus: 5, // per 100 Pi staked
    accountAge: 0.5, // per 30 days
  },
  LEVEL_THRESHOLDS: [
    { min: 0, max: 100, level: 1, name: 'Newcomer' },
    { min: 100, max: 500, level: 2, name: 'Active' },
    { min: 500, max: 1500, level: 3, name: 'Trusted' },
    { min: 1500, max: 3500, level: 4, name: 'Pioneer+' },
    { min: 3500, max: 7000, level: 5, name: 'Elite' },
    { min: 7000, max: 15000, level: 6, name: 'Legend' },
    { min: 15000, max: Infinity, level: 7, name: 'Architect' },
  ],
};

// ============= HELPER FUNCTIONS =============

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateLevel(score: number): number {
  for (const threshold of SCORING_RULES.LEVEL_THRESHOLDS) {
    if (score >= threshold.min && score < threshold.max) {
      return threshold.level;
    }
  }
  return 1;
}

function calculateStreakBonus(streak: number): number {
  let bonus = 0;
  for (const milestone of SCORING_RULES.STREAK_MILESTONES) {
    if (streak === milestone.days) {
      bonus = milestone.bonus;
      break;
    }
  }
  return bonus;
}

function getDefaultReputationData(uid: string): ReputationData {
  const now = new Date().toISOString();
  return {
    uid,
    walletAddress: null,
    totalReputationScore: 0,
    reputationLevel: 1,
    blockchainScore: 0,
    checkInScore: 0,
    walletSnapshots: [],
    dailyCheckinHistory: [],
    scoreEvents: [],
    currentStreak: 0,
    longestStreak: 0,
    totalCheckInDays: 0,
    lastCheckInDate: null,
    lastScanTimestamp: null,
    lastUpdated: now,
    createdAt: now,
  };
}

async function getReputationData(uid: string): Promise<ReputationData> {
  const key = `reputation_v2:${uid}`;
  const data = await redis.get(key);
  
  if (!data) {
    return getDefaultReputationData(uid);
  }
  
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  return parsed as ReputationData;
}

async function saveReputationData(data: ReputationData): Promise<void> {
  const key = `reputation_v2:${data.uid}`;
  data.lastUpdated = new Date().toISOString();
  data.reputationLevel = calculateLevel(data.totalReputationScore);
  await redis.set(key, JSON.stringify(data));
}

function recalculateTotalScore(data: ReputationData): number {
  // Recalculate from all score events
  let total = 0;
  for (const event of data.scoreEvents) {
    total += event.points;
  }
  return total;
}

// ============= API HANDLERS =============

async function handleGetReputation(uid: string, res: VercelResponse) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const data = await getReputationData(uid);
    
    return res.status(200).json({
      success: true,
      data: {
        uid: data.uid,
        walletAddress: data.walletAddress,
        totalReputationScore: data.totalReputationScore,
        reputationLevel: data.reputationLevel,
        blockchainScore: data.blockchainScore,
        checkInScore: data.checkInScore,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        totalCheckInDays: data.totalCheckInDays,
        lastCheckInDate: data.lastCheckInDate,
        lastScanTimestamp: data.lastScanTimestamp,
        lastUpdated: data.lastUpdated,
        recentEvents: data.scoreEvents.slice(0, 10),
        recentCheckins: data.dailyCheckinHistory.slice(0, 7),
      }
    });
  } catch (error: any) {
    console.error('[GET REPUTATION ERROR]', error);
    return res.status(500).json({ error: 'Failed to get reputation', message: error.message });
  }
}

async function handleDailyCheckIn(body: any, res: VercelResponse) {
  const { uid, walletAddress } = body;

  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const data = await getReputationData(uid);
    const today = getTodayDateString();
    const now = new Date().toISOString();

    // Check if already checked in today
    if (data.lastCheckInDate === today) {
      return res.status(200).json({
        success: false,
        error: 'Already checked in today',
        data: {
          totalReputationScore: data.totalReputationScore,
          reputationLevel: data.reputationLevel,
          currentStreak: data.currentStreak,
          lastCheckInDate: data.lastCheckInDate,
          nextCheckInAvailable: false,
        }
      });
    }

    // Calculate streak
    let newStreak = 1;
    if (data.lastCheckInDate) {
      const lastDate = new Date(data.lastCheckInDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        newStreak = data.currentStreak + 1;
      } else if (daysDiff > 1) {
        newStreak = 1; // Streak broken
      }
    }

    // Calculate points
    const basePoints = SCORING_RULES.DAILY_CHECKIN.basePoints;
    const streakBonus = calculateStreakBonus(newStreak);
    const totalPoints = basePoints + streakBonus;

    // Create check-in record
    const checkInRecord: DailyCheckInRecord = {
      date: today,
      timestamp: now,
      streak: newStreak,
      pointsEarned: totalPoints,
      adBonusClaimed: false,
      adBonusPoints: 0,
    };

    // Create score event
    const scoreEvent: ScoreEvent = {
      id: generateId(),
      type: 'daily_checkin',
      points: totalPoints,
      timestamp: now,
      description: `Daily check-in (+${basePoints} pts${streakBonus > 0 ? `, +${streakBonus} streak bonus` : ''})`,
      metadata: { streak: newStreak, streakBonus },
    };

    // Update data
    data.walletAddress = walletAddress || data.walletAddress;
    data.currentStreak = newStreak;
    data.longestStreak = Math.max(data.longestStreak, newStreak);
    data.totalCheckInDays += 1;
    data.lastCheckInDate = today;
    data.checkInScore += totalPoints;
    data.totalReputationScore += totalPoints;
    data.scoreEvents.unshift(scoreEvent);
    data.dailyCheckinHistory.unshift(checkInRecord);

    // Keep only last 100 events and 365 days of check-in history
    data.scoreEvents = data.scoreEvents.slice(0, 100);
    data.dailyCheckinHistory = data.dailyCheckinHistory.slice(0, 365);

    await saveReputationData(data);

    console.log(`[CHECKIN] User ${uid} checked in. Streak: ${newStreak}, Points: ${totalPoints}`);

    return res.status(200).json({
      success: true,
      data: {
        pointsEarned: totalPoints,
        basePoints,
        streakBonus,
        currentStreak: newStreak,
        totalReputationScore: data.totalReputationScore,
        reputationLevel: data.reputationLevel,
        totalCheckInDays: data.totalCheckInDays,
        nextCheckInAvailable: false,
      }
    });
  } catch (error: any) {
    console.error('[CHECKIN ERROR]', error);
    return res.status(500).json({ error: 'Failed to check in', message: error.message });
  }
}

async function handleClaimAdBonus(body: any, res: VercelResponse) {
  const { uid } = body;

  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const data = await getReputationData(uid);
    const today = getTodayDateString();
    const now = new Date().toISOString();

    // Check if checked in today
    if (data.lastCheckInDate !== today) {
      return res.status(400).json({
        success: false,
        error: 'Must check in first before claiming ad bonus',
      });
    }

    // Find today's check-in record
    const todayCheckin = data.dailyCheckinHistory.find(c => c.date === today);
    if (!todayCheckin) {
      return res.status(400).json({
        success: false,
        error: 'Check-in record not found',
      });
    }

    // Check if already claimed
    if (todayCheckin.adBonusClaimed) {
      return res.status(200).json({
        success: false,
        error: 'Ad bonus already claimed today',
        data: {
          totalReputationScore: data.totalReputationScore,
        }
      });
    }

    // Award ad bonus
    const adBonus = SCORING_RULES.AD_BONUS.basePoints;

    // Update check-in record
    todayCheckin.adBonusClaimed = true;
    todayCheckin.adBonusPoints = adBonus;

    // Create score event
    const scoreEvent: ScoreEvent = {
      id: generateId(),
      type: 'ad_bonus',
      points: adBonus,
      timestamp: now,
      description: `Ad bonus claimed (+${adBonus} pts)`,
    };

    data.checkInScore += adBonus;
    data.totalReputationScore += adBonus;
    data.scoreEvents.unshift(scoreEvent);
    data.scoreEvents = data.scoreEvents.slice(0, 100);

    await saveReputationData(data);

    console.log(`[AD BONUS] User ${uid} claimed ad bonus. Points: ${adBonus}`);

    return res.status(200).json({
      success: true,
      data: {
        pointsEarned: adBonus,
        totalReputationScore: data.totalReputationScore,
        reputationLevel: data.reputationLevel,
      }
    });
  } catch (error: any) {
    console.error('[AD BONUS ERROR]', error);
    return res.status(500).json({ error: 'Failed to claim ad bonus', message: error.message });
  }
}

async function handleWalletScan(body: any, res: VercelResponse) {
  const { uid, walletAddress, walletData } = body;

  if (!uid || !walletAddress) {
    return res.status(400).json({ error: 'Missing uid or walletAddress' });
  }

  try {
    const data = await getReputationData(uid);
    const now = new Date().toISOString();

    // Create new snapshot
    const newSnapshot: WalletSnapshot = {
      id: generateId(),
      walletAddress,
      timestamp: now,
      balance: walletData?.balance || 0,
      transactionCount: walletData?.transactionCount || 0,
      lastActivityDate: walletData?.lastActivityDate || null,
      contactsCount: walletData?.contactsCount || 0,
      stakingAmount: walletData?.stakingAmount || 0,
      accountAgeDays: walletData?.accountAgeDays || 0,
    };

    // Get previous snapshot for delta calculation
    const previousSnapshot = data.walletSnapshots[0];
    let deltaPoints = 0;
    const deltaDetails: string[] = [];

    if (previousSnapshot) {
      // Calculate delta from previous snapshot
      const newTxCount = newSnapshot.transactionCount - previousSnapshot.transactionCount;
      if (newTxCount > 0) {
        const txPoints = newTxCount * SCORING_RULES.WALLET_SCAN.newTransaction;
        deltaPoints += txPoints;
        deltaDetails.push(`${newTxCount} new transactions (+${txPoints} pts)`);
      }

      const balanceIncrease = newSnapshot.balance - previousSnapshot.balance;
      if (balanceIncrease > 0) {
        const balPoints = Math.floor(balanceIncrease / 10) * SCORING_RULES.WALLET_SCAN.balanceIncrease;
        if (balPoints > 0) {
          deltaPoints += balPoints;
          deltaDetails.push(`Balance increased (+${balPoints} pts)`);
        }
      }

      const stakingIncrease = newSnapshot.stakingAmount - previousSnapshot.stakingAmount;
      if (stakingIncrease > 0) {
        const stakingPoints = Math.floor(stakingIncrease / 100) * SCORING_RULES.WALLET_SCAN.stakingBonus;
        if (stakingPoints > 0) {
          deltaPoints += stakingPoints;
          deltaDetails.push(`Staking increased (+${stakingPoints} pts)`);
        }
      }
    } else {
      // First scan - calculate initial score
      const txPoints = newSnapshot.transactionCount * SCORING_RULES.WALLET_SCAN.newTransaction;
      const agePoints = Math.floor(newSnapshot.accountAgeDays / 30) * SCORING_RULES.WALLET_SCAN.accountAge;
      const stakingPoints = Math.floor(newSnapshot.stakingAmount / 100) * SCORING_RULES.WALLET_SCAN.stakingBonus;
      
      deltaPoints = txPoints + agePoints + stakingPoints;
      deltaDetails.push(`Initial scan: ${newSnapshot.transactionCount} tx, ${newSnapshot.accountAgeDays} days old`);
    }

    // Only add if there are new points
    if (deltaPoints > 0) {
      const scoreEvent: ScoreEvent = {
        id: generateId(),
        type: 'wallet_scan',
        points: deltaPoints,
        timestamp: now,
        description: deltaDetails.join(', ') || 'Wallet scan',
        metadata: { 
          walletAddress, 
          previousTxCount: previousSnapshot?.transactionCount || 0,
          newTxCount: newSnapshot.transactionCount,
        },
      };

      data.blockchainScore += deltaPoints;
      data.totalReputationScore += deltaPoints;
      data.scoreEvents.unshift(scoreEvent);
    }

    // Update data
    data.walletAddress = walletAddress;
    data.lastScanTimestamp = now;
    data.walletSnapshots.unshift(newSnapshot);
    data.walletSnapshots = data.walletSnapshots.slice(0, 50); // Keep last 50 snapshots
    data.scoreEvents = data.scoreEvents.slice(0, 100);

    await saveReputationData(data);

    console.log(`[WALLET SCAN] User ${uid}, Wallet: ${walletAddress}, Delta: ${deltaPoints}`);

    return res.status(200).json({
      success: true,
      data: {
        deltaPoints,
        deltaDetails,
        totalReputationScore: data.totalReputationScore,
        reputationLevel: data.reputationLevel,
        blockchainScore: data.blockchainScore,
        lastScanTimestamp: now,
        isFirstScan: !previousSnapshot,
      }
    });
  } catch (error: any) {
    console.error('[WALLET SCAN ERROR]', error);
    return res.status(500).json({ error: 'Failed to scan wallet', message: error.message });
  }
}

async function handleGetFullHistory(uid: string, res: VercelResponse) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const data = await getReputationData(uid);
    
    return res.status(200).json({
      success: true,
      data: {
        uid: data.uid,
        scoreEvents: data.scoreEvents,
        dailyCheckinHistory: data.dailyCheckinHistory,
        walletSnapshots: data.walletSnapshots,
        totalReputationScore: data.totalReputationScore,
        reputationLevel: data.reputationLevel,
      }
    });
  } catch (error: any) {
    console.error('[GET HISTORY ERROR]', error);
    return res.status(500).json({ error: 'Failed to get history', message: error.message });
  }
}

async function handleCanCheckIn(uid: string, res: VercelResponse) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const data = await getReputationData(uid);
    const today = getTodayDateString();
    
    const canCheckIn = data.lastCheckInDate !== today;
    const canClaimAdBonus = data.lastCheckInDate === today && 
      !data.dailyCheckinHistory.find(c => c.date === today)?.adBonusClaimed;

    return res.status(200).json({
      success: true,
      data: {
        canCheckIn,
        canClaimAdBonus,
        currentStreak: data.currentStreak,
        lastCheckInDate: data.lastCheckInDate,
        totalCheckInDays: data.totalCheckInDays,
      }
    });
  } catch (error: any) {
    console.error('[CAN CHECKIN ERROR]', error);
    return res.status(500).json({ error: 'Failed to check availability', message: error.message });
  }
}

// ============= MAIN HANDLER =============

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { action, uid } = req.query;
      
      switch (action) {
        case 'get':
        case 'getReputation':
          return handleGetReputation(uid as string, res);
        case 'canCheckIn':
          return handleCanCheckIn(uid as string, res);
        case 'history':
          return handleGetFullHistory(uid as string, res);
        default:
          return res.status(200).json({ 
            status: "Reputation API Ready", 
            version: "2.0",
            endpoints: {
              GET: ["get", "canCheckIn", "history"],
              POST: ["checkIn", "claimAdBonus", "walletScan"]
            }
          });
      }
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { action } = body;

      switch (action) {
        case 'checkIn':
          return handleDailyCheckIn(body, res);
        case 'claimAdBonus':
          return handleClaimAdBonus(body, res);
        case 'walletScan':
          return handleWalletScan(body, res);
        default:
          return res.status(400).json({ error: "Invalid action. Use 'checkIn', 'claimAdBonus', or 'walletScan'." });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error: any) {
    console.error("[REPUTATION API ERROR]", error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
