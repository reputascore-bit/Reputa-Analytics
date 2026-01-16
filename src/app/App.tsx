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
  const [hasProAccess, setHasProAccess] = useState(true); // مفتوح دوماً للديمو
  const [isInitializing, setIsInitializing] = useState(true);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  // 1. تهيئة صامتة تماماً لمنع التعليق عند الدخول
  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        setCurrentUser({ username: "Guest", uid: "demo" });
        setIsInitializing(false);
        return;
      }
      try {
        await initializePiSDK();
        // نحاول التعرف على المستخدم إذا كان قد ربط سابقاً دون إظهار نافذة
        const user = await authenticateUser(['username']).catch(() => null);
        if (user) setCurrentUser(user);
      } catch (e) { console.log("Silent Init"); }
      setIsInitializing(false);
    };
    initApp();
  }, [piBrowser]);

  // 2. إصلاح تعليق المحفظة: جلب البيانات أولاً ثم المعالجة
  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address); // جلب من البلوكشين
      if (data) {
        setWalletData({
          ...data,
          reputaScore: data.balance > 0 ? 314 : 100,
          trustLevel: 'Verified'
        });
        // المعالجة الخلفية للبروتوكول تتم بعد عرض البيانات لمنع التعليق
        refreshWallet(address).catch(() => null);
      }
    } catch (error) {
      alert("Blockchain Sync Error");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. دالة الربط اليدوي (أيقونة الربط)
  const handleManualLink = async () => {
    if (!piBrowser) return;
    try {
      const user = await authenticateUser(['username', 'payments']);
      if (user) {
        setCurrentUser(user);
        const isVIP = await checkVIPStatus(user.uid);
        if (isVIP) setHasProAccess(true);
      }
    } catch (e) { alert("Link interrupted"); }
  };

  if (isInitializing && piBrowser) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <div className="leading-tight">
            <h1 className="font-bold text-purple-700">Reputa Score</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase">
              <span className="text-purple-400 font-black">Welcome,</span> {currentUser?.username || 'Guest'}
            </p>
          </div>
        </div>

        {/* إعادة أيقونة الربط بشكل جذاب ومتوسط */}
        <div className="flex items-center gap-2">
          {piBrowser && !currentUser?.uid && (
            <button 
              onClick={handleManualLogin}
              className="p-2 bg-purple-50 text-purple-600 rounded-full border border-purple-100 hover:bg-purple-100 transition-all shadow-sm"
              title="Link Pi Account"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[9px] mt-2 font-black text-purple-400 tracking-[0.3em]">READING BLOCKCHAIN...</p>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto">
            <WalletChecker onCheck={handleWalletCheck} />
          </div>
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={true} // فتح جميع ميزات الديمو بدون استثناء
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[8px] text-gray-300 border-t font-black uppercase tracking-[0.4em]">
        Protocol Stable - Demo Mode Active
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={() => {}}
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
