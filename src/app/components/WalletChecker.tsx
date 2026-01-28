import { useState } from 'react';
import { Search, Shield, Zap, Activity, Globe, Cpu, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import logoImage from '../../assets/logo.png';

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
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 217, 255, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 10px #10B981' }} />
          <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Reputation Protocol • Live
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative inline-block mb-8"
        >
          <div 
            className="absolute inset-0 rounded-3xl animate-pulse-glow"
            style={{
              background: 'radial-gradient(circle, rgba(0, 217, 255, 0.3) 0%, transparent 70%)',
              filter: 'blur(30px)',
              transform: 'scale(1.5)',
            }}
          />
          <div 
            className="relative p-6 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 17, 23, 0.9) 0%, rgba(30, 33, 40, 0.8) 100%)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              boxShadow: '0 0 60px rgba(0, 217, 255, 0.2), inset 0 0 30px rgba(0, 217, 255, 0.05)',
            }}
          >
            <img 
              src={logoImage} 
              alt="Reputa Score" 
              className="w-28 h-28 object-contain animate-float"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0, 217, 255, 0.5))' }}
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-5xl md:text-6xl font-black mb-4 tracking-tight"
          style={{ color: 'rgba(255, 255, 255, 0.95)' }}
        >
          SCAN ANY WALLET
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-2xl md:text-3xl font-bold mb-6 animated-gradient-text"
        >
          Decode Wallet Behavior
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg max-w-xl mx-auto mb-2"
          style={{ color: 'rgba(160, 164, 184, 0.9)' }}
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
            Advanced on-chain intelligence
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            No private keys required
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
        className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 + index * 0.1 }}
            className="kpi-card text-center group cursor-default"
          >
            <div 
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${feature.color} transition-transform group-hover:scale-110`}
              style={{ boxShadow: '0 8px 32px rgba(139, 92, 246, 0.25)' }}
            >
              <feature.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              {feature.label}
            </h3>
            <p className="text-sm" style={{ color: 'rgba(160, 164, 184, 0.7)' }}>
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="text-center mt-16"
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <Sparkles className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium" style={{ color: 'rgba(16, 185, 129, 0.9)' }}>
            Powered by Pi Network Blockchain
          </span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </motion.div>
    </div>
  );
}
