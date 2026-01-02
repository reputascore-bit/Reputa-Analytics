/**
 * Report Module - Generate reputation reports (VIP/Regular) 
 * Updated to reflect real Testnet data logic
 */

import type { ReputationReport, WalletData, StakingData, MiningData, Alert } from './types';
import { calculateReputationScore, determineTrustLevel } from './scoring';

/**
 * Generate comprehensive reputation report
 * يستخدم الآن البيانات الحقيقية الممررة من دالة fetchWalletData
 */
export function generateReport(
  userId: string,
  walletData: WalletData,
  stakingData?: StakingData,
  miningData?: MiningData,
  isVIP: boolean = false
): ReputationReport {
  // الحساب يعتمد الآن على الأرقام الحقيقية (الرصيد، عدد العمليات، عمر الحساب)
  const scores = calculateReputationScore(walletData, stakingData, miningData);
  const trustLevel = determineTrustLevel(scores.totalScore);
  const alerts = generateAlerts(walletData, stakingData, miningData, scores);
  
  return {
    userId,
    username: walletData.username,
    walletAddress: walletData.address,
    reportDate: new Date(),
    scores,
    walletData,
    stakingData,
    miningData,
    trustLevel,
    isVIP,
    alerts
  };
}

/**
 * Format VIP report (full details)
 * يظهر جميع المعاملات الحقيقية الـ 10 التي جلبناها من البلوكشين
 */
export function formatVIPReport(report: ReputationReport): any {
  return {
    ...report,
    transactions: {
      full: report.walletData.transactions.map(tx => ({
        ...tx,
        scoreDetails: tx.score,
        // وسم المعاملات المشبوهة بناءً على منطق السمعة الخاص بك
        flagged: tx.score && tx.score.suspiciousPenalty < 0
      })),
      count: report.walletData.transactions.length
    },
    insights: generateInsights(report)
  };
}

/**
 * Format regular report (limited to last 3 transactions)
 * يطبق القيود على المستخدمين العاديين مع الحفاظ على البيانات الحقيقية
 */
export function formatRegularReport(report: ReputationReport): any {
  return {
    userId: report.userId,
    username: report.username,
    walletAddress: report.walletAddress,
    reportDate: report.reportDate,
    totalScore: report.scores.totalScore,
    trustLevel: report.trustLevel,
    transactions: {
      // اقتطاع أول 3 معاملات فقط من البيانات الحقيقية
      limited: report.walletData.transactions.slice(0, 3).map(tx => ({
        id: tx.id,
        timestamp: tx.timestamp,
        amount: tx.amount,
        type: tx.type,
        points: tx.score?.totalPoints || 0
      })),
      message: 'Upgrade to VIP for all transactions and detailed analysis'
    },
    basicScores: {
      walletAge: report.scores.walletAgeScore,
      transactions: report.scores.transactionScore,
      staking: report.scores.stakingScore,
      miningBonus: report.scores.miningScore > 0 ? report.scores.miningScore : 'Not available'
    },
    alerts: report.alerts
  };
}

/**
 * Generate alerts based on real blockchain analysis
 */
function generateAlerts(
  walletData: WalletData,
  stakingData?: StakingData,
  miningData?: MiningData,
  scores?: any
): Alert[] {
  const alerts: Alert[] = [];
  
  // تنبيهات تعدين Pi الحقيقية
  if (miningData) {
    if (miningData.verificationStatus === 'verified') {
      alerts.push({
        type: 'success',
        message: 'Mining behavior verified',
        timestamp: new Date(),
        details: `Consistency bonus applied: +${miningData.score} points`
      });
    } else if (miningData.verificationStatus === 'suspicious') {
      alerts.push({
        type: 'warning',
        message: 'Mining pattern inconsistency',
        timestamp: new Date(),
        details: miningData.explanation
      });
    }
  }
  
  // تحليل المعاملات الخارجية الحقيقية (External)
  // في Testnet، المعاملات الخارجية غالباً ما تشير إلى سحوبات خارج بيئة التطبيقات
  const external = walletData.transactions.filter(tx => tx.type === 'external');
  if (external.length > 3) {
    alerts.push({
      type: 'info',
      message: 'High external activity',
      timestamp: new Date(),
      details: 'Frequent external transfers reduce ecosystem trust score'
    });
  }
  
  // تنبيه الرصيد المنخفض (إضافة جديدة للمنطق الحقيقي)
  if (walletData.balance < 1) {
    alerts.push({
      type: 'warning',
      message: 'Low wallet balance',
      timestamp: new Date(),
      details: 'Insufficient balance might affect transaction reputation'
    });
  }
  
  return alerts;
}

/**
 * Generate VIP insights
 */
function generateInsights(report: ReputationReport): string[] {
  const insights: string[] = [];
  
  const totalTx = report.walletData.totalTransactions || 1;
  const internalTx = report.walletData.transactions.filter(t => t.type === 'internal').length;
  const internalRatio = internalTx / Math.min(report.walletData.transactions.length, 10);
  
  if (internalRatio > 0.7) {
    insights.push('Strong Ecosystem Integration: Most of your Pi movement is within internal apps.');
  }
  
  if (report.walletData.balance > 100) {
    insights.push('Significant Holder: Your balance indicates long-term commitment to the network.');
  }

  if (report.miningData) {
    insights.push(`Mining Activity: You have ${report.miningData.totalDays} days of recorded history.`);
  }
  
  return insights;
}

export function exportReportJSON(report: ReputationReport, isVIP: boolean): string {
  const formatted = isVIP ? formatVIPReport(report) : formatRegularReport(report);
  return JSON.stringify(formatted, null, 2);
}
