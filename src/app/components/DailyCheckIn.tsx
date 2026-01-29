import { useState, useEffect, useCallback } from 'react';
import { Calendar, Gift, Play, Clock, CheckCircle, Star, Zap, ArrowUpRight, Merge } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { reputationService, UserReputationState } from '../services/reputationService';

interface DailyCheckInProps {
  userId?: string;
  onPointsEarned?: (points: number, type: 'checkin' | 'ad' | 'merge') => void;
  onStateChange?: (state: UserReputationState) => void;
  isDemo?: boolean;
}

const CHECKIN_POINTS = 3;
const AD_BONUS_POINTS = 5;

export function DailyCheckIn({ userId, onPointsEarned, onStateChange, isDemo = false }: DailyCheckInProps) {
  const { t } = useLanguage();
  const [state, setState] = useState<UserReputationState | null>(null);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canWatchAd, setCanWatchAd] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [showSuccess, setShowSuccess] = useState<'checkin' | 'ad' | 'merge' | null>(null);
  const [mergedAmount, setMergedAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadState() {
      if (isDemo) {
        setState({
          uid: 'demo',
          reputationScore: 150,
          dailyCheckInPoints: 45,
          totalCheckInDays: 15,
          lastCheckIn: null,
          lastAdWatch: null,
          streak: 5,
          adClaimedForCheckIn: null,
          lastCheckInId: null,
          interactionHistory: [],
          lastUpdated: null,
        });
        setIsLoading(false);
        return;
      }

      const uid = userId || localStorage.getItem('piUserId') || `user_${Date.now()}`;
      const loadedState = await reputationService.loadUserReputation(uid);
      setState(loadedState);
      setIsLoading(false);
    }

    loadState();
  }, [userId, isDemo]);

  const updateAvailability = useCallback(() => {
    if (!state) return;

    const result = reputationService.canCheckIn();
    setCanCheckIn(result.canCheckIn);
    setCountdown(result.countdown);
    setCanWatchAd(!result.canCheckIn && reputationService.canClaimAdBonus());
  }, [state]);

  useEffect(() => {
    updateAvailability();
    const interval = setInterval(updateAvailability, 1000);
    return () => clearInterval(interval);
  }, [updateAvailability]);

  const handleCheckIn = async () => {
    if (isDemo || !state) return;

    try {
      const result = await reputationService.performDailyCheckIn();
      if (result.success) {
        setState(result.newState);
        onPointsEarned?.(result.pointsEarned, 'checkin');
        onStateChange?.(result.newState);
        setShowSuccess('checkin');
        setTimeout(() => setShowSuccess(null), 3000);
        updateAvailability();
      }
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const handleWatchAd = async () => {
    if (isDemo || !state) return;

    setIsWatchingAd(true);
    
    setTimeout(async () => {
      try {
        const result = await reputationService.claimAdBonus();
        if (result.success) {
          setState(result.newState);
          onPointsEarned?.(result.pointsEarned, 'ad');
          onStateChange?.(result.newState);
          setShowSuccess('ad');
          setTimeout(() => setShowSuccess(null), 3000);
        }
      } catch (error) {
        console.error('Ad bonus error:', error);
      }
      setIsWatchingAd(false);
      updateAvailability();
    }, 3000);
  };

  const handleMergePoints = async () => {
    if (isDemo || !state || state.dailyCheckInPoints <= 0) return;

    setIsMerging(true);
    
    try {
      const pointsToMerge = state.dailyCheckInPoints;
      const result = await reputationService.mergeCheckInPointsToReputation();
      if (result.success) {
        setMergedAmount(pointsToMerge);
        setState(result.newState);
        onPointsEarned?.(pointsToMerge, 'merge');
        onStateChange?.(result.newState);
        setShowSuccess('merge');
        setTimeout(() => {
          setShowSuccess(null);
          setMergedAmount(0);
        }, 3000);
      }
    } catch (error) {
      console.error('Merge error:', error);
    }
    
    setIsMerging(false);
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!state) {
    return null;
  }

  const canMerge = state.dailyCheckInPoints > 0;

  return (
    <div 
      className="glass-card p-6 relative overflow-hidden"
      style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}
    >
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
              }}
            >
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-white">
                Daily Check-in
              </h3>
              <p className="text-[10px] text-gray-500">
                {isDemo ? 'Demo Mode' : 'Earn points daily'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs font-bold text-amber-400">
                <Zap className="w-3 h-3 inline mr-1" />
                {state.streak} day streak
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                Pending Check-in Points
              </p>
              <p className="text-2xl font-black text-cyan-400">
                {state.dailyCheckInPoints}
                <span className="text-xs ml-1 text-gray-500">pts</span>
              </p>
            </div>
            <button
              onClick={handleMergePoints}
              disabled={!canMerge || isMerging || isDemo}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                canMerge && !isMerging
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 hover:scale-[1.02]'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isMerging ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Merge className="w-4 h-4" />
                  Merge to Reputation
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            Merge your check-in points weekly to boost your main reputation score
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="p-4 rounded-xl"
            style={{
              background: canCheckIn 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
                : 'rgba(255, 255, 255, 0.02)',
              border: canCheckIn 
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gift className={`w-5 h-5 ${canCheckIn ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-bold ${canCheckIn ? 'text-emerald-400' : 'text-gray-500'}`}>
                  Check-in Reward
                </span>
              </div>
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                +{CHECKIN_POINTS} pts
              </span>
            </div>

            {canCheckIn ? (
              <button
                onClick={handleCheckIn}
                disabled={isDemo}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold transition-all hover:opacity-90 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Claim Daily Reward
              </button>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Next check-in in</span>
                </div>
                <p className="text-2xl font-mono font-bold text-amber-400">{countdown}</p>
              </div>
            )}
          </div>

          <div 
            className="p-4 rounded-xl"
            style={{
              background: canWatchAd 
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
                : 'rgba(255, 255, 255, 0.02)',
              border: canWatchAd 
                ? '1px solid rgba(139, 92, 246, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Play className={`w-5 h-5 ${canWatchAd ? 'text-purple-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-bold ${canWatchAd ? 'text-purple-400' : 'text-gray-500'}`}>
                  Bonus Ad
                </span>
              </div>
              <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                +{AD_BONUS_POINTS} pts
              </span>
            </div>

            {canWatchAd ? (
              <button
                onClick={handleWatchAd}
                disabled={isWatchingAd || isDemo}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {isWatchingAd ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Watching...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 inline mr-2" />
                    Watch Ad for Bonus
                  </>
                )}
              </button>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-gray-500">
                  {!state.lastCheckIn 
                    ? 'Check in first to unlock'
                    : state.adClaimedForCheckIn === state.lastCheckInId
                      ? 'Already claimed for this check-in'
                      : 'Check in to unlock bonus'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Total check-ins: <span className="text-amber-400 font-bold">{state.totalCheckInDays}</span>
            </span>
            <span className="text-gray-500">
              Reputation: <span className="text-emerald-400 font-bold">{state.reputationScore} pts</span>
            </span>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 animate-in fade-in duration-300"
        >
          <div className="text-center">
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                background: showSuccess === 'checkin' 
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : showSuccess === 'ad'
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)'
                    : 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                boxShadow: showSuccess === 'checkin'
                  ? '0 0 40px rgba(16, 185, 129, 0.5)'
                  : showSuccess === 'ad'
                    ? '0 0 40px rgba(139, 92, 246, 0.5)'
                    : '0 0 40px rgba(6, 182, 212, 0.5)',
              }}
            >
              {showSuccess === 'merge' ? (
                <ArrowUpRight className="w-8 h-8 text-white" />
              ) : (
                <Star className="w-8 h-8 text-white" />
              )}
            </div>
            <p className="text-2xl font-black text-white mb-1">
              {showSuccess === 'merge' 
                ? `+${mergedAmount} Reputation!`
                : `+${showSuccess === 'checkin' ? CHECKIN_POINTS : AD_BONUS_POINTS} Points!`}
            </p>
            <p className="text-sm text-gray-400">
              {showSuccess === 'checkin' 
                ? 'Daily check-in complete!'
                : showSuccess === 'ad'
                  ? 'Ad bonus claimed!'
                  : 'Points merged to reputation!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
