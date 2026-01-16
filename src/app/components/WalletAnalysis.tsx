import { ArrowLeft, Sparkles, TrendingUp, Activity, Clock } from 'lucide-react';  
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
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  // ✅ تحديد هوية المحفظة بناءً على السكور الحقيقي
  const getBadgeInfo = () => {
    const score = walletData.reputaScore || 0;
    if (score >= 600) {
      return { label: 'Elite Wallet', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: '🛡️' };
    }
    if (score >= 400) {
      return { label: 'Trusted Wallet', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '✅' };
    }
    if (score >= 200) {
      return { label: 'Moderate Trust', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '⚖️' };
    }
    return { label: 'Limited Trust', color: 'text-red-600', bgColor: 'bg-red-100', icon: '⚠️' };
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Navigation & Action Bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onReset} className="gap-2 font-black text-[10px] uppercase hover:bg-purple-50">
          <ArrowLeft className="w-4 h-4" />
          Check Another Wallet
        </Button>
        <Button
          onClick={onUpgradePrompt}
          className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-[10px] uppercase shadow-lg shadow-purple-100"
        >
          <Sparkles className="w-4 h-4" />
          {isProUser ? 'Pro Explorer Active' : 'Upgrade to Pro'}
        </Button>
      </div>

      {/* Main Stats Card */}
      <Card className="p-6 bg-white border-gray-100 shadow-xl shadow-purple-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Blockchain Identity</p>
            <p className="font-mono font-bold text-gray-700 tracking-tight">{formatAddress(walletData.address)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Available Balance</p>
            <p className="font-black text-2xl text-purple-600">
              {walletData.balance.toFixed(2)} <span className="text-sm">π</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Reputa Score</p>
              <p className="font-bold text-sm">{walletData.reputaScore}/1000</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Total Tx</p>
              {/* ✅ يعرض الرقم الكلي الحقيقي للمعاملات */}
              <p className="font-bold text-sm">{walletData.totalTransactions || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Account Age</p>
              <p className="font-bold text-sm">{walletData.accountAge} days</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-xl border ${badgeInfo.bgColor} border-opacity-40`}>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-lg">
               {badgeInfo.icon}
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Trust Status</p>
              <p className={`font-black text-[10px] uppercase tracking-tighter ${badgeInfo.color}`}>
                {badgeInfo.label}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Analytics Components */}
      <div className="grid grid-cols-1 gap-6">
        <TrustGauge 
          score={walletData.reputaScore} 
          trustLevel={walletData.trustLevel}
          consistencyScore={walletData.consistencyScore || 85}
          networkTrust={walletData.networkTrust || 90}
        />

        {/* ✅ يعرض فقط آخر 8 معاملات بالتفصيل لضمان سرعة الواجهة */}
        <TransactionList 
          transactions={walletData.transactions.slice(0, 8)} 
          walletAddress={walletData.address} 
        />

        <AuditReport 
          walletData={walletData} 
          isProUser={true} 
          onUpgradePrompt={onUpgradePrompt}
        />
      </div>
    </div>
  );
}
