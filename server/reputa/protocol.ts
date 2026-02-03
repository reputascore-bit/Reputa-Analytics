// Core scoring utilities for Reputa Protocol v3.0
export const LEVEL_THRESHOLDS: number[] = [
  0, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000,
  50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000, 100000
];

export function calculateLevelFromPoints(points: number): number {
  // Levels 1..20; thresholds array has 21 entries (start at 0)
  for (let lvl = 20; lvl >= 1; lvl--) {
    const min = LEVEL_THRESHOLDS[lvl - 1];
    const max = LEVEL_THRESHOLDS[lvl];
    if (points >= min && points <= max) return lvl;
  }
  return 1;
}

export function computeWalletReputation(mainnet: number, testnet: number): number {
  // 60% mainnet + 20% testnet as defined
  return Math.round(0.6 * mainnet + 0.2 * testnet);
}

export function computeTotalScore(mainnet: number, testnet: number, appPoints: number): number {
  // Total = 0.8*(mainnet+testnet) + 0.2*appPoints (per spec)
  const walletRaw = mainnet + testnet;
  return Math.round(0.8 * walletRaw + 0.2 * appPoints);
}

export function applyInactivityErosion(points: number, weeksInactive: number, weeklyPenalty = 10): number {
  if (weeksInactive <= 0) return points;
  const penalty = weeklyPenalty * weeksInactive;
  return Math.max(0, points - penalty);
}

export function monthlyAgeBonus(months: number): number {
  // progressive up to 5 years (60 months). Simple linear bonus example.
  const maxBonus = 5000; // configurable cap
  const bonus = Math.floor((months / 60) * maxBonus);
  return Math.max(0, Math.min(maxBonus, bonus));
}

// Wallet-scan delta points heuristic
export function walletScanDelta(previous: any | null, snapshot: any): { delta: number; details: string[] } {
  let delta = 0;
  const details: string[] = [];

  if (!previous) {
    if ((snapshot.transactionCount || 0) > 0) {
      const txPoints = Math.min((snapshot.transactionCount || 0) * 5, 100);
      delta += txPoints;
      details.push(`Initial transactions: +${txPoints}`);
    }
    if ((snapshot.walletAge || 0) > 0) {
      const agePoints = Math.min(Math.floor((snapshot.walletAge || 0) / 30) * 10, 50);
      delta += agePoints;
      details.push(`Wallet age: +${agePoints}`);
    }
    return { delta, details };
  }

  const txDiff = (snapshot.transactionCount || 0) - (previous.transactionCount || 0);
  if (txDiff > 0) {
    const txPoints = Math.min(txDiff * 5, 50);
    delta += txPoints;
    details.push(`New transactions (${txDiff}): +${txPoints}`);
  }

  const contactsDiff = (snapshot.contactsCount || 0) - (previous.contactsCount || 0);
  if (contactsDiff > 0) {
    const contactsPoints = Math.min(contactsDiff * 2, 20);
    delta += contactsPoints;
    details.push(`New contacts (${contactsDiff}): +${contactsPoints}`);
  }

  return { delta, details };
}

export default {
  calculateLevelFromPoints,
  computeWalletReputation,
  computeTotalScore,
  applyInactivityErosion,
  monthlyAgeBonus,
  walletScanDelta,
};
