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

  // فحص المتصفح مرة واحدة عند البداية
  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  useEffect(() => {
    const initApp = async () => {
      // ✅ إصلاح: إذا لم يكن متصفح باي، نفعل وضع الديمو فوراً ونوقف التحميل
      if (!piBrowser) {
        setCurrentUser({ username: "Guest", uid: "demo_user" });
        setHasProAccess(true);
        setIsDemoActive(true);
        setIsInitializing(false);
        return;
      }

      // ✅ إذا كان متصفح باي، نحاول تهيئة الـ SDK بصمت
      try {
        await initializePiSDK();
        // لا نطلب الربط التلقائي هنا لضمان صمت الدخول
      } catch (e) {
        console.warn("Pi SDK failed, but app will continue.");
      } finally {
        setIsInitializing(false);
      }
    };
    
    initApp();
  }, [piBrowser]);

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
      alert("Link failed");
    }
  };

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      setWalletData({
        ...data,
        reputaScore: data.balance > 0 ? 314 : 100, 
        trustLevel: 'Elite'
      });
    } catch (error) {
      alert('Network Sync Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!piBrowser) {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
      return;
    }
    try {
      let user = currentUser;
      if (!user) {
        user = await authenticateUser(['username', 'payments']);
        setCurrentUser(user);
      }
      if (user?.uid) {
        const success = await createVIPPayment(user.uid);
        if (success) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        }
      }
    } catch (e) {
      alert("Payment interrupted");
    }
  };

  // ✅ شاشة التحميل تظهر فقط داخل متصفح باي أثناء التهيئة
  if (isInitializing && piBrowser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white/90 backdrop-blur-sm sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-9 h-9" />
          <div className="leading-tight">
            <h1 className="font-black text-purple-700 text-lg">Reputa Score</h1>
            <p className="text-[11px] text-gray-500 font-medium">
              <span className="text-purple-400">Welcome,</span> {currentUser?.username || 'Guest'} 
              {isDemoActive && <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold">PREVIEW</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {piBrowser && !currentUser?.uid && (
            <button 
              onClick={handleManualLogin}
              className="text-[10px] bg-purple-600 text-white px-3 py-1.5 rounded font-bold shadow-sm"
            >
              Link Account
            </button>
          )}
          {hasProAccess && !isDemoActive && (
            <span className="text-[9px] bg-yellow-400 text-white font-black px-2 py-1 rounded-full shadow-sm animate-pulse">VIP</span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 text-purple-600 font-bold">
            <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="uppercase text-[10px] tracking-widest">Analyzing Blockchain...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={hasProAccess || isDemoActive} 
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[9px] text-gray-300 border-t bg-gray-50 font-bold tracking-widest uppercase">
        {isDemoActive ? 'Public Explorer Mode' : 'Pi Network Live'}
      </footer>

      {!isDemoActive && (
        <AccessUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          onUpgrade={handlePayment}
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
