import { useState, useEffect } from 'react';   
import { Analytics } from '@vercel/analytics/react';
import { Send, MessageSquare, Lock, LogOut } from 'lucide-react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk';
import logoImage from '../assets/logo.png';

function FeedbackSection({ username }: { username: string }) {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    setStatus('SENDING...');
    try {
      const res = await fetch('/api/save-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, text: feedback, timestamp: new Date().toISOString() }),
      });
      if (res.ok) { setFeedback(''); setStatus('✅ SENT'); setTimeout(() => setStatus(''), 3000); }
    } catch (e) { setStatus('❌ ERROR'); }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 rounded-3xl border border-dashed border-purple-200 bg-purple-50/30">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Send feedback to admin..."
        className="w-full p-4 text-[11px] bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-purple-400 min-h-[80px]"
      />
      <button onClick={submitFeedback} className="mt-2 w-full py-3 bg-purple-600 text-white text-[9px] font-black uppercase rounded-xl shadow-md">
        {status || 'Submit Feedback'}
      </button>
    </div>
  );
}

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVip, setIsVip] = useState(false);
  const [paymentCount, setPaymentCount] = useState(0);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  // دالة تسجيل الخروج (إلغاء ربط الحساب)
  const handleLogout = () => {
    setWalletData(null);
    setIsVip(false);
    setPaymentCount(0);
    // إذا أردت مسح الجلسة تماماً يمكن إضافة: window.location.reload();
  };

  // دالة مزامنة البيانات مع لوحة تحكم view.ts
  const syncWithAdmin = async (uname: string, walletAddr: string) => {
    try {
      await fetch('/api/save-pioneer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: uname, 
          wallet: walletAddr, 
          timestamp: new Date().toISOString() 
        })
      });
    } catch (e) { console.error("Admin Sync Failed"); }
  };

  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        const guest = { username: "🌐 External_Browser", uid: "demo" };
        setCurrentUser(guest);
        syncWithAdmin(guest.username, "No Pi Wallet");
        setIsInitializing(false);
        return;
      }
      try {
        await initializePiSDK();
        const user = await authenticateUser(['username', 'wallet_address']).catch(() => null);
        if (user) {
          setCurrentUser(user);
          syncWithAdmin(user.username, user.wallet_address || "Searching...");
          
          const res = await fetch(`/api/checkVip?uid=${user.uid}`).then(r => r.json()).catch(() => ({isVip: false, count: 0}));
          setIsVip(res.isVip);
          setPaymentCount(res.count || 0);
        }
      } catch (e) { console.warn("Pi Auth Error"); } finally { setIsInitializing(false); }
    };
    initApp();
  }, [piBrowser]);

  const handleWalletCheck = async (address: string) => {
    setIsLoading(true);
    if (address.toLowerCase().trim() === 'demo') {
      setTimeout(() => {
        setWalletData({ address: "GDU22WEH...DEMO", username: "Demo_Pioneer", reputaScore: 632, trustLevel: "Elite" });
        setIsLoading(false);
      }, 400); 
      return;
    }

    try {
      const data = await fetchWalletData(address);
      if (data) {
        setWalletData({ ...data, trustLevel: data.reputaScore >= 600 ? 'Elite' : 'Verified' });
        syncWithAdmin(currentUser?.username || 'Guest', address); // تحديث المحفظة في لوحة التحكم
        refreshWallet(address).catch(() => null);
      }
    } catch (error) { alert("Blockchain sync error."); } finally { setIsLoading(false); }
  };

  const isUnlocked = isVip || paymentCount >= 1 || walletData?.username === "Demo_Pioneer";

  if (isInitializing && piBrowser) {
    return <div className="min-h-screen bg-white flex items-center justify-center font-black text-purple-600 animate-pulse uppercase text-xs">Loading Reputa...</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="border-b p-4 bg-white/95 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <div className="leading-tight">
            <h1 className="font-black text-purple-700 text-lg tracking-tighter uppercase">Reputa Score</h1>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                {currentUser?.username || 'Guest'} {isVip && "⭐ VIP"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* زر تسجيل الخروج / فك الربط */}
          <button onClick={handleLogout} className="p-2 text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-colors shadow-sm">
            <LogOut className="w-4 h-4" />
          </button>
          <a href="https://t.me/+zxYP2x_4IWljOGM0" target="_blank" className="p-2 text-[#229ED9] bg-blue-50 rounded-full"><Send className="w-4 h-4" /></a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
            <div className="flex flex-col items-center py-24"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto py-6">
            <WalletChecker onCheck={handleWalletCheck} />
            <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
             <div className="relative overflow-hidden rounded-[40px] border border-gray-100 shadow-sm">
                <WalletAnalysis walletData={walletData} isProUser={isUnlocked} onReset={() => setWalletData(null)} onUpgradePrompt={() => setIsUpgradeModalOpen(true)} />
                {!isUnlocked && (
                  <div className="absolute inset-x-0 bottom-0 h-[35%] z-20 flex flex-col items-center justify-end">
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-[5px]" />
                    <div className="relative pb-8 px-6 text-center w-full">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-md mb-3"><Lock className="w-4 h-4 text-purple-600" /></div>
                      <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-1">Detailed Audit Locked</h3>
                      <button onClick={() => setIsUpgradeModalOpen(true)} className="w-full max-w-[180px] py-3 bg-purple-600 text-white text-[8px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">Unlock Now</button>
                    </div>
                  </div>
                )}
             </div>
             <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        )}
      </main>

      <footer className="p-6 text-center border-t border-gray-50 text-[9px] text-gray-300 font-black tracking-[0.4em] uppercase">Reputa Score v4.2 Stable</footer>

      <AccessUpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        currentUser={currentUser}
        onUpgrade={() => { 
          setIsVip(true); 
          setPaymentCount(1); 
          setIsUpgradeModalOpen(false); 
          syncWithAdmin(currentUser?.username, "PAID_VIP_USER"); // تسجيل الدفع في لوحة التحكم
        }} 
      />
      <Analytics />
    </div>
  );
}

export default function App() { return (<TrustProvider><ReputaAppContent /></TrustProvider>); }
