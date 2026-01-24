import React from 'react';
import { Sparkles, Crown, Check, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { createVIPPayment } from '../services/piPayments';

interface AccessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUser?: any; 
}

const ELITE_FEATURES = [
  { icon: <BarChart3 className="w-4 h-4 text-yellow-400" />, title: "Full Audit Access", desc: "View all hidden transaction details & risks" },
  { icon: <Zap className="w-4 h-4 text-yellow-400" />, title: "Priority Analysis", desc: "Real-time blockchain sync & faster results" },
  { icon: <ShieldCheck className="w-4 h-4 text-yellow-400" />, title: "Elite Badge", desc: "Permanent ⭐ VIP status on your profile" },
];

export function AccessUpgradeModal({ isOpen, onClose, onUpgrade, currentUser }: AccessUpgradeModalProps) {
  
  const handlePayment = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) return;

    if (currentUser.uid === "demo") {
      onUpgrade();
      onClose();
      alert("✅ VIP Unlocked (Demo Mode)!");
      return;
    }

    try {
      await createVIPPayment(currentUser.uid, () => {
        onUpgrade();
        onClose();
        alert("✅ VIP Access Granted Successfully!");
      });
    } catch (err: any) {
      console.error("Modal Payment Error:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-[#0f172a] border-none shadow-2xl rounded-[32px]">
        {/* الجزء العلوي: أيقونة التاج والتدرج الذهبي */}
        <div className="relative p-8 text-center bg-gradient-to-b from-purple-900/20 to-transparent">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-tr from-yellow-300 via-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 border border-yellow-200/50">
               <Crown className="w-10 h-10 text-purple-950 shadow-sm" />
            </div>
          </div>

          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter text-center">
              Reputa <span className="text-yellow-400">Elite</span>
            </DialogTitle>
            <DialogDescription className="text-purple-200/60 text-[10px] font-bold uppercase tracking-[0.2em] text-center mt-1">
              Unlock Premium Blockchain Intelligence
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* قائمة المزايا الاحترافية */}
        <div className="px-6 space-y-3 mb-8">
          {ELITE_FEATURES.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
              <div className="mt-0.5 p-2 rounded-xl bg-yellow-400/10 group-hover:bg-yellow-400/20 transition-colors">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-white text-xs font-black uppercase tracking-wide">{feature.title}</h4>
                <p className="text-purple-200/50 text-[10px] font-medium leading-tight mt-0.5">{feature.desc}</p>
              </div>
              <Check className="w-4 h-4 text-yellow-500/40" />
            </div>
          ))}
        </div>

        {/* زر الترقية النهائي */}
        <div className="p-6 bg-white/5 border-t border-white/5">
          <button 
            onClick={handlePayment}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-purple-950 text-[11px] font-black uppercase rounded-2xl shadow-xl shadow-yellow-900/20 active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-purple-950/20" />
            Activate Elite Access (1 Test-Pi)
          </button>
          
          <p className="text-[8px] text-center text-purple-200/30 uppercase font-bold mt-4 tracking-widest">
            One-time payment • Lifetime VIP Access
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
