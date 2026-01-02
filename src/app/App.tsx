import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import { fetchWalletData, initializePi, checkVIPStatus } from './protocol'; // الربط مع البروتوكول
import logoImage from '../assets/logo.svg';
import type { WalletData } from './protocol/types';

export default function App() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // تهيئة SDK عند بدء التطبيق
  useEffect(() => {
    initializePi().catch(console.error);
  }, []);

  const handleWalletCheck = async (address: string) => {
    setIsLoading(true);
    try {
      // جلب البيانات الحقيقية من البلوكشين بدلاً من generateMockWalletData
      const realData = await fetchWalletData(address);
      
      // التحقق من حالة الاشتراك الحقيقية
      const isVIP = checkVIPStatus(address);
      
      // مطابقة البيانات المجلوبة مع الهيكل الذي تتوقعه الواجهة (Mapping)
      const mappedData = {
        ...realData,
        reputaScore: (realData as any).scores?.totalScore || 500,
        trustLevel: (realData as any).trustLevel || 'Medium',
        consistencyScore: (realData as any).scores?.miningScore || 70,
        networkTrust: 85,
        riskLevel: 'Low'
      };

      setWalletData(mappedData);
      setCurrentWalletAddress(address);
      setHasProAccess(isVIP);
    } catch (error) {
      console.error("Testnet Connection Error:", error);
      alert("Error: Could not fetch data from Pi Testnet. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWalletData(null);
    setShowDashboard(false);
  };

  const handleUpgradePrompt = () => {
    setIsUpgradeModalOpen(true);
  };

  const handleAccessUpgrade = () => {
    // سيتم استدعاء هذه الدالة بعد نجاح دفع 1 Pi في المتصفح
    setHasProAccess(true);
    setIsUpgradeModalOpen(false);
    if (currentWalletAddress) handleWalletCheck(currentWalletAddress);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
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
                <p className="text-xs text-gray-500">v2.5 • Pi Testnet Live</p>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Fetching Testnet Data...</p>
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

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          © 2026 Reputa Analytics. Connected to Pi Network Testnet.
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
          currentUser={null} 
        />
      )}
    </div>
  );
}

// ملاحظة: قمنا بحذف دالة generateMockWalletData تماماً للاعتماد على البيانات الحقيقية
