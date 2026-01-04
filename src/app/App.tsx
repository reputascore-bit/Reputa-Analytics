import { useState, useEffect, useCallback } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import { fetchWalletData, initializePi, createVIPPayment } from './protocol'; 
import { isVIPUser } from './services/piPayments'; 
import { getCurrentUser } from './services/piSdk';
import logoImage from '../assets/logo.svg';

// --- بروتوكول الثقة ---
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

  // 1. إصلاح ربط الحساب (تلقائي وسريع)
  useEffect(() => {
    const startAuth = async () => {
      if (isPiBrowser) {
        try {
          await initializePi();
          // طلب المصادقة (هذا سيجلب اسم MEDJOKER فوراً ويمنع رسالة authenticate first)
          const auth = await (window as any).Pi.authenticate(['username', 'payments'], 
            (payment: any) => console.log("Payment status change", payment)
          );
          
          if (auth && auth.user) {
            setUserName(auth.user.username);
            const vip = await isVIPUser(auth.user.uid);
            setHasProAccess(!!vip);
          }
        } catch (error) {
          console.error("Auth Error:", error);
        }
      }
    };
    startAuth();
  }, [isPiBrowser]);

  // 2. إصلاح جلب البيانات (معالجة الأرقام الطويلة)
  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      let realData;
      if (isPiBrowser) {
        realData = await fetchWalletData(address);
      } else {
        realData = { balance: 100, scores: { totalScore: 650, miningScore: 75 }, trustLevel: 'Medium' };
      }

      setWalletData({
        ...realData,
        // معالجة الأرقام لتناسب الحاويات
        reputaScore: trustScore > 0 ? trustScore * 10 : (realData as any).scores?.totalScore || 500,
        consistencyScore: miningDays > 0 ? miningDays : (realData as any).scores?.miningScore || 70,
      });
      setCurrentWalletAddress(address);
    } catch (error) {
      alert("Blockchain Sync Error. Retrying...");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. إصلاح زر الدفع (حل مشكلة Paiement expiré)
  const handleAccessUpgrade = async () => {
    if (isPiBrowser) {
      try {
        // نطلب الدفع وننتظر النتيجة
        const paymentSuccess = await createVIPPayment();
        if (paymentSuccess) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
          alert("Success! VIP Unlocked.");
          if (currentWalletAddress) handleWalletCheck(currentWalletAddress);
        }
      } catch (err) {
        alert("Payment expired or cancelled. Try again.");
      }
    } else {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50 overflow-x-hidden">
      <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logoImage} alt="logo" className="w-10 h-10 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="font-bold text-xl text-purple-700 truncate tracking-tight">Reputa Score</h1>
                <p className="text-[10px] text-gray-400 font-bold truncate tracking-widest uppercase">
                  {isPiBrowser ? '● LIVE' : '○ DEMO'}: {userName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 4. إصلاح زر الرفع: جعله قابلاً للنقر في الجوال (High Visibility) */}
              <div className="flex flex-col items-end border-l pl-4 border-purple-100">
                <label className="cursor-pointer group">
                  <span className="text-[10px] font-black text-purple-600 group-hover:text-blue-600 flex items-center gap-1">
                    BOOST SCORE <span className="text-sm">↑</span>
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => e.target.files?.[0] && updateMiningDays(e.target.files[0])} 
                  />
                  <p className="text-[8px] text-gray-400 text-right">Upload Stats</p>
                </label>
                {miningDays > 0 && <span className="text-[9px] text-green-500 font-bold">✓ Verified</span>}
              </div>

              {hasProAccess && (
                <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black rounded-full shadow-sm italic">PRO</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest">Connecting to Pi Network...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <div className="max-w-full overflow-hidden">
            <WalletAnalysis
              walletData={walletData}
              isProUser={hasProAccess}
              onReset={() => setWalletData(null)}
              onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
            />
          </div>
        )}
      </main>

      <footer className="border-t bg-white/50 py-8 text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
        © 2026 Reputa Analytics • Certified Protocol
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />

      {showDashboard && currentWalletAddress && (
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

