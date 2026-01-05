import { useState, useEffect, useCallback } from 'react'; 
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
  const [hasProAccess, setHasProAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { updateMiningDays, miningDays, trustScore, refreshWallet } = useTrust();
  const piBrowserActive = isPiBrowser();

  // 1. الربط الذكي: يتم استدعاؤه عند الحاجة فقط ويخزن البيانات
  const ensureAuth = useCallback(async () => {
    if (!piBrowserActive) return null;
    try {
      await initializePiSDK();
      // إذا كان المستخدم مسجلاً بالفعل، لا نطلب الربط مجدداً
      if (currentUser) return currentUser;

      const user = await authenticateUser(['username', 'payments']);
      if (user) {
        setCurrentUser(user);
        setHasProAccess(checkVIPStatus(user.uid));
        return user;
      }
    } catch (e) {
      console.error("Auth sync failed", e);
    }
    return null;
  }, [piBrowserActive, currentUser]);

  // محاولة الربط الصامت عند فتح التطبيق
  useEffect(() => {
    ensureAuth();
  }, []);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      
      const enhancedScore = trustScore > 0 
        ? Math.min(1000, (data.totalTransactions || 0) * 10 + (miningDays / 10))
        : 650;

      setWalletData({
        ...data,
        reputaScore: enhancedScore,
        trustScore: enhancedScore / 10,
        consistencyScore: miningDays > 0 ? Math.min(100, miningDays / 10) : 75,
        networkTrust: Math.min(100, data.totalTransactions || 0),
        trustLevel: enhancedScore >= 800 ? 'Elite' : enhancedScore >= 600 ? 'High' : 'Medium'
      });
    } catch (error) {
      alert('Blockchain Sync Error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. تدفق الدفع المترابط (بدون تكرار النوافذ)
  const handleAccessUpgrade = async () => {
    if (!piBrowserActive) {
      alert('Please use Pi Browser');
      return;
    }

    try {
      // التأكد من الهوية أولاً (سيعيد المستخدم الحالي دون نافذة منبثقة إذا كان مسجلاً)
      const user = await ensureAuth();
      
      if (!user?.uid) {
        alert("Please authorize the app first.");
        return;
      }

      // بدء الدفع مباشرة
      await createVIPPayment(user.uid);
      
      // فحص التفعيل تلقائياً
      const timer = setInterval(() => {
        if (checkVIPStatus(user.uid)) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
          clearInterval(timer);
        }
      }, 3000);
      
      setTimeout(() => clearInterval(timer), 60000);

    } catch (error) {
      alert('Payment initialization failed. Ensure your Pi wallet is open.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50 overflow-x-hidden flex flex-col">
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logoImage} alt="logo" className="w-9 h-9" />
              <div className="min-w-0">
                <h1 className="font-bold text-base text-purple-700 truncate">Reputa Score</h1>
                <p className="text-[9px] text-gray-400 font-bold uppercase truncate">
                  {piBrowserActive ? '● Online' : '○ Demo'} • {currentUser?.username || 'Connecting...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="bg-purple-600 px-3 py-1 rounded-md cursor-pointer active:scale-95 transition-all">
                <span className="text-[9px] font-black text-white">BOOST ↑</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) updateMiningDays(file);
                }} />
              </label>
              {hasProAccess && <div className="px-2 py-1 bg-yellow-400 text-white text-[8px] font-black rounded-full italic">VIP</div>}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1 w-full max-w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-purple-600">
            <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[9px] font-bold uppercase tracking-widest">Blockchain Sync...</p>
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

      <footer className="border-t bg-white/50 py-4 text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
        © 2026 Reputa Analytics • Protocol v2.0
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />
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
