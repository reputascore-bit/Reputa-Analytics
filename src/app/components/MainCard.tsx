import { User, Shield, Zap, Award, Star, TrendingUp, Share2, Wallet, Activity, Calendar } from 'lucide-react'; 
import { AtomicTrustLevel, TRUST_LEVEL_COLORS } from '../protocol/atomicScoring';

interface MainCardProps {
  username: string;
  walletAddress: string;
  balance?: number;
  reputaScore: number;
  level: number;
  trustLevel: AtomicTrustLevel;
  progressPercent: number;
  pointsToNext: number;
  maxPoints: number;
  isVip?: boolean;
  onShare?: () => void;
  network?: string;
  snapshot?: {
    txs?: number;
    days?: number;
    recv?: number;
    sent?: number;
  };
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

const TRUST_LABELS: Record<AtomicTrustLevel, { label: string; nextLabel: string }> = {
  'Very Low Trust': { label: 'VERY LOW', nextLabel: 'Low' },
  'Low Trust': { label: 'LOW TRUST', nextLabel: 'Medium' },
  'Medium': { label: 'MEDIUM', nextLabel: 'Active' },
  'Active': { label: 'ACTIVE', nextLabel: 'Trusted' },
  'Trusted': { label: 'TRUSTED', nextLabel: 'Pioneer+' },
  'Pioneer+': { label: 'PIONEER+', nextLabel: 'Elite' },
  'Elite': { label: 'ELITE', nextLabel: 'Max' },
};

export function MainCard({
  username,
  walletAddress,
  balance,
  reputaScore,
  level,
  trustLevel,
  progressPercent,
  pointsToNext,
  maxPoints,
  isVip = false,
  onShare,
  network = 'Pi Mainnet',
  snapshot
}: MainCardProps) {
  const trustColors = TRUST_LEVEL_COLORS[trustLevel];
  const trustInfo = TRUST_LABELS[trustLevel];

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 16) return addr || 'Not Connected';
    return `${addr.slice(0, 8)}...${addr.slice(-4)}...${addr.endsWith('DEMO') ? 'DEMO' : addr.slice(-4)}`;
  };

  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(20, 22, 30, 0.98) 0%, rgba(15, 17, 23, 0.95) 100%)',
        border: `1px solid ${trustColors.border}`,
        boxShadow: `0 8px 32px ${trustColors.bg}40`,
      }}
    >
      <div className="p-5 sm:p-6">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${trustColors.bg} 0%, rgba(0, 217, 255, 0.15) 100%)`,
              border: `1.5px solid ${trustColors.border}`,
              boxShadow: `0 0 15px ${trustColors.bg}60`,
            }}
          >
            <User className="w-7 h-7" style={{ color: trustColors.text }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-black text-white truncate leading-none">{username || 'Pioneer'}</h2>
              {isVip && (
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase text-amber-400 bg-amber-500/20 border border-amber-500/30">
                  VIP
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-500">
              <Wallet className="w-3 h-3" />
              <span className="truncate">{formatAddress(walletAddress)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Network</p>
              <p className="text-[10px] font-black text-purple-400 uppercase">{network}</p>
            </div>
            {onShare && (
              <button
                onClick={onShare}
                className="p-2.5 rounded-xl transition-all active:scale-95 shrink-0 bg-white/5 border border-white/10 hover:border-purple-500/40"
              >
                <Share2 className="w-5 h-5 text-purple-400" />
              </button>
            )}
          </div>
        </div>

        {/* Scoring Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Reputation Score</p>
            <p className="text-3xl font-black" style={{ color: trustColors.text }}>{reputaScore.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Wallet Balance</p>
            <p className="text-3xl font-black text-white">{balance?.toFixed(2) || '0.00'} <span className="text-sm text-cyan-400">π</span></p>
          </div>
        </div>

        {/* Level & Trust Status */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Award className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs font-black text-gray-400 uppercase">Level {level}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase" style={{ color: trustColors.text }}>{trustInfo.label}</span>
              {LEVEL_ICONS[trustLevel]}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-[10px] font-black uppercase tracking-wider">
            <span className="text-gray-500">Progress to {trustInfo.nextLabel}</span>
            <span style={{ color: trustColors.text }}>{pointsToNext.toLocaleString()} PTS TO NEXT</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-white/5">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${trustColors.text} 0%, #00D9FF 100%)`,
                boxShadow: `0 0 15px ${trustColors.text}40`,
              }}
            />
          </div>
        </div>

        {/* Activity Snapshot - Integrated */}
        {snapshot && (
          <div className="pt-6 border-t border-white/[0.05]">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <Activity className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                <p className="text-xs font-black text-white">{snapshot.txs || 0}</p>
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Txns</p>
              </div>
              <div className="text-center">
                <Calendar className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                <p className="text-xs font-black text-white">{snapshot.days || 0}d</p>
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Days</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-4 h-4 text-emerald-900/40 mx-auto mb-1" />
                <p className="text-xs font-black text-emerald-400">{snapshot.recv || 0}</p>
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Recv</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-4 h-4 text-red-900/40 mx-auto mb-1 transform rotate-180" />
                <p className="text-xs font-black text-red-400">{snapshot.sent || 0}</p>
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Sent</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

