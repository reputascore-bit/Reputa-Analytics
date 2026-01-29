import { useState } from 'react';
import { Info, X, Zap, Gift, Activity, TrendingUp, Award, ArrowRight, Star } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { 
  getLevelProgress, 
  getBackendScoreCap, 
  TRUST_LEVEL_COLORS,
  AtomicTrustLevel 
} from '../protocol/atomicScoring';

interface PointsExplainerProps {
  currentPoints: number;
  checkInPoints?: number;
  transactionPoints?: number;
  activityPoints?: number;
  streakBonus?: number;
}

const SCORE_CAP = getBackendScoreCap();

const LEVELS: { name: AtomicTrustLevel; minPoints: number; maxPoints: number }[] = [
  { name: 'Very Low Trust', minPoints: -Infinity, maxPoints: 0 },
  { name: 'Low Trust', minPoints: 0, maxPoints: Math.floor(SCORE_CAP * 0.10) },
  { name: 'Medium', minPoints: Math.floor(SCORE_CAP * 0.10), maxPoints: Math.floor(SCORE_CAP * 0.25) },
  { name: 'Active', minPoints: Math.floor(SCORE_CAP * 0.25), maxPoints: Math.floor(SCORE_CAP * 0.45) },
  { name: 'Trusted', minPoints: Math.floor(SCORE_CAP * 0.45), maxPoints: Math.floor(SCORE_CAP * 0.65) },
  { name: 'Pioneer+', minPoints: Math.floor(SCORE_CAP * 0.65), maxPoints: Math.floor(SCORE_CAP * 0.85) },
  { name: 'Elite', minPoints: Math.floor(SCORE_CAP * 0.85), maxPoints: Infinity },
];

const POINTS_BREAKDOWN = [
  {
    category: 'Daily Check-in',
    icon: Gift,
    color: 'emerald',
    items: [
      { action: 'Daily check-in', points: 3, description: 'One per 24 hours' },
      { action: 'Watch bonus ad', points: 5, description: 'After check-in' },
      { action: '7-day streak', points: 10, description: 'Bonus reward' },
    ],
  },
  {
    category: 'Transactions',
    icon: Activity,
    color: 'cyan',
    items: [
      { action: 'Send Pi', points: 2, description: 'Per transaction' },
      { action: 'Receive Pi', points: 1, description: 'Per transaction' },
      { action: 'Pi Dex trade', points: 5, description: 'Per trade' },
    ],
  },
  {
    category: 'Activity',
    icon: TrendingUp,
    color: 'purple',
    items: [
      { action: 'Active wallet (30d)', points: 15, description: 'Monthly bonus' },
      { action: 'High volume trader', points: 25, description: '100+ txns' },
      { action: 'Account age bonus', points: 10, description: 'Per year' },
    ],
  },
];

export function PointsExplainer({ 
  currentPoints, 
  checkInPoints = 0, 
  transactionPoints = 0, 
  activityPoints = 0,
  streakBonus = 0 
}: PointsExplainerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const levelProgress = getLevelProgress(currentPoints);
  const currentLevelColors = TRUST_LEVEL_COLORS[levelProgress.currentLevel];
  
  const currentLevelData = LEVELS.find(l => l.name === levelProgress.currentLevel) || LEVELS[1];
  const nextLevelData = levelProgress.nextLevel ? LEVELS.find(l => l.name === levelProgress.nextLevel) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Learn how points are calculated"
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        <Info className="w-4 h-4" />
        <span className="text-xs font-bold">How Points Work</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, #0F1117 0%, #0A0B0F 100%)',
              border: `1px solid ${currentLevelColors.border}`,
              boxShadow: `0 0 60px ${currentLevelColors.bg}`,
            }}
          >
            <div className="sticky top-0 z-10 p-6 border-b border-white/10" style={{ background: '#0F1117' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: currentLevelColors.bg,
                      border: `1px solid ${currentLevelColors.border}`,
                    }}
                  >
                    <Zap className="w-5 h-5" style={{ color: currentLevelColors.text }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase text-white">Points System</h2>
                    <p className="text-xs text-gray-500">Synchronized with Atomic Scoring Protocol</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  className="p-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div 
                className="p-5 rounded-xl"
                style={{
                  background: currentLevelColors.bg,
                  border: `1px solid ${currentLevelColors.border}`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current Level</p>
                    <p className="text-2xl font-black" style={{ color: currentLevelColors.text }}>
                      {levelProgress.currentLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Total Points</p>
                    <p className="text-2xl font-black text-white">{levelProgress.displayScore.toLocaleString()}</p>
                  </div>
                </div>
                
                {levelProgress.nextLevel && nextLevelData && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>{levelProgress.currentLevel}</span>
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {levelProgress.nextLevel} ({nextLevelData.minPoints.toLocaleString()} pts)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(levelProgress.progressInLevel, 100)}%`,
                          background: `linear-gradient(90deg, ${currentLevelColors.text} 0%, ${TRUST_LEVEL_COLORS[levelProgress.nextLevel].text} 100%)`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {levelProgress.pointsToNextLevel.toLocaleString()} points to {levelProgress.nextLevel}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] font-bold uppercase text-emerald-400 mb-1">Check-ins</p>
                  <p className="text-lg font-black text-white">{checkInPoints}</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-[10px] font-bold uppercase text-cyan-400 mb-1">Transactions</p>
                  <p className="text-lg font-black text-white">{transactionPoints}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-[10px] font-bold uppercase text-purple-400 mb-1">Activity</p>
                  <p className="text-lg font-black text-white">{activityPoints}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] font-bold uppercase text-amber-400 mb-1">Streak</p>
                  <p className="text-lg font-black text-white">{streakBonus}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-white">How to Earn Points</h3>
                
                {POINTS_BREAKDOWN.map((category, idx) => {
                  const Icon = category.icon;
                  const colorMap: Record<string, string> = {
                    emerald: 'rgba(16, 185, 129',
                    cyan: 'rgba(0, 217, 255',
                    purple: 'rgba(139, 92, 246',
                  };
                  const color = colorMap[category.color] || colorMap.cyan;
                  
                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl"
                      style={{
                        background: `${color}, 0.05)`,
                        border: `1px solid ${color}, 0.2)`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4" style={{ color: `${color}, 1)` }} />
                        <span className="text-sm font-bold" style={{ color: `${color}, 1)` }}>
                          {category.category}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {category.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-white">{item.action}</span>
                              <span className="text-xs text-gray-500 ml-2">({item.description})</span>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ 
                              background: `${color}, 0.2)`,
                              color: `${color}, 1)`,
                            }}>
                              +{item.points} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                  <Award className="w-4 h-4" style={{ color: currentLevelColors.text }} />
                  Level Benefits (Max: {SCORE_CAP.toLocaleString()} pts)
                </h3>
                
                <div className="grid gap-2">
                  {LEVELS.filter(l => l.minPoints > -Infinity).map((level, idx) => {
                    const levelColors = TRUST_LEVEL_COLORS[level.name];
                    const isCurrentLevel = level.name === levelProgress.currentLevel;
                    
                    return (
                      <div 
                        key={idx}
                        className={`p-3 rounded-xl flex items-center justify-between ${
                          isCurrentLevel ? '' : 'opacity-60'
                        }`}
                        style={{
                          background: levelColors.bg,
                          border: `1px solid ${levelColors.border}`,
                          boxShadow: isCurrentLevel ? `0 0 0 2px ${levelColors.text}` : 'none',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Star className="w-4 h-4" style={{ color: levelColors.text }} />
                          <div>
                            <span className="font-bold text-white">{level.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({level.minPoints.toLocaleString()}{level.maxPoints === Infinity ? '+' : `-${level.maxPoints.toLocaleString()}`} pts)
                            </span>
                          </div>
                        </div>
                        {isCurrentLevel && (
                          <span 
                            className="px-2 py-1 rounded-full text-[10px] font-bold"
                            style={{ background: levelColors.bg, color: levelColors.text, border: `1px solid ${levelColors.border}` }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
