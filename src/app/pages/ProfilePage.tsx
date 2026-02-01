import React from 'react';
import { ArrowLeft, Mail, ShieldCheck, HelpCircle, FileText } from 'lucide-react';
import { ProfileSection } from '../components/ProfileSection';
import { WalletData, AppMode } from '../protocol/types';
import { WalletActivityData } from '../services/piNetworkData';

interface ProfilePageProps {
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
  onBack: () => void;
}

export function ProfilePage({ 
  walletData, 
  username, 
  isProUser, 
  mode,
  userPoints,
  onPointsEarned,
  activityData,
  onBack
}: ProfilePageProps) {
  return (
    <div className="min-h-screen futuristic-bg pb-20 lg:pb-6">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-white/5 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-purple-400" />
          </button>
          <h1 className="text-lg font-bold text-white uppercase tracking-widest">Profile</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6 relative z-10">
        <ProfileSection 
          walletData={walletData}
          username={username}
          isProUser={isProUser}
          mode={mode}
          userPoints={userPoints}
          onPointsEarned={onPointsEarned}
          activityData={activityData}
        />
      </main>
    </div>
  );
}
