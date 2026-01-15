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
  const [hasProAccess, setHasProAccess] = useState(false); // الحالة الافتراضية مغلق

  const piBrowserActive = isPiBrowser();
  const { refreshWallet } = useTrust();

  useEffect(() => {
    const initApp = async () => {
      // تحميل اسم المستخدم المخزن سابقاً إن وجد
      const savedUser = localStorage.getItem('reputa_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      if (piBrowserActive) {
        try {
          await initializePiSDK();
          const user = await authenticateUser(['username', 'payments']);
          if (user) {
            setCurrentUser(user);
            localStorage.setItem('reputa_user', JSON.stringify(user)); // حفظ المستخدم
            const isVIP = await checkVIPStatus(user.uid);
            setHasProAccess(isVIP);
          }
        } catch (e) { console.error("Pi SDK Error", e); }
      } else {
        // في المتصفح العادي: نترك المستخدم يرى الديمو ولكن زر الـ VIP متاح للتجربة
        if (!savedUser) {
          const demoUser = { username: "Guest_User", uid: "demo123" };
          setCurrentUser(demoUser);
        }
      }
    };
    initApp();
  }, [piBrowserActive]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      
      // بيانات تجريبية
      setWalletData({
        ...data,
        reputaScore: 850,
        trustScore: 85,
        consistencyScore: 95,
        networkTrust: 88,
        trustLevel: 'Elite'
      });
    } catch (error) {
      alert('Sync Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessUpgrade = async () => {
    if (!piBrowserActive) {
      // محاكاة دفع في المتصفح العادي
      alert("Demo: Payment Simulated Successfully!");
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
      return;
    }
    
    try {
      if (currentUser?.uid) {
        await createVIPPayment(currentUser.uid);
        setHasProAccess(true); // تفعيل بعد الدفع
        setIsUpgradeModalOpen(false);
      }
    } catch (e) { 
      alert("Payment failed or cancelled"); 
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="logo" className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-purple-700">Reputa Score</h1>
              {/* عرض اسم المستخدم هنا ليبقى ظاهراً */}
              <p className="text-[10px] text-gray-500 font-mono">
                {currentUser ? `Hi, ${currentUser.username}` : 'Initializing...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasProAccess ? (
              <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                👑 VIP MEMBER
              </span>
            ) : (
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="bg-purple-600 text-white text-[10px] px-3 py-1 rounded-full animate-pulse"
              >
                UPGRADE TO VIP
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {!walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={hasProAccess} // سيتغير المحتوى بناءً على الدفع
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[9px] text-gray-400 border-t bg-gray-50">
        Logged in as: {currentUser?.username || 'Guest'} | ID: {currentUser?.uid?.substring(0,8)}...
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
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
