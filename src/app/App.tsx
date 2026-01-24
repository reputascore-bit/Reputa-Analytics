import { useState, useEffect } from 'react';   
import { Analytics } from '@vercel/analytics/react';
import { Send, MessageSquare, Lock, LogOut, ShieldCheck } from 'lucide-react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk';
import logoImage from '../assets/logo.png';

// --- مكون Feedback: مرتبط بـ save-feedback.ts ---
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
      if (res.ok) { 
        setFeedback(''); 
        setStatus('✅ SENT'); 
        setTimeout(() => setStatus(''), 3000); 
      }
    } catch (e) { setStatus('❌ ERROR'); }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner">
      <div className="flex items-center gap-2 mb-3 px-1">
        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Feedback</span>
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="How can we improve your experience?"
        className="w-full p-4 text-[11px] bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-purple-400 min-h-[90px] transition-all"
      />
      <button onClick={submitFeedback} className="mt-3 w-full py-3.5 bg-white border border-slate-200 text-slate-700 text-[9px] font-black uppercase rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-sm">
        {status || 'Submit Suggestion'}
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

  // --- دالة الربط المركزي مع save-pioneer.ts لتظهر البيانات في view.ts ---
  const syncToAdmin = async (uname: string, waddr: string) => {
    try {
      await fetch('/api/save-pioneer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: uname, 
          wallet: waddr, 
          timestamp: new Date().toISOString() 
        })
      });
    } catch (e) { console.error("Sync Error"); }
  };

  // --- التحقق من VIP وتسجيل الدخول ---
  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        const guest = { username: "🌐 External_User", uid: "demo" };
        setCurrentUser(guest);
        syncToAdmin(guest.username, "Web Browser");
        setIsInitializing(false);
        return;
      }
      try {
        await initializePiSDK();
        const user = await authenticateUser(['username', 'wallet_address']).catch(() => null);
        if (user) {
          setCurrentUser(user);
          syncToAdmin(user.username, user.wallet_address || "Searching...");
          
          // الربط مع checkVip.ts
          const res = await fetch(`/api/checkVip?uid=${user.uid}`).then(r => r.json()).catch(() => ({isVip: false, count: 0}));
          setIsVip(res.isVip);
          setPaymentCount(res.count || 0);
        }
      } catch (e) { console.warn("Pi Auth Failed"); } finally { setIsInitializing(false); }
    };
    initApp();
  }, [piBrowser]);

  const handleWalletCheck = async (address: string) => {
    setIsLoading(true);
    if (address.toLowerCase().trim() === 'demo') {
      setTimeout(() => {
        setWalletData({ address: "GDU22WEH...DEMO", username: "Demo_Pioneer", reputaScore: 632, trustLevel: "Elite" });
        setIsLoading(false);
      }, 500); 
      return;
    }

    try {
      const data = await fetchWalletData(address);
      if (data) {
        setWalletData({ ...data, trustLevel: data.reputaScore >= 600 ? 'Elite' : 'Verified' });
        syncToAdmin(currentUser?.username || 'Guest', address);
        refreshWallet(address).catch(() => null);
      }
    } catch (error) { alert("Blockchain sync error."); } finally { setIsLoading(false); }
  };

  const isUnlocked = isVip || paymentCount >= 1 || walletData?.username === "Demo_Pioneer";

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="border-b p-4 bg-white/95 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
             <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <div className="leading-tight">
            <h1 className="font-black text-slate-900 text-lg tracking-tighter uppercase">Reputa <span className="text-purple-600">Score</span></h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                {currentUser?.username || 'Pioneer'} {isVip && "• VIP"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={() => { setWalletData(null); setIsVip(false); setPaymentCount(0); }}
              className="p-2.5 text-slate-400 bg-slate-50 rounded-full hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <a href="https://t.me/+zxYP2x_4IWljOGM0" target="_blank" className="p-2.5 text-[#229ED9] bg-blue-50 rounded-full shadow-sm"><Send className="w-4 h-4" /></a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-32 animate-pulse">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Scanning Blockchain...</span>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto space-y-4">
            <WalletChecker onCheck={handleWalletCheck} />
            <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
             <div className="relative group overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                <WalletAnalysis 
                  walletData={walletData} 
                  isProUser={isUnlocked} 
                  onReset={() => setWalletData(null)} 
                  onUpgradePrompt={() => setIsUpgradeModalOpen(true)} 
                />

                {/* --- القفل المركزي المحسن (35% من المساحة السفلية) --- */}
                {!isUnlocked && (
                  <div className="absolute inset-x-0 bottom-0 h-[41%] z-30 flex flex-col items-center justify-end overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/98 to-transparent backdrop-blur-[8px]" />
                    <div className="relative pb-10 px-8 text-center w-full max-w-sm animate-in fade-in zoom-in duration-700">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-xl border border-purple-50 mb-4 mx-auto">
                        <Lock className="w-6 h-6 text-purple-600 animate-pulse" />
                      </div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-2">VIP Analytics Locked</h3>
                      <p className="text-[9px] text-slate-400 font-medium mb-6 leading-relaxed">Detailed trust metrics and historical patterns require <span className="text-purple-600 font-bold">VIP ACCESS</span></p>
                      <button 
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="w-full py-4 bg-purple-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-purple-200 active:scale-95 transition-all hover:bg-purple-700 tracking-widest"
                      >
                        Unlock Full VIP Report
                      </button>
                    </div>
                  </div>
                )}
             </div>
             <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        )}
      </main>

      <footer className="p-8 text-center">
         <div className="text-[10px] text-slate-300 font-bold tracking-[0.5em] uppercase">Security Protocol 4.2 • Stable</div>
      </footer>

      <AccessUpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        currentUser={currentUser}
        onUpgrade={() => { 
          setIsVip(true); 
          setPaymentCount(1); 
          setIsUpgradeModalOpen(false); 
          syncToAdmin(currentUser?.username, "VIP_PAYMENT_CONFIRMED"); 
        }} 
      />
      <Analytics />
    </div>
  );
}

export default function App() { return (<TrustProvider><ReputaAppContent /></TrustProvider>); }
