import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import logoImage from '../assets/logo.svg';

// تعريف أنواع البيانات
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

  // 1. طلب تسجيل الدخول فور فتح التطبيق في Pi Browser
  useEffect(() => {
    const loginToPi = async () => {
      try {
        if ((window as any).Pi) {
          const scopes = ['username', 'payments', 'wallet_address'];
          const auth = await (window as any).Pi.authenticate(scopes, onIncompletePaymentFound);
          setPiUser(auth.user);
          console.log("Welcome:", auth.user.username);
        }
      } catch (err) {
        console.error("Pi Login Failed:", err);
      }
    };
    loginToPi();
  }, []);

  const onIncompletePaymentFound = (payment: any) => {
    console.log("Incomplete payment found", payment);
  };

  const handleWalletCheck = (address: string) => {
    const mockData = generateMockWalletData(address);
    setWalletData(mockData);
  };

  const handleReset = () => setWalletData(null);
  const handleUpgradePrompt = () => setIsUpgradeModalOpen(true);

  // 2. تفعيل عملية الدفع الحقيقية (VIP Upgrade)
  const handleAccessUpgrade = async () => {
    if (!(window as any).Pi) return;

    try {
      const paymentData = {
        amount: 1.0, // المبلغ بـ Pi
        memo: "Upgrade to Reputa Score VIP",
        metadata: { userId: piUser?.uid || "anonymous" }
      };

      const callbacks = {
        onReadyForServerApproval: (paymentId: string) => {
          console.log("Payment waiting for approval:", paymentId);
          // هنا يتم الربط مع Vercel API Key تلقائياً
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          console.log("Payment Finished!", txid);
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        },
        onCancel: (paymentId: string) => console.log("Cancelled"),
        onError: (error: any) => console.error("Payment Error", error)
      };

      await (window as any).Pi.createPayment(paymentData, callbacks);
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
                <p className="text-xs text-gray-500">
                  {piUser ? `@${piUser.username}` : 'v2.5 • Pi Network'}
                </p>
              </div>
            </div>
            {hasProAccess && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg">
                <span className="text-sm font-semibold text-white">Pro Member</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!walletData ? (
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

      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          © 2024 Reputa Analytics. Powered by Pi Network.
        </div>
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />
    </div>
  );
}

// ... بقية دوال الـ Mock كما هي في ملفك الأصلي لضمان عمل الواجهة
