import { Menu, Wallet, Bell } from 'lucide-react'; 
import { loginWithPiAndLoadReputation } from '../services/piSdk';
import { useState } from 'react';

interface TopBarProps {
  onMenuClick: () => void;
  balance?: number;
  username?: string;
}

export function TopBar({ onMenuClick, balance, username }: TopBarProps) {
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = async () => {
    const newCount = clickCount + 1;
    if (newCount >= 5) {
      setClickCount(0);
      const userId = localStorage.getItem('piUserId');
      if (!userId) {
        alert("Please login first");
        return;
      }
      
      const amount = prompt("Enter amount to send to user (Pi):", "0.1");
      if (!amount || isNaN(parseFloat(amount))) return;

      try {
        const response = await fetch('/api/payments/app-to-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: userId, amount: parseFloat(amount) })
        });
        const data = await response.json();
        if (data.success) {
          alert(`Success! TxID: ${data.txid}`);
        } else {
          alert(`Failed: ${data.error}`);
        }
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    } else {
      setClickCount(newCount);
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 lg:hidden safe-area-top"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 11, 15, 0.98) 0%, rgba(15, 17, 23, 0.95) 100%)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 217, 255, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
          }}
        >
          <Menu className="w-5 h-5 text-purple-400" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
          <div 
            className="h-8 px-3 rounded-full flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
              border: '1px solid rgba(0, 217, 255, 0.25)',
            }}
          >
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400">
              {balance !== undefined ? `${balance.toFixed(2)} π` : '-- π'}
            </span>
          </div>
        </div>

        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Bell className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
