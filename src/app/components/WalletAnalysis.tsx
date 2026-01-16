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

  // ✅ إصلاح: إضافة حالة افتراضية لمنع الانهيار (Fall-through protection)
  const getBadgeInfo = () => {
    const level = walletData.trustLevel;
    if (level === 'Elite' || walletData.reputaScore >= 600) {
      return { label: 'Elite Wallet', color: 'text-emerald-600', bgColor: 'bg-emerald-100' };
    }
    if (level === 'High' || walletData.reputaScore >= 400) {
      return { label: 'Trusted Wallet', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    }
    if (level === 'Medium' || walletData.reputaScore >= 200) {
      return { label: 'Moderate Trust', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    }
    return { label: 'Limited Trust', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onReset} className="gap-2 font-black text-[10px] uppercase">
          <ArrowLeft className="w-4 h-4" />
          Check Another Wallet
        </Button>
        <Button
          onClick={onUpgradePrompt}
          className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-[10px] uppercase"
        >
          <Sparkles className="w-4 h-4" />
          {isProUser ? 'Pro Features Active' : 'Upgrade to Pro'}
        </Button>
      </div>

      <Card className="p-6 bg-white border-gray-100 shadow-xl shadow-purple-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Wallet Address</p>
            <p className="font-mono font-bold text-gray-700">{formatAddress(walletData.address)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
            <p className="font-black text-2xl text-purple-600">
              {walletData.balance.toFixed(2)} π
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Reputa Score</p>
              <p className="font-bold text-sm">{walletData.reputaScore}/1000</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Transactions</p>
              <p className="font-bold text-sm">{walletData.totalTransactions || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <Clock className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Account Age</p>
              <p className="font-bold text-sm">{walletData.accountAge} days</p>
            </div>
          </div>

          {/* ✅ إصلاح الألوان والرموز: استبدال الأيقونة الحمراء بأخرى مناسبة للحالة */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${badgeInfo.bgColor} border-opacity-30`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm`}>
               {walletData.reputaScore >= 600 ? '🛡️' : '⚖️'}
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Status</p>
              <p className={`font-black text-[10px] uppercase tracking-tighter ${badgeInfo.color}`}>
                {badgeInfo.label}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <TrustGauge 
        score={walletData.reputaScore} 
        trustLevel={walletData.trustLevel}
        consistencyScore={walletData.consistencyScore || 0}
        networkTrust={walletData.networkTrust || 0}
      />

      <TransactionList transactions={walletData.transactions || []} walletAddress={walletData.address} />

      <AuditReport 
        walletData={walletData} 
        isProUser={true} // تفعيل الديمو
        onUpgradePrompt={onUpgradePrompt}
      />
    </div>
  );
}
