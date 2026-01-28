import { useState } from 'react';
import { Search, Shield, Zap, Activity, Globe, Cpu, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import logoImage from '../../assets/logo-new.png';

interface WalletCheckerProps {
  onCheck: (address: string) => void;
}

export function WalletChecker({ onCheck }: WalletCheckerProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanAddress = address.trim().toUpperCase();

    if (!cleanAddress) {
      setError('Please enter a wallet address');
      return;
    }

    if (!cleanAddress.startsWith('G')) {
      setError('Pi Network addresses must start with "G"');
      return;
    }

    if (cleanAddress.length !== 56) {
      setError('Invalid address length. Pi addresses are exactly 56 characters.');
      return;
    }

    const base32Regex = /^[A-Z2-7]+$/;
    if (!base32Regex.test(cleanAddress)) {
      setError('Invalid characters detected in wallet address.');
      return;
    }

    setError('');
    onCheck(cleanAddress);
  };

  const handleTryDemo = () => {
    setError('');
    onCheck('demo');
  };

  const features = [
    { icon: Shield, label: 'Trust Score', description: 'AI-powered reputation analysis', color: 'from-purple-500 to-violet-600' },
    { icon: Activity, label: 'Live Analytics', description: 'Real-time transaction monitoring', color: 'from-cyan-500 to-blue-600' },
    { icon: Globe, label: 'On-Chain Intel', description: 'Deep blockchain intelligence', color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="relative">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 217, 255, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 10px #10B981' }} />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Reputation Protocol • Live
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative inline-block mb-6"
        >
          <div 
            className="absolute inset-0 rounded-2xl animate-pulse-glow"
            style={{
              background: 'radial-gradient(circle, rgba(0, 217, 255, 0.3) 0%, transparent 70%)',
              filter: 'blur(25px)',
              transform: 'scale(1.4)',
            }}
          />
          <div className="relative">
            <img 
              src={logoImage} 
              alt="Reputa Score" 
              className="w-32 h-32 object-contain animate-float"
              style={{ 
                filter: 'drop-shadow(0 0 20px rgba(0, 217, 255, 0.5)) drop-shadow(0 0 40px rgba(139, 92, 246, 0.3))',
              }}
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-4xl md:text-5xl font-black mb-3 tracking-tight uppercase"
          style={{ 
            color: 'rgba(255, 255, 255, 0.98)',
            letterSpacing: '-0.02em',
          }}
        >
          Scan Any Wallet
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-xl md:text-2xl font-semibold mb-5 animated-gradient-text"
        >
          Decode Wallet Behavior
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-base max-w-lg mx-auto mb-3"
          style={{ color: 'rgba(160, 164, 184, 0.85)' }}
        >
          Discover what your Pi Network wallet reveals about trust, consistency, and reputation.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex items-center justify-center gap-4 text-sm"
          style={{ color: 'rgba(120, 125, 150, 0.7)' }}
        >
          <span className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-[12px]">Advanced on-chain intelligence</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-[12px]">No private keys required</span>
          </span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="glass-card p-8 max-w-2xl mx-auto"
        style={{
          background: isFocused 
            ? 'linear-gradient(135deg, rgba(30, 33, 40, 0.8) 0%, rgba(37, 41, 50, 0.7) 100%)'
            : 'rgba(30, 33, 40, 0.6)',
          border: isFocused 
            ? '1px solid rgba(139, 92, 246, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isFocused 
            ? '0 20px 60px rgba(139, 92, 246, 0.2)'
            : '0 10px 40px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              className="block mb-3 text-sm font-bold uppercase tracking-wider"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Enter Wallet Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full futuristic-input pr-14 text-base font-mono uppercase"
                style={{ height: '60px' }}
              />
              <div 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg"
                style={{ background: 'rgba(139, 92, 246, 0.2)' }}
              >
                <Search className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm font-medium flex items-center gap-2"
                style={{ color: '#EF4444' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </motion.p>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              type="submit" 
              className="flex-1 futuristic-button flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-wider"
              style={{ height: '56px' }}
            >
              <Zap className="w-5 h-5" />
              Analyze Wallet
            </button>
            <button 
              type="button" 
              onClick={handleTryDemo}
              className="px-8 rounded-2xl font-bold uppercase tracking-wide text-sm transition-all"
              style={{
                height: '56px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              Try Demo
            </button>
          </div>
        </form>

        <div 
          className="mt-6 p-5 rounded-2xl flex gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1px solid rgba(0, 217, 255, 0.15)',
          }}
        >
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0, 217, 255, 0.15)' }}
          >
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: 'rgba(0, 217, 255, 0.9)' }}>Privacy First</p>
            <p className="text-sm" style={{ color: 'rgba(160, 164, 184, 0.8)' }}>
              This app only uses public blockchain data. We never ask for private keys or seed phrases.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="grid md:grid-cols-3 gap-5 mt-10 max-w-3xl mx-auto"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 + index * 0.1 }}
            className="kpi-card text-center group cursor-default py-6"
          >
            <div 
              className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 bg-gradient-to-br ${feature.color} transition-transform group-hover:scale-110`}
              style={{ boxShadow: '0 6px 24px rgba(139, 92, 246, 0.2)' }}
            >
              <feature.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-base mb-1.5" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              {feature.label}
            </h3>
            <p className="text-[13px]" style={{ color: 'rgba(160, 164, 184, 0.7)' }}>
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="text-center mt-12"
      >
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <Sparkles className="w-4 h-4 text-green-400" />
          <span className="text-[13px] font-medium" style={{ color: 'rgba(16, 185, 129, 0.9)' }}>
            Powered by Pi Network Blockchain
          </span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </motion.div>
    </div>
  );
}
