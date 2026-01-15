import { useState, useEffect, useMemo } from 'react'; 
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
  // 1. حالات التطبيق (States)
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'demo'>('loading');

  const isPi = useMemo(() => isPiBrowser(), []);
  const { refreshWallet } = useTrust();

  // 2. منطق تسجيل الدخول (مرة واحدة فقط عند التشغيل)
  useEffect(() => {
    const initSession = async () => {
      if (isPi) {
        try {
          await initializePiSDK();
          const user = await authenticateUser(['username', 'payments']);
          if (user) {
            setCurrentUser(user);
            const isVIP = await checkVIPStatus(user.uid);
            setHasProAccess(isVIP);
            setAuthStatus('authenticated');
          }
        } catch (e) {
          console.error("Auth failed, switching to demo", e);
          setAuthStatus('demo');
        }
      } else {
        // وضع الديمو للمتصفح العادي
        setCurrentUser({ username: "Guest_User", uid: "demo_id" });
        setHasProAccess(true); // فتح الصلاحيات تلقائياً في الديمو
        setAuthStatus('demo');
      }
    };
    initSession();
  }, [isPi]);

  // 3. منطق فحص المحفظة (سلس ومباشر)
  const handleWalletCheck = async (address: string) => {
    if (!address || isLoading) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      setWalletData({
        ...data,
        reputaScore: 850, // بيانات عرض ثابتة للمنطق
        trustLevel: 'Elite'
      });
    } catch (error) {
      alert("Address sync error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. منطق الدفع (يستدعى فقط عند الحاجة)
  const handlePaymentRequest = async () => {
    if (authStatus === 'demo') {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
      return;
    }

    try {
      if (currentUser?.uid) {
        const success = await createVIPPayment(currentUser.uid);
        if (success) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        }
      }
    } catch (e) {
      alert("Payment was not completed.");
    }
  };

  // 5. واجهة مستخدم نظيفة (UI) بدون تكرار
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* هيدر بسيط يعرض الهوية فقط */}
      <header className="border-b p-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-9 h-9" />
          <div>
            <h1 className="font-extrabold text-purple-800 leading-none">Reputa</h1>
            <span className="text-[10px] text-gray-400 font-mono">
              {authStatus === 'loading' ? 'Connecting...' : `👤 ${currentUser?.username}`}
            </span>
          </div>
        </div>
        
        {/* إشارة VIP صغيرة وغير مزعجة */}
        {hasProAccess && (
          <div className="bg-yellow-100 text-yellow-700 text-[9px] font-black px-2 py-0.5 rounded border border-yellow-200 uppercase">
            VIP Active
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {authStatus === 'loading' ? (
          <div className="h-64 flex items-center justify-center text-purple-600 animate-pulse">
            Initializing Secure Session...
          </div>
        ) : !walletData ? (
          <WalletChecker 
            onCheck={handleWalletCheck} 
            isDemo={authStatus === 'demo'} 
          />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={hasProAccess}
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-[9px] text-center text-gray-400 bg-gray-50 uppercase tracking-tighter">
        Status: {authStatus} | {isPi ? 'Pi Browser' : 'Web View'}
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handlePaymentRequest}
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
