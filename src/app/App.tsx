import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import { fetchWalletData, initializePi, createVIPPayment } from './protocol'; 
import { isVIPUser } from './services/piPayments'; 
import { getCurrentUser } from './services/piSdk';
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

  // فحص وجود مكتبة Pi في المتصفح
  const isPiBrowser = typeof (window as any).Pi !== 'undefined';

  // 1. إصلاح ربط الحساب (SDK Auth)
  useEffect(() => {
    const authPi = async () => {
      if (isPiBrowser) {
        try {
          // انتظار تهيئة المكتبة أولاً
          await (window as any).Pi.init({ version: "1.5", sandbox: true }); 
          
          // طلب المصادقة من المستخدم
          const auth = await (window as any).Pi.authenticate(['username', 'payments'], (payment: any) => {
             console.log("Oncomplete payment callback", payment);
          });

          if (auth && auth.user) {
            setUserName(auth.user.username);
            // جلب حالة الـ VIP بناءً على الـ UID الحقيقي
            const vipStatus = await isVIPUser(auth.user.uid);
            setHasProAccess(!!vipStatus);
          }
        } catch (error) {
          console.error("Auth Failed:", error);
          // تنبيه للمساعدة في التشخيص
          // alert("SDK Sync Error: " + JSON.stringify(error));
        }
      }
    };
    authPi();
  }, [isPiBrowser]);

  // 2. إصلاح زر الدفع (Payment Flow)
  const handleAccessUpgrade = async () => {
    if (!isPiBrowser) {
      setHasProAccess(true); // وضع الديمو
      setIsUpgradeModalOpen(false);
      return;
    }

    try {
      setIsLoading(true);
      // استدعاء دالة الدفع الحقيقية من البروتوكول
      const result = await createVIPPayment();
      
      if (result) {
        setHasProAccess(true);
        setIsUpgradeModalOpen(false);
        alert("Success! VIP Membership Activated.");
      }
    } catch (err) {
      console.error("Payment Flow Error:", err);
      alert("Payment failed or was cancelled.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      let data;
      if (isPiBrowser) {
        data = await fetchWalletData(address);
      } else {
        data = {
          balance: 314.15,
          username: "Demo",
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
    } catch (e) {
      alert("Testnet Sync Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <header className="border-b bg-white/95 sticky top-0 z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-[60%]">
            <img src={logoImage} className="w-8 h-8" alt="logo" />
            <div className="truncate">
              <h1 className="font-bold text-sm text-indigo-700">Reputa Score</h1>
              <p className="text-[10px] text-slate-400 font-bold truncate">
                {isPiBrowser ? '● LIVE' : '○ DEMO'}: {userName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <label className="bg-indigo-50 px-3 py-1 rounded-md cursor-pointer border border-indigo-100 active:scale-95 transition-transform">
                <span className="text-[10px] font-black text-indigo-600">BOOST ↑</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => e.target.files?.[0] && updateMiningDays(e.target.files[0])} 
                />
             </label>

            {hasProAccess && (
              <span className="bg-amber-400 text-white text-[9px] px-2 py-1 rounded font-black shadow-sm italic">VIP</span>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 text-indigo-600">
            <div className="w-10 h-10 border-4 border-t-transparent border-current rounded-full animate-spin"></div>
            <p className="mt-4 text-[10px] font-black tracking-widest">CONNECTING PROTOCOL...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis 
            walletData={walletData} 
            isProUser={hasProAccess} 
            onReset={() => setWalletData(null)} 
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)} 
          />
        )}
      </main>

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

