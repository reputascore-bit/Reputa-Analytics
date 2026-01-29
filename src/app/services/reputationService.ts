/**
 * Unified Reputation Service
 * Single source of truth for all reputation-related operations
 * Connects to the backend API for persistent storage
 */

import { 
  calculateAtomicReputation, 
  WalletActivityData,
  AtomicReputationResult,
  AtomicTrustLevel,
  getLevelProgress
} from '../protocol/atomicScoring';

export interface UserReputationState {
  uid: string;
  reputationScore: number;
  dailyCheckInPoints: number;
  totalCheckInDays: number;
  lastCheckIn: string | null;
  lastAdWatch: string | null;
  streak: number;
  adClaimedForCheckIn: string | null;
  lastCheckInId: string | null;
  interactionHistory: InteractionEvent[];
  lastUpdated: string | null;
  isNew?: boolean;
}

export interface InteractionEvent {
  type: string;
  points: number;
  timestamp: string;
  description: string;
}

const API_BASE = '/api/user';

export class ReputationService {
  private static instance: ReputationService;
  private currentState: UserReputationState | null = null;
  private uid: string | null = null;

  private constructor() {}

  static getInstance(): ReputationService {
    if (!ReputationService.instance) {
      ReputationService.instance = new ReputationService();
    }
    return ReputationService.instance;
  }

  setUserId(uid: string) {
    this.uid = uid;
  }

  getUserId(): string | null {
    return this.uid;
  }

  async loadUserReputation(uid: string): Promise<UserReputationState> {
    this.uid = uid;

    try {
      const response = await fetch(`${API_BASE}?action=getReputation&uid=${encodeURIComponent(uid)}`);
      const data = await response.json();

      if (data.success && data.data) {
        this.currentState = {
          uid,
          reputationScore: data.data.reputationScore || 0,
          dailyCheckInPoints: data.data.dailyCheckInPoints || 0,
          totalCheckInDays: data.data.totalCheckInDays || 0,
          lastCheckIn: data.data.lastCheckIn || null,
          lastAdWatch: data.data.lastAdWatch || null,
          streak: data.data.streak || 0,
          adClaimedForCheckIn: data.data.adClaimedForCheckIn || null,
          lastCheckInId: data.data.lastCheckInId || null,
          interactionHistory: data.data.interactionHistory || [],
          lastUpdated: data.data.lastUpdated || null,
          isNew: data.data.isNew || false,
        };
        return this.currentState;
      }
    } catch (error) {
      console.error('[ReputationService] Error loading reputation:', error);
    }

    const fallback = this.getLocalState(uid);
    if (fallback) {
      this.currentState = fallback;
      return fallback;
    }

    this.currentState = this.createNewState(uid);
    return this.currentState;
  }

  private createNewState(uid: string): UserReputationState {
    return {
      uid,
      reputationScore: 0,
      dailyCheckInPoints: 0,
      totalCheckInDays: 0,
      lastCheckIn: null,
      lastAdWatch: null,
      streak: 0,
      adClaimedForCheckIn: null,
      lastCheckInId: null,
      interactionHistory: [],
      lastUpdated: null,
      isNew: true,
    };
  }

  private getLocalState(uid: string): UserReputationState | null {
    try {
      const stored = localStorage.getItem(`reputation_${uid}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('[ReputationService] Error reading local state:', e);
    }
    return null;
  }

  private saveLocalState(state: UserReputationState) {
    try {
      localStorage.setItem(`reputation_${state.uid}`, JSON.stringify(state));
    } catch (e) {
      console.error('[ReputationService] Error saving local state:', e);
    }
  }

  async saveReputation(state: UserReputationState): Promise<boolean> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveReputation',
          ...state,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        this.currentState = state;
        this.saveLocalState(state);
        return true;
      }
    } catch (error) {
      console.error('[ReputationService] Error saving reputation:', error);
      this.saveLocalState(state);
    }
    return false;
  }

  async performDailyCheckIn(): Promise<{ success: boolean; pointsEarned: number; newState: UserReputationState }> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
    }

    const now = new Date();
    const checkInId = `checkin_${now.getTime()}`;
    
    let newStreak = 1;
    if (this.currentState.lastCheckIn) {
      const lastDate = new Date(this.currentState.lastCheckIn);
      const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
      if (hoursDiff >= 24 && hoursDiff < 48) {
        newStreak = this.currentState.streak + 1;
      }
    }

    const CHECKIN_POINTS = 3;
    const streakBonus = newStreak === 7 ? 10 : 0;
    const totalPointsEarned = CHECKIN_POINTS + streakBonus;

    const newState: UserReputationState = {
      ...this.currentState,
      dailyCheckInPoints: this.currentState.dailyCheckInPoints + totalPointsEarned,
      totalCheckInDays: this.currentState.totalCheckInDays + 1,
      lastCheckIn: now.toISOString(),
      lastCheckInId: checkInId,
      streak: newStreak,
      interactionHistory: [
        {
          type: 'daily_checkin',
          points: totalPointsEarned,
          timestamp: now.toISOString(),
          description: `Daily check-in (+${CHECKIN_POINTS} pts${streakBonus > 0 ? `, +${streakBonus} streak bonus` : ''})`,
        },
        ...this.currentState.interactionHistory.slice(0, 99),
      ],
      lastUpdated: now.toISOString(),
    };

    await this.saveReputation(newState);
    this.currentState = newState;

    return {
      success: true,
      pointsEarned: totalPointsEarned,
      newState,
    };
  }

  async claimAdBonus(): Promise<{ success: boolean; pointsEarned: number; newState: UserReputationState }> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
    }

    const now = new Date();
    const AD_BONUS_POINTS = 5;

    const newState: UserReputationState = {
      ...this.currentState,
      dailyCheckInPoints: this.currentState.dailyCheckInPoints + AD_BONUS_POINTS,
      lastAdWatch: now.toISOString(),
      adClaimedForCheckIn: this.currentState.lastCheckInId,
      interactionHistory: [
        {
          type: 'ad_bonus',
          points: AD_BONUS_POINTS,
          timestamp: now.toISOString(),
          description: `Ad bonus claimed (+${AD_BONUS_POINTS} pts)`,
        },
        ...this.currentState.interactionHistory.slice(0, 99),
      ],
      lastUpdated: now.toISOString(),
    };

    await this.saveReputation(newState);
    this.currentState = newState;

    return {
      success: true,
      pointsEarned: AD_BONUS_POINTS,
      newState,
    };
  }

  async mergeCheckInPointsToReputation(pointsToMerge?: number): Promise<{ success: boolean; newState: UserReputationState }> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
    }

    const points = pointsToMerge || this.currentState.dailyCheckInPoints;

    if (points <= 0) {
      return { success: false, newState: this.currentState };
    }

    if (points > this.currentState.dailyCheckInPoints) {
      return { success: false, newState: this.currentState };
    }

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mergePoints',
          uid: this.uid,
          pointsToMerge: points,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const newState: UserReputationState = {
          ...this.currentState,
          reputationScore: data.data.reputationScore,
          dailyCheckInPoints: data.data.dailyCheckInPoints,
          interactionHistory: data.data.interactionHistory || this.currentState.interactionHistory,
          lastUpdated: data.data.lastUpdated,
        };

        this.currentState = newState;
        this.saveLocalState(newState);
        return { success: true, newState };
      }
    } catch (error) {
      console.error('[ReputationService] Error merging points:', error);
    }

    const now = new Date();
    const newState: UserReputationState = {
      ...this.currentState,
      reputationScore: this.currentState.reputationScore + points,
      dailyCheckInPoints: this.currentState.dailyCheckInPoints - points,
      interactionHistory: [
        {
          type: 'weekly_merge',
          points: points,
          timestamp: now.toISOString(),
          description: `Merged ${points} check-in points to reputation`,
        },
        ...this.currentState.interactionHistory.slice(0, 99),
      ],
      lastUpdated: now.toISOString(),
    };

    this.currentState = newState;
    this.saveLocalState(newState);
    return { success: true, newState };
  }

  canCheckIn(): { canCheckIn: boolean; countdown: string; hoursRemaining: number } {
    if (!this.currentState?.lastCheckIn) {
      return { canCheckIn: true, countdown: '', hoursRemaining: 0 };
    }

    const now = new Date();
    const lastCheckInDate = new Date(this.currentState.lastCheckIn);
    const timeDiff = now.getTime() - lastCheckInDate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    const COOLDOWN_HOURS = 24;

    if (hoursDiff >= COOLDOWN_HOURS) {
      return { canCheckIn: true, countdown: '', hoursRemaining: 0 };
    }

    const remainingMs = (COOLDOWN_HOURS * 60 * 60 * 1000) - timeDiff;
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
    const countdown = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return { canCheckIn: false, countdown, hoursRemaining: COOLDOWN_HOURS - hoursDiff };
  }

  canClaimAdBonus(): boolean {
    if (!this.currentState?.lastCheckIn) return false;
    if (!this.currentState.lastCheckInId) return false;
    return this.currentState.adClaimedForCheckIn !== this.currentState.lastCheckInId;
  }

  getCurrentState(): UserReputationState | null {
    return this.currentState;
  }

  getReputationProgress(): ReturnType<typeof getLevelProgress> | null {
    if (!this.currentState) return null;
    return getLevelProgress(this.currentState.reputationScore);
  }

  calculateFullReputation(walletData: WalletActivityData): AtomicReputationResult {
    return calculateAtomicReputation(walletData);
  }
}

export const reputationService = ReputationService.getInstance();
