import { useState, useEffect } from 'react';
import { Shield, RefreshCw, Activity, Clock, Zap, CheckCircle, XCircle } from 'lucide-react';
import { fetchReputationData, ReputationData } from '../../services/piNetworkData';
import { useLanguage } from '../../hooks/useLanguage';

interface ReputationWidgetProps {
  walletAddress: string;
  isMainnet?: boolean;
}

export function ReputationWidget({ walletAddress, isMainnet = false }: ReputationWidgetProps) {
  const { t } = useLanguage();
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReputationData(walletAddress, isMainnet);
      setReputation(data);
    } catch (err) {
      setError('Failed to fetch reputation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [walletAddress, isMainnet]);

  const getTrustLevelStyle = (level: ReputationData['trustLevel']) => {
    switch (level) {
      case 'Elite': return { 
        bg: 'bg-gradient-to-r from-amber-500/20 to-amber-600/20', 
        border: 'border-amber-500/50', 
        text: 'text-amber-400',
        glow: 'shadow-amber-500/30',
        icon: '👑'
      };
      case 'High': return { 
        bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20', 
        border: 'border-emerald-500/50', 
        text: 'text-emerald-400',
        glow: 'shadow-emerald-500/30',
        icon: '🛡️'
      };
      case 'Medium': return { 
        bg: 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/20', 
        border: 'border-cyan-500/50', 
        text: 'text-cyan-400',
        glow: 'shadow-cyan-500/30',
        icon: '✅'
      };
      case 'Low': return { 
        bg: 'bg-gradient-to-r from-gray-500/20 to-gray-600/20', 
        border: 'border-gray-500/50', 
        text: 'text-gray-400',
        glow: 'shadow-gray-500/30',
        icon: '⚠️'
      };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'from-amber-500 to-amber-400';
    if (score >= 500) return 'from-emerald-500 to-emerald-400';
    if (score >= 250) return 'from-cyan-500 to-cyan-400';
    return 'from-gray-500 to-gray-400';
  };

  if (loading && !reputation) {
    return (
      <div className="glass-card p-6 border border-emerald-500/20 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20" />
          <div className="h-4 w-36 bg-white/10 rounded" />
        </div>
        <div className="h-24 bg-white/5 rounded-xl mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const trustStyle = reputation ? getTrustLevelStyle(reputation.trustLevel) : getTrustLevelStyle('Low');

  return (
    <div className="glass-card p-6 border border-emerald-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/30">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              Reputation Score
            </h3>
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              On-Chain Analysis
            </span>
          </div>
        </div>
        
        <button 
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      {reputation && (
        <>
          {/* Score Display */}
          <div className={`p-6 rounded-2xl ${trustStyle.bg} border ${trustStyle.border} mb-6 text-center relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20" style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)'
            }} />
            
            <span className="text-4xl mb-2 block">{trustStyle.icon}</span>
            
            <div className="relative">
              <span className={`text-5xl font-black bg-gradient-to-r ${getScoreColor(reputation.score)} bg-clip-text text-transparent`}>
                {reputation.score}
              </span>
              <span className="text-gray-500 text-sm font-bold">/1000</span>
            </div>
            
            <div className={`inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full ${trustStyle.bg} border ${trustStyle.border}`}>
              <span className={`text-xs font-black uppercase tracking-widest ${trustStyle.text}`}>
                {reputation.trustLevel} Trust
              </span>
            </div>

            {/* Verification Badge */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {reputation.onChainVerified ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">On-Chain Verified</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Not Verified</span>
                </>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            {/* Transactions */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Transactions</span>
              </div>
              <span className="text-sm font-black text-white">{reputation.transactionCount}</span>
            </div>

            {/* Account Age */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Account Age</span>
              </div>
              <span className="text-sm font-black text-white">{reputation.accountAge} <span className="text-gray-500 text-xs">days</span></span>
            </div>

            {/* Network Activity */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Activity Level</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                    style={{ width: `${reputation.networkActivity}%` }}
                  />
                </div>
                <span className="text-sm font-black text-white">{reputation.networkActivity}%</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-4 pt-4 border-t border-white/5 text-center">
            {reputation.isEstimated ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[7px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Estimated
                </span>
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
                  Connect wallet for real data
                </p>
              </div>
            ) : (
              <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-500">
                Verified from on-chain data
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
