import { useMemo } from 'react';
import { User, Wallet, Activity, Calendar, Award, CheckCircle, Star, TrendingUp, Shield, Zap } from 'lucide-react';
import { WalletData, AppMode } from '../protocol/types';
import { 
  calculateAtomicReputation, 
  generateDemoActivityData, 
  getLevelProgress,
  AtomicTrustLevel,
  TRUST_LEVEL_COLORS,
  AtomicReputationResult
} from '../protocol/atomicScoring';
import { DailyCheckIn } from './DailyCheckIn';
import { MiningDaysWidget } from './MiningDaysWidget';
import { PointsExplainer } from './PointsExplainer';
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
  onPointsEarned: (points: number) => void;
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

  const atomicResult = useMemo<AtomicReputationResult>(() => {
    if (activityData) {
      return calculateAtomicReputation(activityData);
    }
    const demoData = generateDemoActivityData();
    demoData.accountAgeDays = walletData.accountAge || 180;
    demoData.internalTxCount = walletData.transactions?.length || 25;
    return calculateAtomicReputation(demoData);
  }, [activityData, walletData.accountAge, walletData.transactions?.length]);

  const levelProgress = useMemo(() => {
    return getLevelProgress(atomicResult.adjustedScore);
  }, [atomicResult.adjustedScore]);

  const trustColors = TRUST_LEVEL_COLORS[levelProgress.currentLevel];

  return (
    <div className={`space-y-6 animate-in fade-in duration-300 ${isRTL ? 'rtl' : ''}`}>
      <div className="glass-card p-6" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative flex-shrink-0">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${trustColors.bg} 0%, rgba(0, 217, 255, 0.2) 100%)`,
                border: `2px solid ${trustColors.border}`,
                boxShadow: `0 0 25px ${trustColors.bg}`,
              }}
            >
              <User className="w-10 h-10" style={{ color: trustColors.text }} />
            </div>
            <div 
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: '2px solid rgba(10, 11, 15, 0.9)',
              }}
            >
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="flex-1 text-center lg:text-left min-w-0">
            <h2 className="text-xl font-bold text-white mb-1 truncate">
              {username || 'Pioneer'}
            </h2>
            <p className="text-xs font-mono mb-3" style={{ color: 'rgba(160, 164, 184, 0.7)' }}>
              {formatAddress(walletData.address)}
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <span 
                className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5"
                style={{ 
                  background: trustColors.bg, 
                  color: trustColors.text,
                  border: `1px solid ${trustColors.border}`,
                }}
              >
                {LEVEL_ICONS[levelProgress.currentLevel]}
                {levelProgress.currentLevel}
              </span>
              {isProUser && (
                <span 
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 text-amber-400 bg-amber-500/20"
                  style={{ border: '1px solid rgba(245, 158, 11, 0.4)' }}
                >
                  <Star className="w-3 h-3" /> PRO
                </span>
              )}
            </div>
          </div>

          <div 
            className="p-4 rounded-2xl text-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${trustColors.bg} 0%, rgba(0, 217, 255, 0.1) 100%)`,
              border: `1px solid ${trustColors.border}`,
              minWidth: '140px',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: trustColors.text }}>
              {isRTL ? 'نقاط السمعة' : 'Reputa Score'}
            </p>
            <p className="text-3xl font-black" style={{ color: trustColors.text }}>
              {levelProgress.displayScore.toLocaleString()}
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(160, 164, 184, 0.6)' }}>
              {isRTL ? `المستوى ${levelProgress.levelIndex + 1} من 7` : `Level ${levelProgress.levelIndex + 1} of 7`}
            </p>
          </div>
        </div>

        {levelProgress.nextLevel && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase" style={{ color: 'rgba(160, 164, 184, 0.6)' }}>
                {isRTL ? 'التقدم نحو المستوى التالي' : 'Progress to Next Level'}
              </span>
              <span className="text-[10px] font-bold" style={{ color: trustColors.text }}>
                {levelProgress.pointsToNextLevel.toLocaleString()} {isRTL ? 'نقطة متبقية' : 'pts to'} {levelProgress.nextLevel}
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${levelProgress.progressInLevel}%`,
                  background: `linear-gradient(90deg, ${trustColors.text} 0%, ${trustColors.border} 100%)`,
                  boxShadow: `0 0 10px ${trustColors.text}`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          icon={<Wallet className="w-4 h-4 text-cyan-400" />}
          label={t('dashboard.balance')}
          value={`${walletData.balance.toFixed(2)} π`}
          color="cyan"
        />
        <StatCard 
          icon={<Activity className="w-4 h-4 text-purple-400" />}
          label={t('score.transactions')}
          value={walletData.transactions?.length?.toString() || '0'}
          color="purple"
        />
        <StatCard 
          icon={<Calendar className="w-4 h-4 text-emerald-400" />}
          label={t('score.accountAge')}
          value={`${walletData.accountAge || 0} ${isRTL ? 'يوم' : 'days'}`}
          color="emerald"
        />
        <StatCard 
          icon={<TrendingUp className="w-4 h-4 text-pink-400" />}
          label={isRTL ? 'النشاط الأسبوعي' : 'Weekly Activity'}
          value={`${atomicResult.piDex.regularActivity || 0}`}
          color="pink"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4 text-cyan-400">
            {isRTL ? 'ملخص النشاط' : 'Activity Summary'}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p className="text-[10px] font-bold uppercase text-emerald-400 mb-1">{isRTL ? 'مستلم' : 'Received'}</p>
              <p className="text-lg font-black text-emerald-400">
                {walletData.transactions?.filter(tx => tx.type === 'received').length || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <p className="text-[10px] font-bold uppercase text-red-400 mb-1">{isRTL ? 'مرسل' : 'Sent'}</p>
              <p className="text-lg font-black text-red-400">
                {walletData.transactions?.filter(tx => tx.type === 'sent').length || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
              <p className="text-[10px] font-bold uppercase text-cyan-400 mb-1">{isRTL ? 'الحجم' : 'Volume'}</p>
              <p className="text-lg font-black text-cyan-400">
                {(walletData.transactions?.reduce((acc, tx) => acc + tx.amount, 0) || 0).toFixed(1)}π
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4 text-purple-400">
            {isRTL ? 'تفاصيل السمعة الذرية' : 'Atomic Score Breakdown'}
          </h3>
          <div className="space-y-2">
            <ScoreRow label={isRTL ? 'عمر المحفظة' : 'Wallet Age'} value={atomicResult.walletAge.totalPoints} />
            <ScoreRow label={isRTL ? 'التفاعل' : 'Interaction'} value={atomicResult.interaction.totalPoints} />
            <ScoreRow label={isRTL ? 'معاملات Pi' : 'Pi Network'} value={atomicResult.piNetwork.totalPoints} />
            <ScoreRow label={isRTL ? 'Pi Dex' : 'Pi Dex'} value={atomicResult.piDex.totalPoints} />
            <ScoreRow label={isRTL ? 'Staking' : 'Staking'} value={atomicResult.staking.totalPoints} />
            <ScoreRow label={isRTL ? 'عقوبات' : 'Penalties'} value={-(atomicResult.externalPenalty.totalPenalty + atomicResult.suspiciousPenalty.totalPenalty)} isNegative />
          </div>
        </div>
      </div>

      <DailyCheckIn 
        onPointsEarned={onPointsEarned}
        isDemo={mode.mode === 'demo'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MiningDaysWidget 
          miningDays={walletData.accountAge || 0}
          isDemo={mode.mode === 'demo'}
        />
        <div className="glass-card p-4 flex items-center justify-between" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 217, 255, 0.2) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
              }}
            >
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                {isRTL ? 'إجمالي النقاط' : 'Total Points'}
              </p>
              <p className="text-xl font-black text-white">{userPoints.total.toLocaleString()}</p>
            </div>
          </div>
          <PointsExplainer 
            currentPoints={userPoints.total}
            checkInPoints={userPoints.checkIn}
            transactionPoints={userPoints.transactions}
            activityPoints={userPoints.activity}
            streakBonus={userPoints.streak}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, { border: string; text: string }> = {
    cyan: { border: 'rgba(0, 217, 255, 0.2)', text: 'text-cyan-400' },
    purple: { border: 'rgba(139, 92, 246, 0.2)', text: 'text-purple-400' },
    emerald: { border: 'rgba(16, 185, 129, 0.2)', text: 'text-emerald-400' },
    pink: { border: 'rgba(236, 72, 153, 0.2)', text: 'text-pink-400' },
  };
  const colors = colorMap[color] || colorMap.cyan;

  return (
    <div className="glass-card p-3" style={{ border: `1px solid ${colors.border}` }}>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className={`text-[9px] font-bold uppercase ${colors.text}`}>{label}</span>
      </div>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}

function ScoreRow({ label, value, isNegative }: { label: string; value: number; isNegative?: boolean }) {
  const displayValue = isNegative ? value : value;
  const color = displayValue >= 0 ? (displayValue > 10 ? 'text-emerald-400' : 'text-gray-400') : 'text-red-400';
  
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
      <span className="text-xs" style={{ color: 'rgba(160, 164, 184, 0.8)' }}>{label}</span>
      <span className={`text-sm font-bold ${color}`}>
        {displayValue >= 0 ? '+' : ''}{displayValue}
      </span>
    </div>
  );
}
