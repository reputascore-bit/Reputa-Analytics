import { useState } from 'react';
import { Search, Shield, Info, Lock, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import logoImage from '../../assets/logo.png'; // تم التأكد من الامتداد الصحيح حسب الكود السابق

interface WalletCheckerProps {
  onCheck: (address: string) => void;
}

export function WalletChecker({ onCheck }: WalletCheckerProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // تنظيف العنوان من المسافات الزائدة وتحويله للكبير تلقائياً
    const cleanAddress = address.trim().toUpperCase();

    // القواعد الصارمة لعناوين محفظة Pi Network
    if (!cleanAddress) {
      setError('Please enter a wallet address');
      return;
    }

    // عناوين Pi تبدأ دائماً بحرف G وتتكون من 56 حرفاً
    if (!cleanAddress.startsWith('G')) {
      setError('Pi Network addresses must start with "G"');
      return;
    }

    if (cleanAddress.length !== 56) {
      setError('Invalid address length. Pi addresses are exactly 56 characters.');
      return;
    }

    // التحقق من أن العنوان يحتوي فقط على أحرف وأرقام صالحة (Base32)
    const base32Regex = /^[A-Z2-7]+$/;
    if (!base32Regex.test(cleanAddress)) {
      setError('Invalid characters detected in wallet address.');
      return;
    }

    setError('');
    // ✅ إرسال العنوان النظيف لـ App.tsx ليتم تخزينه في Upstash فوراً
    onCheck(cleanAddress);
  };

  // ✅ التعديل لضمان عمل الديمو بانسجام مع ملف App.tsx المحدث
  const handleTryDemo = () => {
    setError('');
    // نرسل 'demo' لكي يفهم App.tsx أنه يجب عرض بيانات الديمو
    onCheck('demo');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 blur-3xl rounded-full"></div>
          <img 
            src={logoImage} 
            alt="Reputa Score" 
            className="w-32 h-32 object-contain drop-shadow-2xl relative z-10"
          />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Decode Wallet Behavior
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
          Discover what your Pi Network wallet reveals about trust, consistency, and reputation.
        </p>
        <p className="text-sm text-gray-500 max-w-xl mx-auto">
          Advanced on-chain intelligence • No private keys required
        </p>
      </div>

      {/* Main Card */}
      <Card className="p-8 shadow-xl border-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="wallet-address" className="block mb-2 font-semibold text-gray-700">
              Enter Wallet Address
            </label>
            <div className="relative">
              <Input
                id="wallet-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="pr-12 h-14 text-lg font-mono uppercase focus:ring-purple-500 border-gray-200"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 font-medium animate-pulse">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg active:scale-95 text-white font-bold"
            >
              Analyze Wallet
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleTryDemo}
              className="h-12 border-2 hover:bg-gray-50 font-bold text-gray-600"
            >
              Try Demo
            </Button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Privacy First</p>
              <p className="text-blue-700">
                This app only uses public blockchain data. We never ask for private keys or seed phrases.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="p-6 text-center hover:border-purple-300 transition-all hover:shadow-md cursor-default">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-2">Trust Score</h3>
          <p className="text-sm text-gray-600">
            Advanced algorithm evaluating wallet reputation
          </p>
        </Card>

        <Card className="p-6 text-center hover:border-blue-300 transition-all hover:shadow-md cursor-default">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Transaction History</h3>
          <p className="text-sm text-gray-600">
            View recent wallet activity and patterns
          </p>
        </Card>

        <Card className="p-6 text-center hover:border-yellow-300 transition-all hover:shadow-md cursor-default">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Instant Analysis</h3>
          <p className="text-sm text-gray-600">
            Get results in milliseconds from blockchain
          </p>
        </Card>
      </div>
    </div>
  );
}
