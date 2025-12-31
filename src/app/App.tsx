import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import logoImage from '../assets/logo.svg';

// Interfaces (تبقى كما هي)
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

  // 1. ربط الحساب (Pi Login)
  useEffect(() => {
    const initPi = async () => {
      try {
        if ((window as any).Pi) {
          const auth = await (window as any).Pi.authenticate(['username', 'payments', 'wallet_address'], (payment: any) => {
             console.log("Incomplete payment", payment);
          });
          setPiUser(auth.user);
        }
      } catch (err) {
        console.error("Pi Auth failed", err);
      }
    };
    initPi();
  }, []);

  // 2. معالجة البحث (جلب بيانات حقيقية من Pi Testnet Blockchain)
  const handleWalletCheck = async (address: string) => {
    setLoading(true);
    try {
      // الاتصال بشبكة التست نت الحقيقية
      const response = await fetch(`https://horizon-testnet.pi-blockchain.net/accounts/${address}`);
      
      if (!response.ok) {
        throw new Error("Wallet not found on Testnet");
      }

      const data = await response.json();

      // استخراج البيانات الحقيقية من البلوكشين
      const realBalance = data.balances.find((b: any) => b.asset_type === 'native')?.balance || "0";
      const realSequence = parseInt(data.sequence) || 0;

      // دمج البيانات الحقيقية مع هيكل البيانات المطلوب
      let finalData = generateMockWalletData(address);
      finalData.balance = parseFloat(realBalance);
      finalData.totalTransactions = realSequence;
      
      // تحديث السكور بناءً على الرصيد الفعلي المكتشف
      finalData.reputaScore = Math.min(Math.round((finalData.balance / 5) + 65), 100) * 10;
      
      if (finalData.balance > 1000) finalData.trustLevel = 'Elite';
      else if (finalData.balance > 100) finalData.trustLevel = 'High';

      setWalletData(finalData);
    } catch (err) {
      console.warn("Falling back to simulated data", err);
      // في حال لم تكن المحفظة موجودة في التست نت، نستخدم البيانات الافتراضية
      setWalletData(generateMockWalletData(address));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => setWalletData(null);
  const handleUpgradePrompt = () => setIsUpgradeModalOpen(true);

  // 3. تفعيل زر الدفع الحقيقي مع الربط بالخادم للموافقة
  const handleAccessUpgrade = async () => {
    if (!(window as any).Pi) return;
    try {
      await (window as any).Pi.createPayment({
        amount: 1,
        memo: "VIP Membership - Reputa Score",
        metadata: { userId: piUser?.uid }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          // إرسال الطلب لملف api/approve.ts في Vercel لحل مشكلة "Dev not approved"
          try {
            await fetch('/api/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId })
            });
          } catch (error) {
            console.error("Server approval request failed", error);
          }
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        },
        onCancel: (paymentId: string) => { console.log("Cancelled"); },
        onError: (err: any) => { console.error("Payment Error:", err); }
      });
    } catch (err) {
      console.error("Payment initiation failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Reputa Score
                </h1>
                <p className="text-xs text-gray-500">{piUser ? `@${piUser.username}` : 'v2.5 • Pi Network'}</p>
              </div>
            </div>
            {hasProAccess && (
              <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg">
                <span className="text-sm font-semibold text-white">Pro Member</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-purple-600 font-medium">
            Fetching Real-time Blockchain Data...
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

      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16 py-6 text-center text-sm text-gray-500">
        © 2024 Reputa Analytics. Powered by Pi Network.
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />
    </div>
  );
}

// --- الدوال المساعدة (توليد بيانات تكميلية للواجهة) ---
function generateMockWalletData(address: string): WalletData {
  const seed = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const balance = random(100, 10000) + random(0, 99) / 100;
  const accountAge = random(30, 730);
  const totalTransactions = random(10, 500);

  const transactions: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
      id: `tx_${seed}_${i}`,
      type: random(0, 1) === 1 ? 'received' : 'sent',
      amount: random(1, 100),
      from: generateRandomAddress(seed + i),
      to: generateRandomAddress(seed + i + 1),
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
  }));

  const trustScore = Math.round(Math.min((balance / 1000) * 30, 30) + Math.min((accountAge / 365) * 40, 40) + 30);

  return {
    address, balance, accountAge, transactions, totalTransactions,
    reputaScore: trustScore * 10,
    trustLevel: trustScore >= 90 ? 'Elite' : trustScore >= 70 ? 'High' : 'Medium',
    consistencyScore: random(60, 95),
    networkTrust: random(70, 99),
    riskLevel: 'Low'
  };
}

function generateRandomAddress(seed: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let addr = 'G';
  for (let i = 0; i < 55; i++) addr += chars[Math.floor(Math.abs(Math.sin(seed + i) * 10000) % chars.length)];
  return addr;
}
