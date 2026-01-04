
import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import { fetchWalletData, initializePi, createVIPPayment } from './protocol'; 
import { isVIPUser } from './services/piPayments'; 
import { getCurrentUser } from './services/piSdk';
import logoImage from '../assets/logo.svg';

// --- إضافات البروتوكول الجديد ---
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

  // 1. إصلاح الربط وجلب اسم المستخدم فور الدخول
  useEffect(() => {
    const setup = async () => {
      if (isPiBrowser) {
        try {
          await initializePi();
          // طلب المصادقة فوراً لحل مشكلة "Please authenticate first"
          const auth = await (window as any).Pi.authenticate(['username', 'payments'], (payment: any) => {
            console.log("Payment in progress...", payment);
          });
          
          if (auth && auth.user) {
            setUserName(auth.user.username);
            const vipStatus = await isVIPUser(auth.user.uid);
            setHasProAccess(!!vipStatus);
          }
        } catch (error) {
          console.error("SDK Init Error:", error);
        }
      } else {
        setUserName("Demo User");
      }
    };
    setup();
  }, [isPiBrowser]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      let realData;
      if (isPiBrowser) {
        realData = await fetchWalletData(address);
      } else {
        realData = {
          balance: 100,
          scores: { totalScore: 650, miningScore: 75 },
          trustLevel: 'Medium',
          riskLevel: 'Low'
        };
      }

      const mappedData = {
        ...realData,
        reputaScore: trustScore > 0 ? trustScore * 10 : (realData as any).scores?.totalScore || 500,
        trustLevel: (realData as any).trustLevel || 'Medium',
        consistencyScore: miningDays > 0 ? miningDays : (realData as any).scores?.miningScore || 70,
        networkTrust: 85,
        riskLevel: (realData as any).riskLevel || 'Low'
      };
      setWalletData(mappedData);
      setCurrentWalletAddress(address);
    } catch (error) {
      alert("Blockchain Sync Error: Check connection or address.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWalletData(null);
    setShowDashboard(false);
  };

  const handleUpgradePrompt = () => setIsUpgradeModalOpen(true);

  // 2. إصلاح الدفع لضمان عدم انتهاء الجلسة
  const handleAccessUpgrade = async () => {
    if (isPiBrowser) {
      try {
        const payment = await createVIPPayment();
        if (payment) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
          // تحديث البيانات فور نجاح الدفع
          if (currentWalletAddress) handleWalletCheck(currentWalletAddress);
        }
      } catch (err) {
        alert("Payment was not completed. Please try again from Pi Browser.");
      }
    } else {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoImage} alt="Reputa Analytics" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Reputa Score
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                   {isPiBrowser ? '● Live Testnet' : '○ Demo'}: {userName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 3. إصلاح أيقونة الرفع: إضافة الـ label في الهيدر لضمان ظهورها في الجوال */}
              <div className="flex items-center text-right mr-2 border-l pl-4 border-purple-100">
                <label className="group flex flex-col cursor-pointer">
                  <span className="text-[10px] font-black text-purple-600 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                    BOOST SCORE <span className="text-xs">↑</span>
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        updateMiningDays(e.target.files[0]);
                      }
                    }}
                  />
                  <span className="text-[8px] text-gray-400 italic">Upload Stats</span>
                </label>
                {miningDays > 0 && <span className="ml-2 text-[14px] text-green-500 animate-bounce">✓</span>}
              </div>

              {hasProAccess && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-md">
                  <span className="text-[10px] font-black text-white uppercase italic">VIP PRO</span>
                </div>
              )}
              {walletData && (
                 <button onClick={() => setShowDashboard(true)} className="text-xs font-black text-blue-600 hover:text-blue-800 border-b-2 border-blue-600 pb-0.5 uppercase">
                    Dashboard
                 </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-600">
            <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-black text-[10px] tracking-[0.2em] uppercase">Connecting to Pi Network...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={hasProAccess}
            onReset={handleReset}
            onUpgradePrompt={handleUpgradePrompt}
          />
        )}
      </main>

      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
            © 2026 Reputa Analytics • Certified Pi Network Protocol
          </p>
        </div>
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />

      {showDashboard && currentWalletAddress && (
        <ReputaDashboard
          walletAddress={currentWalletAddress}
          onClose={() => setShowDashboard(false)}
        />
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
