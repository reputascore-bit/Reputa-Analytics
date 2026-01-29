import React, { useState } from 'react';
import { Globe, TestTube, Play, ChevronDown, Check, AlertCircle, Zap } from 'lucide-react';
import { NetworkMode, MODE_IMPACTS } from '../protocol/types';
import { useLanguage } from '../hooks/useLanguage';

interface ModeIndicatorProps {
  currentMode: NetworkMode;
  connected: boolean;
  onModeChange: (mode: NetworkMode) => void;
  disabled?: boolean;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({
  currentMode,
  connected,
  onModeChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const modeImpact = MODE_IMPACTS[currentMode];
  
  const getModeIcon = (mode: NetworkMode) => {
    switch (mode) {
      case 'mainnet': return Globe;
      case 'testnet': return TestTube;
      case 'demo': return Play;
    }
  };
  
  const getImpactBadge = (mode: NetworkMode) => {
    const impact = MODE_IMPACTS[mode];
    switch (impact.reputationImpact) {
      case 'full':
        return (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
            <Zap className="w-3 h-3" />
            {isRTL ? 'تأثير كامل' : '100% Impact'}
          </span>
        );
      case 'partial':
        return (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' }}>
            <AlertCircle className="w-3 h-3" />
            {isRTL ? 'تأثير جزئي' : '25% Impact'}
          </span>
        );
      case 'none':
        return (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(107, 114, 128, 0.2)', color: '#9CA3AF' }}>
            {isRTL ? 'بدون تأثير' : 'No Impact'}
          </span>
        );
    }
  };

  const ModeIcon = getModeIcon(currentMode);
  
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: modeImpact.bgColor,
          border: `1px solid ${modeImpact.borderColor}`,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${modeImpact.color}20` }}
        >
          <ModeIcon className="w-5 h-5" style={{ color: modeImpact.color }} />
        </div>
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {isRTL ? modeImpact.labelAr : modeImpact.label}
            </span>
            {connected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {isRTL ? modeImpact.descriptionAr : modeImpact.description}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {getImpactBadge(currentMode)}
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(15, 17, 23, 0.98)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="p-3 border-b" style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                {isRTL ? 'اختر وضع التشغيل' : 'Select Network Mode'}
              </p>
            </div>
            
            {(['mainnet', 'testnet', 'demo'] as NetworkMode[]).map((mode) => {
              const impact = MODE_IMPACTS[mode];
              const Icon = getModeIcon(mode);
              const isSelected = mode === currentMode;
              const isDisabled = (mode === 'mainnet' || mode === 'testnet') && !connected;
              
              return (
                <button
                  key={mode}
                  onClick={() => {
                    if (!isDisabled) {
                      onModeChange(mode);
                      setIsOpen(false);
                    }
                  }}
                  disabled={isDisabled}
                  className="w-full flex items-center gap-3 p-4 transition-all duration-200"
                  style={{
                    background: isSelected ? impact.bgColor : 'transparent',
                    borderLeft: isSelected ? `3px solid ${impact.color}` : '3px solid transparent',
                    opacity: isDisabled ? 0.4 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${impact.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: impact.color }} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {isRTL ? impact.labelAr : impact.label}
                      </span>
                      {isDisabled && (
                        <span className="text-[9px] text-gray-500 uppercase">
                          {isRTL ? 'يتطلب تسجيل الدخول' : 'Login Required'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {isRTL ? impact.descriptionAr : impact.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getImpactBadge(mode)}
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </button>
              );
            })}
            
            <div className="p-3 border-t" style={{ 
              borderColor: 'rgba(139, 92, 246, 0.2)',
              background: 'rgba(139, 92, 246, 0.05)'
            }}>
              <p className="text-[10px] text-gray-400 text-center">
                {isRTL 
                  ? 'السمعة الحقيقية تعتمد على بيانات Mainnet. Testnet يضيف نقاط مكملة فقط.'
                  : 'Real reputation is based on Mainnet data. Testnet adds supplementary points only.'
                }
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const ModeStatusBadge: React.FC<{ mode: NetworkMode; compact?: boolean }> = ({ 
  mode, 
  compact = false 
}) => {
  const impact = MODE_IMPACTS[mode];
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const getModeIcon = (m: NetworkMode) => {
    switch (m) {
      case 'mainnet': return Globe;
      case 'testnet': return TestTube;
      case 'demo': return Play;
    }
  };
  
  const Icon = getModeIcon(mode);
  
  if (compact) {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-full"
        style={{ background: impact.bgColor, border: `1px solid ${impact.borderColor}` }}
      >
        <Icon className="w-3 h-3" style={{ color: impact.color }} />
        <span className="text-[10px] font-bold uppercase" style={{ color: impact.color }}>
          {impact.label}
        </span>
      </div>
    );
  }
  
  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ background: impact.bgColor, border: `1px solid ${impact.borderColor}` }}
    >
      <Icon className="w-4 h-4" style={{ color: impact.color }} />
      <div>
        <span className="text-xs font-bold" style={{ color: impact.color }}>
          {isRTL ? impact.labelAr : impact.label}
        </span>
        <p className="text-[9px] text-gray-400">
          {impact.impactPercentage}% {isRTL ? 'تأثير' : 'impact'}
        </p>
      </div>
    </div>
  );
};
