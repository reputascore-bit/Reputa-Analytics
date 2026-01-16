import { useState, useEffect } from 'react'; 
import { Analytics } from '@vercel/analytics/react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { createVIPPayment, checkVIPStatus } from './protocol/piPayment';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk';
import logoImage from '../assets/logo.svg';

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false); 
  const [isInitializing, setIsInitializing] = useState(true);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  // 1. إصلاح منطق التحميل: ضمان عدم التعليق في أي متصفح
  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        setCurrentUser({ username: "Guest", uid: "demo" });
        setHasProAccess(true);
        setIsDemoActive(true);
        setIsInitializing(false);
        return;
      }

      try {
        // نضع مهلة زمنية (Timeout) للـ SDK لكي لا يعلق التحميل للأبد
        await Promise.race([
          initializePiSDK(),
          new Promise((_, reject) => setTimeout(() => reject('Timeout'), 5000))
        ]);
      } catch (e) {
        console.warn("Pi SDK not responding, bypassing...");
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, [piBrowser]);

  // 2. إصلاح دالة الربط (Manual Login)
  const handleManualLogin = async () => {
    if (!piBrowser) return;
    try {
      const user = await authenticateUser(['username', 'payments']);
      if (user) {
        setCurrentUser(user);
        const isVIP = await checkVIPStatus(user.uid);
        setHasProAccess(isVIP);
      }
    } catch (e) {
      alert("Please open in Pi Browser to link account.");
    }
  };

  // 3. جلب بيانات المحفظة مع حماية من التعليق
  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      if (data) {
        await refreshWallet(address);
        setWalletData({
          ...data,
          reputaScore: 314, 
          trustLevel: 'Elite'
        });
      }
    } catch (error) {
      alert('Error: Check wallet address or connection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing && piBrowser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-purple-600 font-bold">
        Loading Reputa...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <div>
            <h1 className="font-bold text-purple-700 leading-none">Reputa Score</h1>
            <p className="text-[10px] text-gray-400 mt-1">
              <span className="text-purple-400 font-semibold">Welcome,</span> {currentUser?.username || 'Guest'}
            </p>
          </div>
        </div>

        {/* زر الربط: حجم متوسط، أنيق، وغير مزعج */}
        {piBrowser && !currentUser?.uid && (
          <button 
            onClick={handleManualLogin}
            className="text-[10px] bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg border border-purple-100 font-bold hover:bg-purple-100 transition-all"
          >
            Connect Pi
          </button>
        )}
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] mt-4 font-bold text-gray-400 tracking-widest uppercase">Fetching Data...</p>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto">
             <WalletChecker onCheck={handleWalletCheck} />
          </div>
        ) : (
          <WalletAnalysis
            walletData={walletData}
            // الديمو يفتح التقرير فوراً دون طلب VIP
            isProUser={isDemoActive ? true : hasProAccess} 
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[9px] text-gray-300 border-t bg-gray-50/50 font-bold uppercase tracking-widest">
        {isDemoActive ? 'Public Preview' : 'Official Pi Protocol'}
      </footer>

      {!isDemoActive && (
        <AccessUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          onUpgrade={() => {/* كود الدفع */}}
        />
      )}
      <Analytics />
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
