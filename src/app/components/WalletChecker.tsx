import { useState } from 'react';
import { Search, Shield, Info, Sparkles, Fingerprint, Database } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import logoImage from '../../assets/logo.svg';

interface WalletCheckerProps {
  onCheck: (address: string) => void;
}

export function WalletChecker({ onCheck }: WalletCheckerProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddress = address.trim();
    
    // قواعد التحقق الصارمة لشبكة Pi
    if (!cleanAddress) {
      setError('Please enter a wallet address');
      return;
    }

    if (!cleanAddress.startsWith('G')) {
      setError('Pi Network addresses must start with "G"');
      return;
    }

    if (cleanAddress.length !== 56) {
      setError('Pi addresses should be exactly 56 characters');
      return;
    }

    setError('');
    onCheck(cleanAddress);
  };

  const handleTryDemo = () => {
    // عنوان حقيقي نشط في التست نت للتجربة
    const demoAddress = 'GDH6V5W2N45LCH477HIKR5277RTM7S6K26T5S66O6S6S6S6S6S6S6S6S';
    setAddress(demoAddress);
    setError('');
    onCheck(demoAddress);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center mb-6 relative group">
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full group-hover:bg-purple-500/30 transition-all"></div>
          <img 
            src={logoImage} 
            alt="Reputa Score" 
            className="w-28 h-28 object-contain drop-shadow-2xl relative z-10 hover:scale-105 transition-transform"
          />
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
            On-Chain Reputation
          </span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
          The first professional analytics tool for Pi Network wallets. 
          Audit your trust score in seconds.
        </p>
      </div>

      {/* Input Terminal Card */}
      <Card className="p-1 shadow-2xl border-none bg-gradient-to-br from-gray-100 to-white overflow-hidden">
        <div className="bg-white p-8 rounded-[inherit]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label htmlFor="wallet-address" className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">
                  Public Wallet Address
                </label>
                {address.length > 0 && (
                  <span className="text-[10px] font-mono text-gray-400">
                    {address.length}/56 chars
                  </span>
                )}
              </div>
              
              <div className="relative group">
                <Input
                  id="wallet-address"
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value.toUpperCase());
                    if(error) setError('');
                  }}
                  placeholder="G..."
                  className={`h-16 text-lg font-mono bg-gray-50/50 border-2 transition-all focus:ring-4 focus:ring-purple-500/10 ${
                    error ? 'border-red-200 bg-red-50/30' : 'border-gray-100 focus:border-purple-500'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <div className="h-8 w-px bg-gray-200 mx-2"></div>
                   <Search className={`w-6 h-6 ${address ? 'text-purple-600' : 'text-gray-300'} transition-colors`} />
                </div>
              </div>
              
              {error && (
                <p className="flex items-center gap-2 text-sm font-semibold text-red-500 animate-bounce">
                  <Info className="w-4 h-4" /> {error}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit" 
                className="flex-1 h-14 bg-gray-900 hover:bg-black text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all group"
              >
                Start Full Audit
                <Sparkles className="w-5 h-5 ml-2 group-hover:animate-spin" />
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTryDemo}
                className="h-14 px-8 border-2 font-bold hover:bg-gray-50 rounded-xl"
              >
                Demo
              </Button>
            </div>
          </form>

          {/* Verification Badge */}
          <div className="mt-8 pt-6 border-t border-gray-50 flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
              <Shield className="w-4 h-4 text-emerald-500" />
              End-to-End Encrypted
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
              <Database className="w-4 h-4 text-blue-500" />
              Direct Node Access
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
              <Fingerprint className="w-4 h-4 text-purple-500" />
              Public Data Only
            </div>
          </div>
        </div>
      </Card>

      {/* Secondary Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <div className="space-y-3">
          <div className="w-10 h-10 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold">1</div>
          <h4 className="font-bold text-gray-800">Submit Address</h4>
          <p className="text-sm text-gray-500 leading-relaxed">Enter your public G-address. We never require your passphrase or private keys.</p>
        </div>
        <div className="space-y-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">2</div>
          <h4 className="font-bold text-gray-800">Scan Ledger</h4>
          <p className="text-sm text-gray-500 leading-relaxed">Our engine scans the Pi Blockchain for your last 100 transactions and balance status.</p>
        </div>
        <div className="space-y-3">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold">3</div>
          <h4 className="font-bold text-gray-800">Generate Score</h4>
          <p className="text-sm text-gray-500 leading-relaxed">Get a comprehensive trust report and a verified Reputa Score for your profile.</p>
        </div>
      </div>
    </div>
  );
}
