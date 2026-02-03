/**
 * Demo Mode System
 * Completely separate from real data, safe for testing and showcasing features
 */

import { getMongoDb } from '../db/mongodb';
import { PointsBreakdown } from './reputaPointsCalculator';

export interface DemoModeData {
  pioneerId: string;
  isActive: boolean;
  demoUser: {
    uid: string;
    username: string;
    email: string;
    primaryWallet: string;
  };
  demoWallets: {
    mainnet: {
      address: string;
      balance: number;
      totalTransactions: number;
    };
    testnet: {
      address: string;
      balance: number;
      totalTransactions: number;
    };
  };
  demoPoints: {
    mainnetScore: number;
    testnetScore: number;
    appPoints: number;
    totalReputationScore: number;
    level: string;
  };
  demoTransactions: Array<{
    hash: string;
    type: string;
    amount: number;
    timestamp: Date;
  }>;
  stats: {
    totalDailyLogins: number;
    confirmedReferrals: number;
    completedTasks: number;
  };
  activatedAt: Date;
  lastAccessedAt: Date;
}

export class DemoModeManager {
  private demoCache: Map<string, DemoModeData> = new Map();

  /**
   * Initialize or get demo mode for a user
   */
  async initializeDemoMode(pioneerId: string): Promise<DemoModeData> {
    // Check cache first
    if (this.demoCache.has(pioneerId)) {
      return this.demoCache.get(pioneerId)!;
    }

    const db = getMongoDb();

    // Check if demo mode already exists in MongoDB
    let demoData = await db.demoMode.findOne({ pioneerId });

    if (!demoData) {
      // Create new demo mode data
      const newDemoData: DemoModeData = {
        pioneerId,
        isActive: true,
        demoUser: {
          uid: `demo_${pioneerId}`,
          username: `Demo_User_${pioneerId.slice(0, 8)}`,
          email: `demo_${pioneerId}@example.com`,
          primaryWallet: '0x' + 'a'.repeat(40),
        },
        demoWallets: {
          mainnet: {
            address: '0x' + 'a'.repeat(40),
            balance: 250 + Math.random() * 500,
            totalTransactions: Math.floor(Math.random() * 100) + 30,
          },
          testnet: {
            address: '0x' + 'b'.repeat(40),
            balance: 100 + Math.random() * 200,
            totalTransactions: Math.floor(Math.random() * 50) + 20,
          },
        },
        demoPoints: {
          mainnetScore: 300 + Math.floor(Math.random() * 300),
          testnetScore: 100 + Math.floor(Math.random() * 150),
          appPoints: 80 + Math.floor(Math.random() * 100),
          totalReputationScore: 500 + Math.floor(Math.random() * 400),
          level: this.generateRandomLevel(),
        },
        demoTransactions: this.generateDemoTransactions(30),
        stats: {
          totalDailyLogins: Math.floor(Math.random() * 60) + 10,
          confirmedReferrals: Math.floor(Math.random() * 20) + 2,
          completedTasks: Math.floor(Math.random() * 50) + 5,
        },
        activatedAt: new Date(),
        lastAccessedAt: new Date(),
      };

      // Save to MongoDB
      await db.demoMode.insertOne(newDemoData as any);
      demoData = newDemoData as any;

      console.log(`🎮 Demo Mode activated for ${pioneerId}`);
    } else {
      // Update last accessed time
      await db.demoMode.updateOne(
        { pioneerId },
        { $set: { lastAccessedAt: new Date() } }
      );
    }

    // Cache it
    this.demoCache.set(pioneerId, demoData);

    return demoData;
  }

  /**
   * Get demo mode data
   */
  async getDemoModeData(pioneerId: string): Promise<DemoModeData | null> {
    if (this.demoCache.has(pioneerId)) {
      return this.demoCache.get(pioneerId)!;
    }

    const db = getMongoDb();
    const demoData = await db.demoMode.findOne({ pioneerId });

    if (demoData) {
      this.demoCache.set(pioneerId, demoData);
      return demoData;
    }

    return null;
  }

  /**
   * Update demo points (for simulation)
   */
  async updateDemoPoints(pioneerId: string, breakdown: PointsBreakdown): Promise<void> {
    const db = getMongoDb();

    const updatedData = {
      'demoPoints.mainnetScore': breakdown.mainnetScore,
      'demoPoints.testnetScore': breakdown.testnetScore,
      'demoPoints.appPoints': breakdown.appPoints,
      'demoPoints.totalReputationScore': breakdown.totalReputationScore,
      'demoPoints.level': breakdown.level,
      lastAccessedAt: new Date(),
    };

    await db.demoMode.updateOne({ pioneerId }, { $set: updatedData });

    // Update cache
    const cached = this.demoCache.get(pioneerId);
    if (cached) {
      cached.demoPoints = {
        mainnetScore: breakdown.mainnetScore,
        testnetScore: breakdown.testnetScore,
        appPoints: breakdown.appPoints,
        totalReputationScore: breakdown.totalReputationScore,
        level: breakdown.level,
      };
    }

    console.log(`✅ Demo points updated for ${pioneerId}`);
  }

  /**
   * Simulate a transaction in demo mode
   */
  async simulateDemoTransaction(
    pioneerId: string,
    transaction: {
      type: 'sent' | 'received' | 'stake' | 'dex';
      amount: number;
    }
  ): Promise<void> {
    const db = getMongoDb();

    const newTx = {
      hash: '0x' + Math.random().toString(16).substr(2),
      type: transaction.type,
      amount: transaction.amount,
      timestamp: new Date(),
    };

    await db.demoMode.updateOne(
      { pioneerId },
      {
        $push: { demoTransactions: newTx },
        $set: { lastAccessedAt: new Date() },
      }
    );

    // Update cache
    const cached = this.demoCache.get(pioneerId);
    if (cached) {
      cached.demoTransactions.push(newTx);
    }

    console.log(`📊 Demo transaction simulated: ${transaction.type} ${transaction.amount} Pi`);
  }

  /**
   * Simulate daily login in demo mode
   */
  async simulateDemoDailyLogin(pioneerId: string, withAds: boolean = false): Promise<number> {
    const db = getMongoDb();
    const points = withAds ? 5 : 3;

    await db.demoMode.updateOne(
      { pioneerId },
      {
        $inc: { 'stats.totalDailyLogins': 1 },
        $set: { lastAccessedAt: new Date() },
      }
    );

    // Update cache
    const cached = this.demoCache.get(pioneerId);
    if (cached) {
      cached.stats.totalDailyLogins += 1;
    }

    console.log(`📅 Demo daily login: +${points} points`);
    return points;
  }

  /**
   * Simulate referral confirmation in demo mode
   */
  async simulateDemoReferral(pioneerId: string): Promise<number> {
    const db = getMongoDb();
    const points = 10;

    await db.demoMode.updateOne(
      { pioneerId },
      {
        $inc: { 'stats.confirmedReferrals': 1 },
        $set: { lastAccessedAt: new Date() },
      }
    );

    // Update cache
    const cached = this.demoCache.get(pioneerId);
    if (cached) {
      cached.stats.confirmedReferrals += 1;
    }

    console.log(`👥 Demo referral confirmed: +${points} points`);
    return points;
  }

  /**
   * Simulate task completion in demo mode
   */
  async simulateDemoTask(pioneerId: string, taskPoints: number = 5): Promise<number> {
    const db = getMongoDb();

    await db.demoMode.updateOne(
      { pioneerId },
      {
        $inc: { 'stats.completedTasks': 1 },
        $set: { lastAccessedAt: new Date() },
      }
    );

    // Update cache
    const cached = this.demoCache.get(pioneerId);
    if (cached) {
      cached.stats.completedTasks += 1;
    }

    console.log(`✅ Demo task completed: +${taskPoints} points`);
    return taskPoints;
  }

  /**
   * Deactivate demo mode (switch to real mode)
   */
  async deactivateDemoMode(pioneerId: string): Promise<void> {
    const db = getMongoDb();

    await db.demoMode.updateOne(
      { pioneerId },
      { $set: { isActive: false } }
    );

    this.demoCache.delete(pioneerId);
    console.log(`🔒 Demo Mode deactivated for ${pioneerId}`);
  }

  /**
   * Reset demo mode data
   */
  async resetDemoMode(pioneerId: string): Promise<void> {
    const db = getMongoDb();

    await db.demoMode.deleteOne({ pioneerId });
    this.demoCache.delete(pioneerId);

    // Reinitialize with fresh data
    await this.initializeDemoMode(pioneerId);
    console.log(`🔄 Demo Mode reset for ${pioneerId}`);
  }

  /**
   * Export demo session as JSON
   */
  async exportDemoSession(pioneerId: string): Promise<string> {
    const demoData = await this.getDemoModeData(pioneerId);

    if (!demoData) {
      throw new Error('Demo mode not found');
    }

    return JSON.stringify(demoData, null, 2);
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Generate demo transactions
   */
  private generateDemoTransactions(
    count: number
  ): Array<{ hash: string; type: string; amount: number; timestamp: Date }> {
    const types = ['sent', 'received', 'stake', 'dex'];
    const transactions = [];

    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 180);
      transactions.push({
        hash: '0x' + Math.random().toString(16).substr(2),
        type: types[Math.floor(Math.random() * types.length)],
        amount: Math.random() * 100,
        timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      });
    }

    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate random level
   */
  private generateRandomLevel(): string {
    const levels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  /**
   * Get all demo sessions (admin)
   */
  async getAllDemoSessions(limit: number = 100): Promise<DemoModeData[]> {
    const db = getMongoDb();
    return await db.demoMode.find({}).limit(limit).toArray() as DemoModeData[];
  }

  /**
   * Cleanup old demo sessions (older than 7 days)
   */
  async cleanupOldDemoSessions(): Promise<number> {
    const db = getMongoDb();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await db.demoMode.deleteMany({ lastAccessedAt: { $lt: sevenDaysAgo } });

    console.log(`🧹 Cleaned up ${result.deletedCount} old demo sessions`);
    return result.deletedCount;
  }
}

export default { DemoModeManager };
