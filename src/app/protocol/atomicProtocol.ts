/**
 * Atomic Protocol - Unified Reputation System
 * Single Source of Truth for all Reputation Calculations
 * Binds to user identity: username + id + walletAddress
 * 
 * Version: 1.0
 * Name: ATOMIC PROTOCOL
 */

import { AtomicReputationResult, AtomicTrustLevel } from './atomicScoring';

/**
 * User Identity - Unique binding for reputation data
 */
export interface AtomicUserIdentity {
  username: string;
  uid: string;  // pi user id
  walletAddress: string;
  createdAt: Date;
}

/**
 * Unified Reputation Data - Stored in database
 */
export interface AtomicReputationData {
  userIdentity: AtomicUserIdentity;
  score: number;
  trustLevel: AtomicTrustLevel;
  rawScore: number;
  adjustedScore: number;
  
  // Component Scores
  walletAgeScore: number;
  interactionScore: number;
  piNetworkScore: number;
  piDexScore: number;
  stakingScore: number;
  
  // Penalties
  externalTxPenalty: number;
  suspiciousPenalty: number;
  
  // Metadata
  lastUpdated: Date;
  updateReason?: string;
  previousScore?: number;
}

/**
 * Atomic Protocol Configuration
 */
export const ATOMIC_PROTOCOL_CONFIG = {
  NAME: 'ATOMIC PROTOCOL',
  VERSION: '1.0',
  
  // Score Ranges  
  SCORE_MIN: 0,
  SCORE_MAX: 10000,
  
  // Component Weights (sum = 100%)
  WEIGHTS: {
    WALLET_AGE: 0.15,      // 15%
    INTERACTION: 0.20,      // 20%
    PI_NETWORK: 0.25,       // 25%
    PI_DEX: 0.15,           // 15%
    STAKING: 0.25,          // 25%
  },
  
  // Penalty Multipliers
  PENALTIES: {
    EXTERNAL_TX_MIN: 50,
    EXTERNAL_TX_MAX: 500,
    SUSPICIOUS_MIN: 100,
    SUSPICIOUS_MAX: 1000,
  },
  
  // Trust Level Thresholds
  TRUST_THRESHOLDS: {
    'Very Low Trust': { min: 0, max: 1000 },
    'Low Trust': { min: 1000, max: 2000 },
    'Medium': { min: 2000, max: 4000 },
    'Active': { min: 4000, max: 6000 },
    'Trusted': { min: 6000, max: 7500 },
    'Pioneer+': { min: 7500, max: 8500 },
    'Elite': { min: 8500, max: 10000 },
  },
};

/**
 * Database Keys for Atomic Protocol Data
 */
export const ATOMIC_DB_KEYS = {
  // User identity binding
  getIdentityKey: (username: string, uid: string, walletAddress: string) => 
    `atomic:identity:${username}:${uid}:${walletAddress}`,
  
  // Reputation data
  getReputationKey: (username: string, uid: string, walletAddress: string) =>
    `atomic:reputation:${username}:${uid}:${walletAddress}`,
  
  // Score history
  getHistoryKey: (username: string, uid: string, walletAddress: string) =>
    `atomic:history:${username}:${uid}:${walletAddress}`,
  
  // User index (for lookups)
  getUserIndexKey: (username: string) =>
    `atomic:users:${username}`,
  
  // Composite score
  getCompositeScoreKey: (username: string, uid: string, walletAddress: string) =>
    `atomic:composite:${username}:${uid}:${walletAddress}`,
};

/**
 * Convert AtomicReputationResult to Unified Reputation Data
 */
export function convertToUnifiedReputationData(
  result: AtomicReputationResult,
  userIdentity: AtomicUserIdentity
): AtomicReputationData {
  return {
    userIdentity,
    score: result.adjustedScore,
    trustLevel: result.trustLevel,
    rawScore: result.rawScore,
    adjustedScore: result.adjustedScore,
    
    walletAgeScore: result.walletAge.totalPoints,
    interactionScore: result.interaction.totalPoints,
    piNetworkScore: result.piNetwork.totalPoints,
    piDexScore: result.piDex.totalPoints,
    stakingScore: result.staking.totalPoints,
    
    externalTxPenalty: result.externalPenalty.totalPenalty,
    suspiciousPenalty: result.suspiciousPenalty.totalPenalty,
    
    lastUpdated: new Date(),
    updateReason: 'Atomic Protocol calculation',
  };
}

/**
 * Validate user identity
 */
export function validateUserIdentity(identity: AtomicUserIdentity): boolean {
  return !!(
    identity.username &&
    identity.uid &&
    identity.walletAddress &&
    identity.username.length > 0 &&
    identity.uid.length > 0 &&
    identity.walletAddress.length > 0
  );
}

/**
 * Format Atomic Protocol score for display
 */
export function formatAtomicScore(score: number): string {
  return score.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Get trust level color
 */
export const ATOMIC_TRUST_LEVEL_COLORS: Record<AtomicTrustLevel, string> = {
  'Very Low Trust': '#EF4444',   // red-500
  'Low Trust': '#F97316',        // orange-500
  'Medium': '#EAB308',           // yellow-500
  'Active': '#3B82F6',           // blue-500
  'Trusted': '#10B981',          // emerald-500
  'Pioneer+': '#8B5CF6',         // purple-500
  'Elite': '#FFD700',            // gold
};

/**
 * Get trust level icon name
 */
export function getTrustLevelIcon(trustLevel: AtomicTrustLevel): string {
  const iconMap: Record<AtomicTrustLevel, string> = {
    'Very Low Trust': 'AlertCircle',
    'Low Trust': 'AlertTriangle',
    'Medium': 'HelpCircle',
    'Active': 'Activity',
    'Trusted': 'CheckCircle',
    'Pioneer+': 'Star',
    'Elite': 'Crown',
  };
  return iconMap[trustLevel] || 'Shield';
}
