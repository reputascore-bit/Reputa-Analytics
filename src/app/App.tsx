import { useState, useEffect, useCallback } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import { fetchWalletData, initializePi, getCurrentUser, createVIPPayment } from './protocol'; 
import { isVIPUser } from './services/piPayments'; 
import logoImage from '../assets/logo.svg';
import { TrustProvider, useTrust } from './protocol/TrustProvider'; 

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>('Guest');

  const { updateMiningDays, miningDays, trustScore } = useTrust();
  const isPiBrowser = typeof (window as any).Pi !== 'undefined';

  // ربط الحساب وجلب اسم المستخدم الحقيقي
  useEffect(() => {
    const setup = async () => {
      if (isPiBrowser) {
        try {
          await initializePi();
          const user = await getCurrentUser();
          if (user && user.username) {
            setUserName(user.username);
            setHasProAccess(await isVIPUser(user.uid));
          }
        } catch (error) {
          console.error("Authentication failed:", error);
        }
      }
    };
    setup();
  }, [isPiBrowser]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      let data;
      if (isPiBrowser) {
        data = await fetchWalletData(address);
      } else {
        // بيانات ديمو منطقية لا تكسر التصميم
        data = {
          balance: 314.15,
          username: "Demo_User",
          scores: { totalScore: 700, miningScore: 80 },
          trustLevel: 'Verified',
          transactions: []
        };
      }

      setWalletData({
        ...data,
        reputaScore: trustScore > 0 ? trustScore * 10 : (data as any).scores?.totalScore || 500,
        consistencyScore: miningDays > 0 ? miningDays : (data as any).scores?.miningScore || 70,
      });
      setCurrentWalletAddress(address);
    } catch (error) {
      alert("Error fetching blockchain data.");
    } finally {
      setIsLoading(false);
    }
  };

  // معالجة رفع الصورة بشكل صحيح
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateMiningDays(e.target.files[0]);
    }
  };

  // تفعيل عملية الدفع VIP الحقيقية
  const handleStartPayment = async () => {
    if (!isPiBrowser) {
      alert("Payments only available in Pi Browser");
      return;
    }
    try {
      const payment = await createVIPPayment();
      if (payment) setHasProAccess(true);
    } catch (error) {
      console.error("Payment failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur-md z-[100]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-[60%]">
            <img src={logoImage} className="w-8 h-8" alt="logo" />
            <div className="truncate">
              <h1 className="font-bold text-base text-indigo-700 truncate">Reputa Score</h1>
              <p className="text-[9px] text-slate-400 font-medium truncate">
                {isPiBrowser ? '● Live' : '○ Demo'}: {userName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="flex flex-col items-end cursor-pointer group">
              <span className="text-[9px] font-bold text-indigo-600 group-hover:underline uppercase">Boost ↑</span>
              <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
            </label>
            
            {hasProAccess && (
              <span className="px-2 py-1 bg-amber-400 text-white text-[8px] font-black rounded-md shadow-sm">VIP</span>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Syncing...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <div className="space-y-6">
            <WalletAnalysis 
              walletData={walletData} 
              isProUser={hasProAccess} 
              onReset={() => setWalletData(null)} 
              onUpgradePrompt={() => setIsUpgradeModalOpen(true)} 
            />
          </div>
        )}
      </main>

      <AccessUpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        onUpgrade={handleStartPayment} 
      />

      {showDashboard && (
        <ReputaDashboard walletAddress={currentWalletAddress} onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <TrustProvider>
      <ReputaAppContent />
    </TrustProvider>
  );
}

