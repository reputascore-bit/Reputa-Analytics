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
  // إضافة حالة للتحكم في الديمو حتى داخل متصفح باي
  const [isDemoActive, setIsDemoActive] = useState(false); 
  const [isInitializing, setIsInitializing] = useState(true);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  useEffect(() => {
    const initApp = async () => {
      // إذا لم يكن متصفح باي، نفعل الديمو فوراً وننهي التحميل
      if (!piBrowser) {
        setCurrentUser({ username: "Guest_User", uid: "demo_mode" });
        setHasProAccess(true);
        setIsDemoActive(true);
        setIsInitializing(false);
        return;
      }

      // إذا كان متصفح باي، نحاول تسجيل الدخول
      try {
        await initializePiSDK();
        const user = await authenticateUser(['username', 'payments']);
        if (user) {
          setCurrentUser(user);
          const isVIP = await checkVIPStatus(user.uid);
          setHasProAccess(isVIP);
        }
      } catch (e) {
        console.error("Pi connection failed, using demo fallback");
        setIsDemoActive(true);
      } finally {
        setIsInitializing(false); // إنهاء حالة التحميل في كل الحالات
      }
    };
    initApp();
  }, [piBrowser]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      setWalletData({
        ...data,
        reputaScore: 850,
        trustLevel: 'Elite'
      });
    } catch (error) {
      alert('Sync Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    // إذا ضغط المستخدم دفع وهو في الديمو (خارج باي) نفتح له المزايا فوراً
    if (!piBrowser) {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
      return;
    }

    try {
      if (currentUser?.uid) {
        const success = await createVIPPayment(currentUser.uid);
        if (success) {
          setHasProAccess(true);
          setIsDemoActive(false); // تحول من ديمو إلى حقيقي
          setIsUpgradeModalOpen(false);
        }
      }
    } catch (e) {
      alert("Payment interrupted");
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-purple-700 font-bold">
        <div className="animate-pulse text-center">
          <p>Initializing Session...</p>
          <p className="text-[10px] text-gray-400 font-normal mt-2">Connecting to Network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <div>
            <h1 className="font-bold text-purple-700">Reputa Score</h1>
            <p className="text-[10px] text-gray-400">
              👤 {currentUser?.username || 'Guest'} 
              {isDemoActive && <span className="ml-1 text-blue-500 font-bold">(DEMO)</span>}
            </p>
          </div>
        </div>
        
        {/* زر التبديل للديمو متاح دائماً للتجربة */}
        {!hasProAccess && !isDemoActive && (
          <button 
            onClick={() => setIsDemoActive(true)}
            className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200"
          >
            Preview VIP
          </button>
        )}
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {!walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            // التعديل الجوهري: التقرير يفتح إذا كان VIP حقيقي أو إذا كان الديمو مفعلاً
            isProUser={hasProAccess || isDemoActive} 
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[9px] text-gray-400 border-t bg-gray-50 uppercase">
        Mode: {isDemoActive ? 'Demo Preview' : 'Official Network'}
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handlePayment}
      />
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
