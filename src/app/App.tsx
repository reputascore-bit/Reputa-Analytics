import { useState, useEffect } from 'react';  
import { Analytics } from '@vercel/analytics/react';
import { Send } from 'lucide-react'; 
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk';
import logoImage from '../assets/logo.png';

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  // ✅ وظيفة حفظ بيانات الرائد مع جلب عنوان المحفظة الحقيقي
  const savePioneerToDatabase = async (user: any) => {
    try {
      if (!user || user.uid === "demo") return;
      
      // نستخدم wallet_address إذا وجد، وإلا نستخدم الـ uid كاحتياط
      const walletIdentifier = user.wallet_address || user.uid;

      await fetch('/api/save-pioneer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          wallet: walletIdentifier, 
          timestamp: new Date().toISOString()
        }),
      });
      console.log("Success: Wallet Address synced to Upstash.");
    } catch (error) {
      console.error("Failed to sync pioneer data:", error);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        setCurrentUser({ username: "Guest_Explorer", uid: "demo" });
        setIsInitializing(false);
        return;
      }
      try {
        const sdkTimeout = setTimeout(() => setIsInitializing(false), 5000);
        
        await initializePiSDK();
        
        // ✅ طلب صلاحية الوصول لعنوان المحفظة (wallet_address)
        const user = await authenticateUser(['username', 'wallet_address']).catch(() => null);
        
        if (user) {
          setCurrentUser(user);
          savePioneerToDatabase(user);
        }
        
        clearTimeout(sdkTimeout);
      } catch (e) { 
        console.warn("Fallback Mode Active"); 
      } finally { 
        setIsInitializing(false); 
      }
    };
    initApp();
  }, [piBrowser]);

  const handleTryDemo = () => {
    setIsLoading(true);
    setWalletData(null); 
    setTimeout(() => {
      const demoData = {
        address: "GDU72WEH7M3O...MWPDYFBT",
        username: "Demo_Pioneer",
        balance: 82.27,
        reputaScore: 632,
        accountAge: 1751,
        createdAt: new Date('2019-03-14'),
        totalTransactions: 142,
        transactions: Array(15).fill(null).map((_, i) => ({
          id: `tx-demo-${i}`,
          amount: Math.random() * 20,
          type: i % 2 === 0 ? 'internal' : 'external',
          timestamp: new Date(),
          from: "GDX_SOURCE",
          to: "GDU_DEST",
          memo: "Demo Tx"
        })),
        trustLevel: "Elite",
        consistencyScore: 88,
        networkTrust: 92
      };
      setWalletData(demoData);
      setIsLoading(false);
    }, 800);
  };

  const handleWalletCheck = async (address: string) => {
    if (address === 'demo') {
      handleTryDemo();
      return;
    }

    if (!address) return;
    setIsLoading(true);
    setWalletData(null); 
    
    try {
      const data = await fetchWalletData(address);
      if (data && typeof data.reputaScore === 'number') {
        setWalletData({
          ...data,
          totalTransactions: data.totalTransactions || data.transactions?.length || 0,
          trustLevel: data.reputaScore >= 600 ? 'Elite' : 'Verified'
        });

        if (currentUser && currentUser.uid !== "demo") {
           savePioneerToDatabase(currentUser);
        }

        setTimeout(() => refreshWallet(address).catch(() => null), 200);
      } else {
        alert("Data format error. Please try again.");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Network Error: Could not connect to Pi Blockchain.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing && piBrowser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-purple-600 font-black animate-pulse uppercase tracking-widest text-xs">Initialising Reputa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start overflow-x-hidden md:py-8">
      <div className="w-full max-w-[450px] min-h-screen md:min-h-[850px] bg-white md:rounded-[3rem] md:shadow-2xl flex flex-col font-sans relative overflow-hidden border-x border-gray-100">
        
        <header className="border-b p-5 bg-white/95 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-1.5 rounded-xl">
               <img src={logoImage} alt="logo" className="w-7 h-7" />
            </div>
            <div className="leading-tight">
              <h1 className="font-black text-purple-700 text-base tracking-tighter uppercase">Reputa Score</h1>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                 Hi, {currentUser?.username || 'Guest'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href="https://t.me/+zxYP2x_4IWljOGM0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-[#229ED9] bg-blue-50 rounded-full hover:bg-blue-100 transition-all active:scale-90"
            >
              <Send className="w-4 h-4" />
            </a>

            {piBrowser && !currentUser?.uid && (
              <button 
                onClick={() => authenticateUser(['username', 'wallet_address']).then((user) => {
                  setCurrentUser(user);
                  savePioneerToDatabase(user);
                })} 
                className="px-3 py-1.5 bg-purple-600 text-white rounded-full text-[9px] font-black uppercase shadow-lg shadow-purple-200 active:scale-95 transition-all"
              >
                Link
              </button>
            )}
          </div>
        </header>

        <main className="container mx-auto px-5 py-6 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center py-20">
              <div className="w-14 h-14 border-[5px] border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="text-[10px] mt-8 font-black text-purple-600 tracking-[0.4em] uppercase text-center animate-pulse">Analyzing Chain...</p>
            </div>
          ) : !walletData ? (
            <div className="max-w-md mx-auto">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Trust Protocol</h2>
                <p className="text-xs text-gray-400 font-medium">Verify on-chain reputation instantly</p>
              </div>
              <WalletChecker onCheck={handleWalletCheck} />
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
               <WalletAnalysis
                walletData={walletData}
                isProUser={true} 
                onReset={() => setWalletData(null)}
                onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
              />
            </div>
          )}
        </main>

        <footer className="p-8 text-center border-t flex flex-col items-center gap-5 bg-gray-50/50">
          <a 
            href="https://t.me/+zxYP2x_4IWljOGM0" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full max-w-[200px] flex items-center justify-center gap-2 py-3 bg-[#229ED9] text-white rounded-2xl text-[11px] font-black uppercase shadow-xl shadow-blue-100 hover:shadow-blue-200 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            Community Group
          </a>
          <div className="space-y-1">
            <div className="text-[10px] text-gray-400 font-black tracking-[0.3em] uppercase">
              Reputa Protocol v4.5
            </div>
            <div className="text-[8px] text-gray-300 font-medium uppercase">Secure • Decentralized • Transparent</div>
          </div>
        </footer>

        <AccessUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} onUpgrade={() => {}} />
        <Analytics />
      </div>
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
