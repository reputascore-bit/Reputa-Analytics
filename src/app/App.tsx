import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import { fetchWalletData, initializePi, createVIPPayment } from './protocol'; 
import { isVIPUser } from './services/piPayments'; 
import { getCurrentUser } from './services/piSdk';
import logoImage from '../assets/logo.svg';

// --- البروتوكول الأساسي ---
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

  // مصادقة المستخدم فور الدخول لربط الحساب
  useEffect(() => {
    const startAuth = async () => {
      if (isPiBrowser) {
        try {
          await initializePi();
          // طلب إذن الوصول لاسم المستخدم والمدفوعات
          const auth = await (window as any).Pi.authenticate(['username', 'payments'], 
            (payment: any) => console.log("Payment status change", payment)
          );
          
          if (auth && auth.user) {
            setUserName(auth.user.username);
            const vip = await isVIPUser(auth.user.uid);
            setHasProAccess(!!vip);
          }
        } catch (error) {
          console.error("SDK Authentication Error:", error);
        }
      } else {
        setUserName("Demo User");
      }
    };
    startAuth();
  }, [isPiBrowser]);

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
        reputaScore: trustScore > 0 ? trustScore * 10 : (realData as any).scores?.totalScore || 500,
        consistencyScore: miningDays > 0 ? miningDays : (realData as any).scores?.miningScore || 70,
      });
      setCurrentWalletAddress(address);
    } catch (error) {
      alert("Testnet Sync Error. Please check the wallet address.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWalletData(null);
    setShowDashboard(false);
  };

  const handleAccessUpgrade = async () => {
    if (isPiBrowser) {
      try {
        const paymentSuccess = await createVIPPayment();
        if (paymentSuccess) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
          alert("Success! VIP Unlocked.");
        }
      } catch (err) {
        alert("Payment process failed.");
      }
    } else {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50 overflow-x-hidden">
      <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logoImage} alt="logo" className="w-9 h-9 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="font-bold text-lg text-purple-700 truncate">Reputa Score</h1>
                <p className="text-[10px] text-gray-500 font-bold truncate">@{userName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="flex flex-col items-center justify-center p-2 bg-purple-100 rounded-lg cursor-pointer border border-purple-200 hover:bg-purple-200 transition-colors">
                <span className="text-[10px] font-black text-purple-700">BOOST ↑</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => e.target.files?.[0] && updateMiningDays(e.target.files[0])} 
                />
              </label>

              {hasProAccess && (
                <div className="px-3 py-1 bg-yellow-400 text-white text-[10px] font-black rounded-full shadow-sm">PRO</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-purple-600">
            <div className="w-10 h-10 border-4 border-t-transparent border-current rounded-full animate-spin"></div>
            <p className="mt-4 text-[10px] font-bold tracking-widest uppercase">Syncing Blockchain...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <div className="max-w-full overflow-hidden">
            <WalletAnalysis
              walletData={walletData}
              isProUser={hasProAccess}
              onReset={handleReset}
              onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
            />
          </div>
        )}
      </main>

      <footer className="border-t bg-white/50 py-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        © 2026 Reputa Analytics • Protocol Integrated
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

