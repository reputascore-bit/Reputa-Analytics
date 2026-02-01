import React, { useMemo } from 'react'; 
import { User, Wallet, Activity, Calendar, Award, Star, TrendingUp, Shield, Zap, Target, Mail, ShieldCheck, HelpCircle, FileText } from 'lucide-react';
import { WalletData, AppMode } from '../protocol/types';
import { 
  calculateAtomicReputation, 
  generateDemoActivityData, 
  getLevelProgress,
  AtomicTrustLevel,
  TRUST_LEVEL_COLORS,
  AtomicReputationResult,
  getBackendScoreCap
} from '../protocol/atomicScoring';
import { DailyCheckIn } from './DailyCheckIn';
import { useLanguage } from '../hooks/useLanguage';
import { WalletActivityData } from '../services/piNetworkData';

interface ProfileSectionProps {
  walletData: WalletData;
  username: string;
  isProUser: boolean;
  mode: AppMode;
  userPoints: {
    total: number;
    checkIn: number;
    transactions: number;
    activity: number;
    streak: number;
  };
  onPointsEarned: (points: number, type: 'checkin' | 'merge') => void;
  activityData?: WalletActivityData;
}

function formatAddress(address: string): string {
  if (!address || address.length < 16) return address || 'Not Connected';
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

const LEVEL_ICONS: Record<AtomicTrustLevel, React.ReactNode> = {
  'Very Low Trust': <Shield className="w-4 h-4" />,
  'Low Trust': <Shield className="w-4 h-4" />,
  'Medium': <Shield className="w-4 h-4" />,
  'Active': <Zap className="w-4 h-4" />,
  'Trusted': <Star className="w-4 h-4" />,
  'Pioneer+': <Award className="w-4 h-4" />,
  'Elite': <Award className="w-4 h-4" />,
};

const LEVEL_NAMES: Record<AtomicTrustLevel, { en: string; ar: string }> = {
  'Very Low Trust': { en: 'Very Low', ar: 'ضعيف جداً' },
  'Low Trust': { en: 'Low', ar: 'ضعيف' },
  'Medium': { en: 'Medium', ar: 'متوسط' },
  'Active': { en: 'Active', ar: 'نشط' },
  'Trusted': { en: 'Trusted', ar: 'موثوق' },
  'Pioneer+': { en: 'Pioneer+', ar: 'رائد+' },
  'Elite': { en: 'Elite', ar: 'نخبة' },
};

export function ProfileSection({ 
  walletData, 
  username, 
  isProUser, 
  mode,
  userPoints,
  onPointsEarned,
  activityData
}: ProfileSectionProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const scoreCap = getBackendScoreCap();

  const atomicResult = useMemo<AtomicReputationResult>(() => {
    if (activityData) {
      return calculateAtomicReputation(activityData);
    }
    const demoData = generateDemoActivityData();
    demoData.accountAgeDays = walletData.accountAge || 180;
    demoData.internalTxCount = walletData.transactions?.length || 25;
    demoData.dailyCheckins = 0;
    demoData.adBonuses = 0;
    return calculateAtomicReputation(demoData);
  }, [activityData, walletData.accountAge, walletData.transactions?.length]);

  const levelProgress = useMemo(() => {
    const earnedPoints = userPoints.checkIn + userPoints.activity + userPoints.streak;
    return getLevelProgress(atomicResult.adjustedScore + earnedPoints);
  }, [atomicResult.adjustedScore, userPoints.checkIn, userPoints.activity, userPoints.streak]);

  const trustColors = TRUST_LEVEL_COLORS[levelProgress.currentLevel];
  const levelName = LEVEL_NAMES[levelProgress.currentLevel];

  return (
    <div className={`space-y-4 animate-in fade-in duration-300 ${isRTL ? 'rtl' : ''}`}>
      {/* Secondary Actions / Support */}
      <div className="flex justify-center items-center gap-6 py-2">
        <button className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <span className="text-[8px] font-bold text-gray-500 uppercase">Privacy</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-[8px] font-bold text-gray-500 uppercase">Terms</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <span className="text-[8px] font-bold text-gray-500 uppercase">Help</span>
        </button>
        <a 
          href="mailto:reputa.score@gmail.com" 
          className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <Mail className="w-4 h-4 text-red-400" />
          <span className="text-[8px] font-bold text-gray-500 uppercase">Support</span>
        </a>
      </div>

      {/* Check In Component */}
      <DailyCheckIn 
        onPointsEarned={onPointsEarned}
        isDemo={mode.mode === 'demo'}
      />

      {/* Score Breakdown Section */}
      <div 
        className="rounded-2xl p-5"
        style={{ 
          background: 'rgba(15, 17, 23, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.1)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-purple-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">{isRTL ? 'تفاصيل السمعة' : 'Reputation Breakdown'}</h3>
        </div>
        <div className="space-y-3">
          <ScoreRow label={isRTL ? 'عمر المحفظة' : 'Account Maturity'} value={atomicResult.walletAge.totalPoints} max={200} />
          <ScoreRow label={isRTL ? 'التفاعل' : 'Network Interaction'} value={atomicResult.interaction.totalPoints} max={300} />
          <ScoreRow label={isRTL ? 'معاملات Pi' : 'Protocol Usage'} value={atomicResult.piNetwork.totalPoints} max={250} />
          <ScoreRow label={isRTL ? 'Pi Dex' : 'DEX Activity'} value={atomicResult.piDex.totalPoints} max={200} />
          <ScoreRow label={isRTL ? 'Staking' : 'Trust Staking'} value={atomicResult.staking.totalPoints} max={100} />
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, max, isNegative }: { label: string; value: number; max?: number; isNegative?: boolean }) {
  const displayValue = value;
  const color = displayValue >= 0 ? (displayValue > 10 ? 'text-emerald-400' : 'text-gray-400') : 'text-red-400';
  const percentage = max ? Math.min(100, (Math.abs(value) / max) * 100) : 0;
  
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-gray-400">{label}</span>
        <span className={`text-xs font-bold ${color}`}>
          {displayValue >= 0 ? '+' : ''}{displayValue}
        </span>
      </div>
      {max && !isNegative && (
        <div className="w-full h-1 rounded-full overflow-hidden bg-white/5">
          <div 
            className="h-full rounded-full transition-all duration-700"
            style={{ 
              width: `${percentage}%`,
              background: displayValue > 0 ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.1)',
            }}
          />
        </div>
      )}
    </div>
  );
}

