import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { Settings, X, Zap, ShieldCheck, RefreshCcw } from 'lucide-react'; 
import logoImage from '../assets/logo.svg';

// --- Interfaces ---
export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  from: string;
  to: string;
  timestamp: Date;
  memo?: string;
}

export type TrustLevel = 'Low' | 'Medium' | 'High' | 'Elite';

export interface WalletData {
  address: string;
  balance: number;
  accountAge: number;
  transactions: Transaction[];
  totalTransactions: number;
  reputaScore: number;
  trustLevel: TrustLevel;
  consistencyScore: number;
  networkTrust: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export default function App() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [piUser, setPiUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // --- حالات لوحة التحكم المطور (App-to-User) ---
  const [isAdminOpen, setIsAdminOpen] = useState(false); 
  const [manualAddress, setManualAddress] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [txCount, setTxCount] = useState(0);

  // 1. تسجيل الدخول عبر Pi Network
  useEffect(() => {
    const initPi = async () => {
      try {
        if ((window as any).Pi) {
          const auth = await (window as any).Pi.authenticate(
            ['username', 'payments', 'wallet_address'], 
            (payment: any) => {
              console.log("Incomplete payment detected:", payment);
            }
          );
          setPiUser(auth.user);
        }
      } catch (err) {
        console.error("Pi Auth failed:", err);
      }
    };
    initPi();
  }, []);

  // 2. معالجة البحث عن المحفظة (الوضع العادي)
  const handleWalletCheck = async (address: string) => {
    setLoading(true);
    const cleanAddress = address.trim();
    
    try {
      const response = await fetch(`/api/get-wallet?address=${cleanAddress}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        alert("تنبيه: المحفظة غير موجودة في شبكة التست نت.");
        throw new Error("Wallet Not Found");
      }

      const nativeBalance = data.account.balances?.find((b: any) => b.asset_type === 'native');
      const realBalance = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

      const realTransactions: Transaction[] = data.operations.map((op: any) => ({
        id: op.id,
        type: op.to === cleanAddress ? 'received' : 'sent',
        amount: parseFloat(op.amount || 0),
        from: op.from || op.funder || 'System',
        to: op.to || cleanAddress,
        timestamp: new Date(op.created_at),
        memo: op.type.replace('_', ' ')
      }));

      setWalletData({
        address: cleanAddress,
        balance: realBalance,
        accountAge: realTransactions.length > 0 ? 
          Math.floor((Date.now() - realTransactions[realTransactions.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        transactions: realTransactions,
        totalTransactions: parseInt(data.account.sequence) || realTransactions.length,
        reputaScore: Math.min(Math.round((realBalance * 5) + (realTransactions.length * 10)), 1000),
        trustLevel: realBalance > 50 ? 'High' : 'Medium',
        consistencyScore: Math.min(70 + realTransactions.length, 98),
        networkTrust: 85,
        riskLevel: 'Low'
      });

    } catch (err) {
      console.error("Blockchain Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => setWalletData(null);
  const handleUpgradePrompt = () => setIsUpgradeModalOpen(true);

  // 3. دفع ترقية الحساب (User to App)
  const handleAccessUpgrade = async () => {
    if (!(window as any).Pi) return;
    try {
      await (window as any).Pi.createPayment({
        amount: 1,
        memo: "VIP Membership - Pro Analytics",
        metadata: { userId: piUser?.uid }
      }, {
        onReadyForServerApproval: (paymentId: string) => fetch('/api/approve', { method: 'POST', body: JSON.stringify({ paymentId }) }),
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          fetch('/api/complete', { method: 'POST', body: JSON.stringify({ paymentId, txid }) });
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        },
        onCancel: () => {},
        onError: () => {}
      });
    } catch (err) { console.error(err); }
  };

  // --- 4. دالة الإرسال من محفظة التطبيق (App to User) - تجاوز الـ 10 معاملات ---
  // استبدل الدالة القديمة في ملف App.tsx بهذا الكود المحدث
const handleManualTestnetTx = async () => {
  if (!manualAddress.startsWith('G') || manualAddress.length !== 56) {
    alert("الرجاء إدخال عنوان G صحيح");
    return;
  }

  setAdminLoading(true);

  try {
    // محاولة الاتصال بالسيرفر
    const response = await fetch('/api/admin-pay', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        recipientAddress: manualAddress,
        adminSecret: "123456" 
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setTxCount(prev => prev + 1);
      setManualAddress('');
      alert(`✅ تم الإرسال من محفظة التطبيق بنجاح!\nTXID: ${result.txid.substring(0, 15)}...`);
    } else {
      // إظهار الخطأ القادم من السيرفر
      alert(`❌ خطأ السيرفر: ${result.error || 'Unknown Error'}`);
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    alert("❌ فشل الاتصال بالسيرفر. تأكد من أن ملف api/admin-pay.js مرفوع في جذر المشروع (Root) وليس داخل src.");
  } finally {
    setAdminLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pb-24 relative overflow-hidden text-slate-900">
      
      {/* Admin Toggle Button */}
      <button 
        onClick={() => setIsAdminOpen(true)}
        className="fixed bottom-6 left-6 w-12 h-12 bg-purple-600 border border-purple-400 rounded-full flex items-center justify-center z-[999] shadow-2xl transition-all active:scale-90 hover:scale-110"
      >
        <Settings size={24} className="text-white" />
      </button>

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Reputa Score</h1>
          </div>
          {hasProAccess && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
              <Zap size={12} className="text-white fill-current" />
              <span className="text-[10px] font-black text-white uppercase">Pro Access</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-32 flex flex-col items-center gap-4">
            <RefreshCcw className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-slate-400 font-mono text-xs italic">Scanning Testnet Horizon...</p>
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

      {/* --- Developer Console Modal (App-to-User) --- */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[1000] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden shadow-purple-500/20">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <ShieldCheck size={28} className="text-purple-400" />
                <div>
                  <h3 className="text-white font-bold text-lg">Mainnet Readiness</h3>
                  <p className="text-[10px] text-purple-400 font-mono uppercase">App-to-User Gateway</p>
                </div>
              </div>
              <button onClick={() => setIsAdminOpen(false)} className="text-gray-400 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Progress Tracker */}
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Unique Wallets Sent</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{txCount}/10</span>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 font-black ml-1 uppercase">Recipient Testnet Address</label>
                <input 
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value.toUpperCase().trim())}
                  placeholder="GD..."
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono text-purple-300 focus:border-purple-500 outline-none transition-all placeholder:text-gray-800"
                />
              </div>

              <button 
                onClick={handleManualTestnetTx}
                disabled={adminLoading}
                className="w-full py-5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-purple-900/40"
              >
                {adminLoading ? 'EXECUTING ON SERVER...' : 'SEND 0.1 PI FROM APP'}
              </button>

              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                <p className="text-[11px] text-emerald-400/80 leading-relaxed text-center italic">
                  This bypasses the browser wallet. The <strong>App Wallet Seed</strong> stored in Vercel will be used to sign this transaction.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />
    </div>
  );
}
