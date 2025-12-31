import { ArrowLeft, Sparkles, TrendingUp, Activity, Clock, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { TrustGauge } from './TrustGauge';
import { TransactionList } from './TransactionList';
import { AuditReport } from './AuditReport';
import type { WalletData } from '../App';

interface WalletAnalysisProps {
  walletData: WalletData;
  isProUser: boolean;
  onReset: () => void;
  onUpgradePrompt: () => void;
}

export function WalletAnalysis({ 
  walletData, 
  isProUser, 
  onReset, 
  onUpgradePrompt 
}: WalletAnalysisProps) {
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getBadgeConfig = () => {
    const configs = {
      Elite: { label: 'Elite Account', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
      High: { label: 'Trusted', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      Medium: { label: 'Neutral', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
      Low: { label: 'Risky', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
    };
    return configs[walletData.trustLevel] || configs.Medium;
  };

  const badge = getBadgeConfig();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-1">
        <Button variant="ghost" onClick={onReset} className="gap-2 text-gray-600 hover:text-purple-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Check Another Wallet</span>
          <span className="sm:hidden">Back</span>
        </Button>
        
        {!isProUser && (
          <Button
            onClick={onUpgradePrompt}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg transition-all text-white border-none"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro
          </Button>
        )}
      </div>

      {/* Hero Stats Card */}
      <Card className="overflow-hidden border-none shadow-xl bg-white">
        <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Verified Address</p>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <p className="font-mono font-bold text-gray-700 break-all leading-tight">
                  {walletData.address}
                </p>
              </div>
            </div>
            <div className="md:text-right min-w-fit">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Balance</p>
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 truncate">
                {walletData.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} π
              </p>
            </div>
          </div>
        </div>

        {/* Quick Grid Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-50 bg-white">
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Reputa Score</p>
              <p className="text-lg font-black text-gray-800 leading-none">{walletData.reputaScore}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Operations</p>
              <p className="text-lg font-black text-gray-800 leading-none">{walletData.totalTransactions}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Account Age</p>
              <p className="text-lg font-black text-gray-800 leading-none">{walletData.accountAge}d</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${badge.bg}`}>
              <ShieldCheck className={`w-5 h-5 ${badge.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Trust Level</p>
              <p className={`text-sm font-black uppercase ${badge.color}`}>{badge.label}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TrustGauge 
            score={walletData.reputaScore} 
            trustLevel={walletData.trustLevel}
            consistencyScore={walletData.consistencyScore}
            networkTrust={walletData.networkTrust}
          />
          <TransactionList 
            transactions={walletData.transactions} 
            walletAddress={walletData.address} 
          />
        </div>
        
        <div className="lg:col-span-1">
          <AuditReport 
            walletData={walletData} 
            isProUser={isProUser}
            onUpgradePrompt={onUpgradePrompt}
          />
        </div>
      </div>
    </div>
  );
}
