import React, { useState, useEffect, useMemo, Suspense } from 'react';  
import { useLanguage } from '../hooks/useLanguage';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { SideDrawer } from '../components/SideDrawer';
import { TopBar } from '../components/TopBar';
import { MainCard } from '../components/MainCard';
const TransactionTimeline = React.lazy(async () => ({ default: (await import('../components/charts/TransactionTimeline')).TransactionTimeline }));
const PointsBreakdown = React.lazy(async () => ({ default: (await import('../components/charts/PointsBreakdown')).PointsBreakdown }));
const RiskActivity = React.lazy(async () => ({ default: (await import('../components/charts/RiskActivity')).RiskActivity }));
const TokenPortfolio = React.lazy(async () => ({ default: (await import('../components/charts/TokenPortfolio')).TokenPortfolio }));
const ScoreBreakdownChart = React.lazy(async () => ({ default: (await import('../components/ScoreBreakdownChart')).ScoreBreakdownChart }));
const PiDexSection = React.lazy(async () => ({ default: (await import('../components/PiDexSection')).PiDexSection }));
const TrustGauge = React.lazy(async () => ({ default: (await import('../components/TrustGauge')).TrustGauge }));
const TransactionList = React.lazy(async () => ({ default: (await import('../components/TransactionList')).TransactionList }));
const AuditReport = React.lazy(async () => ({ default: (await import('../components/AuditReport')).AuditReport }));
const TopWalletsWidget = React.lazy(async () => ({ default: (await import('../components/widgets')).TopWalletsWidget }));
const NetworkInfoPage = React.lazy(async () => ({ default: (await import('./NetworkInfoPage')).NetworkInfoPage }));
const AtomicProtocolPage = React.lazy(async () => ({ default: (await import('./AtomicProtocolPage')).AtomicProtocolPage }));
const TopWalletsPage = React.lazy(async () => ({ default: (await import('./TopWalletsPage')).TopWalletsPage }));
const ReputationPage = React.lazy(async () => ({ default: (await import('./ReputationPage')).ReputationPage }));
const ProfilePage = React.lazy(async () => ({ default: (await import('./ProfilePage')).ProfilePage }));
const DailyCheckIn = React.lazy(async () => ({ default: (await import('../components/DailyCheckIn')).DailyCheckIn }));
const PointsExplainer = React.lazy(async () => ({ default: (await import('../components/PointsExplainer')).PointsExplainer }));
const ShareReputaCard = React.lazy(async () => ({ default: (await import('../components/ShareReputaCard')).ShareReputaCard }));
const MiningDaysWidget = React.lazy(async () => ({ default: (await import('../components/MiningDaysWidget')).MiningDaysWidget }));
const ProfileSection = React.lazy(async () => ({ default: (await import('../components/ProfileSection')).ProfileSection }));
import { 
  processTransactionTimeline, 
  processScoreBreakdown, 
  processRiskActivity, 
  processTokenPortfolio,
  generateMockChartData 
} from '../services/chartDataProcessor';
import { AppMode, ChartDataPoint, ChartReputationScore, TokenBalance, Language, WalletData, TrustLevel, AtomicTrustLevel, NetworkMode, MODE_IMPACTS } from '../protocol/types';
import { ModeIndicator, ModeStatusBadge } from '../components/ModeIndicator';
import { 
  calculateAtomicReputation, 
  generateDemoActivityData, 
  getLevelProgress,
  TRUST_LEVEL_COLORS,
  getBackendScoreCap,
  mapAtomicToTrustLevel
} from '../protocol/atomicScoring';
import { reputationService, UnifiedScoreData } from '../services/reputationService';
import { 
  ArrowLeft, Globe, User, Wallet, Shield, TrendingUp, 
  Activity, Clock, Zap, Sparkles, BarChart3, FileText,
  PieChart, LineChart, AlertTriangle, Coins, RefreshCw, Lock,
  Languages, ChevronDown, Calendar, CheckCircle, Award, Star,
  Settings, MessageSquare, HelpCircle, FileText as FileTextIcon, TestTube, AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';

interface UnifiedDashboardProps {
  walletData: WalletData;
  isProUser: boolean;
  onReset: () => void;
  onUpgradePrompt: () => void;
  username?: string;
}

type ActiveSection = 'overview' | 'analytics' | 'transactions' | 'audit' | 'portfolio' | 'wallet' | 'network' | 'profile' | 'settings' | 'feedback' | 'help';
type NetworkSubPage = null | 'network-info' | 'top-wallets' | 'reputation';

export function UnifiedDashboard({ 
  walletData,
  isProUser,
  onReset,
  onUpgradePrompt,
  username
}: UnifiedDashboardProps) {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<AppMode>(() => {
    const savedMode = localStorage.getItem('reputaNetworkMode');
    if (savedMode === 'mainnet' || savedMode === 'testnet') {
      return { mode: savedMode as NetworkMode, connected: true };
    }
    return { mode: 'testnet', connected: true };
  });
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [unifiedScoreData, setUnifiedScoreData] = useState<UnifiedScoreData | null>(null);
  const [userPoints, setUserPoints] = useState({
    total: walletData.reputaScore || 0,
    checkIn: 0,
    transactions: 0,
    activity: 0,
    streak: 0,
  });
  
  useEffect(() => {
    async function loadUnifiedScore() {
      const isDemo = mode.mode === 'demo' || !username || username === 'Guest_Explorer';
      const uid = isDemo ? 'demo' : (localStorage.getItem('piUserId') || `user_${Date.now()}`);
      
      if (isDemo) {
        reputationService.setDemoMode(true);
      }

      const cached = reputationService.getCachedUnifiedScore(uid);
      if (cached) {
        setUnifiedScoreData(cached);
        setUserPoints({
          total: cached.totalScore,
          checkIn: cached.dailyCheckInPoints || 0,
          transactions: 0,
          activity: cached.blockchainScore || 0,
          streak: cached.streak || 0,
        });
      }

      await reputationService.loadUserReputation(uid);
      const unified = reputationService.getUnifiedScore();
      setUnifiedScoreData(unified);
      setUserPoints({
        total: unified.totalScore,
        checkIn: unified.dailyCheckInPoints || 0,
        transactions: 0,
        activity: unified.blockchainScore || 0,
        streak: unified.streak || 0,
      });
    }
    loadUnifiedScore();
  }, [mode.mode, username]);

  const handlePointsEarned = async () => {
    const unified = reputationService.getUnifiedScore();
    setUnifiedScoreData(unified);
    setUserPoints({
      total: unified.totalScore,
      checkIn: unified.dailyCheckInPoints || 0,
      transactions: 0,
      activity: unified.blockchainScore || 0,
      streak: unified.streak || 0,
    });
  };

  const [timelineData, setTimelineData] = useState<{ internal: ChartDataPoint[]; external: ChartDataPoint[] }>({ internal: [], external: [] });
  const [breakdownData, setBreakdownData] = useState<ChartDataPoint[]>([]);
  const [riskData, setRiskData] = useState<ChartDataPoint[]>([]);
  const [portfolioData, setPortfolioData] = useState<ChartDataPoint[]>([]);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);

  useEffect(() => {
    const { transactions, score: mockScore, tokens: mockTokens } = generateMockChartData();
    const mapPeriodToTimeline = (p: '7d' | '30d' | '90d' | 'all') => {
      switch (p) {
        case '7d': return 'day';
        case '30d': return 'week';
        case '90d': return 'month';
        case 'all': default: return 'month';
      }
    };

    setTimelineData(processTransactionTimeline(transactions, mapPeriodToTimeline(period)));
    setBreakdownData(processScoreBreakdown(mockScore));
    setRiskData(processRiskActivity(transactions, mockScore));
    setPortfolioData(processTokenPortfolio(mockTokens));
    setTokens(mockTokens);
  }, [period]);

  const atomicResult = useMemo(() => {
    if (unifiedScoreData) {
      const demoData = generateDemoActivityData();
      demoData.accountAgeDays = walletData.accountAge || 180;
      demoData.internalTxCount = walletData.transactions?.length || 25;
      demoData.dailyCheckins = unifiedScoreData.totalCheckInDays;
      demoData.adBonuses = Math.floor((unifiedScoreData.dailyCheckInPoints || 0) / 5);
      const result = calculateAtomicReputation(demoData);
      result.interaction.dailyCheckins = unifiedScoreData.totalCheckInDays;
      result.interaction.totalPoints = unifiedScoreData.totalScore;
      result.adjustedScore = unifiedScoreData.totalScore;
      result.rawScore = (unifiedScoreData.blockchainScore || 0) + (unifiedScoreData.dailyCheckInPoints || 0);
      return result;
    }
    const demoData = generateDemoActivityData();
    demoData.accountAgeDays = walletData.accountAge || 180;
    demoData.internalTxCount = walletData.transactions?.length || 25;
    return calculateAtomicReputation(demoData);
  }, [walletData.accountAge, walletData.transactions?.length, unifiedScoreData]);

  const modeAdjustedScore = useMemo(() => {
    const baseScore = atomicResult.adjustedScore;
    const impact = MODE_IMPACTS[mode.mode];
    return Math.round(baseScore * (impact.impactPercentage / 100));
  }, [atomicResult.adjustedScore, mode.mode]);

  const levelProgress = useMemo(() => {
    return getLevelProgress(modeAdjustedScore);
  }, [modeAdjustedScore]);

  const handleModeChange = (newMode: NetworkMode) => {
    if (newMode === 'demo') {
      setMode({ mode: 'demo', connected: false });
      localStorage.setItem('reputaNetworkMode', 'demo');
    } else {
      setMode({ 
        mode: newMode, 
        connected: true,
        walletAddress: walletData.address
      });
      localStorage.setItem('reputaNetworkMode', newMode);
    }
  };

  const handleModeToggle = () => {
    const modes: NetworkMode[] = ['testnet', 'mainnet', 'demo'];
    const currentIndex = modes.indexOf(mode.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    handleModeChange(modes[nextIndex]);
  };

  const handleSidebarNavigation = (itemId: string) => {
    const sectionMap: Record<string, ActiveSection> = {
      'dashboard': 'overview',
      'analytics': 'analytics',
      'transactions': 'transactions',
      'audit': 'audit',
      'portfolio': 'portfolio',
      'wallet': 'wallet',
      'network': 'network',
      'profile': 'profile',
      'settings': 'settings',
      'feedback': 'feedback',
      'help': 'help',
    };
    setActiveSection(sectionMap[itemId] || 'overview');
  };

  const gaugeLevel = mapAtomicToTrustLevel(levelProgress.currentLevel);

  const sectionButtons: { id: ActiveSection; icon: React.ElementType; label: string }[] = [
    { id: 'overview', icon: BarChart3, label: t('sidebar.dashboard') },
    { id: 'analytics', icon: LineChart, label: t('sidebar.analytics') },
    { id: 'transactions', icon: Activity, label: t('sidebar.transactions') },
    { id: 'audit', icon: FileText, label: t('sidebar.audit') },
    { id: 'portfolio', icon: PieChart, label: t('sidebar.portfolio') },
    { id: 'wallet', icon: Wallet, label: t('sidebar.wallet') },
    { id: 'network', icon: Globe, label: 'Network' },
  ];

  return (
    <div className="flex h-screen bg-[#0A0B0F] text-white overflow-hidden relative">
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      
      {/* Sidebar - desktop */}
      <div className="hidden lg:block h-full">
        <DashboardSidebar 
          mode={mode} 
          onModeToggle={handleModeToggle} 
          activeItem={activeSection === 'overview' ? 'dashboard' : activeSection}
          onItemClick={handleSidebarNavigation}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <TopBar 
          onMenuClick={() => setIsSideDrawerOpen(true)} 
          balance={walletData?.balance}
          username={username}
        />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ModeStatusBadge mode={mode.mode} compact />
            
            {!isProUser && (
              <Button 
                onClick={onUpgradePrompt} 
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold text-[10px] sm:text-xs uppercase px-2 sm:px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Pro</span>
              </Button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg transition-all active:scale-95 hover:bg-white/5 touch-target"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>

        {/* Main Profile Card - Always visible at top */}
        <div className="mb-5">
          <MainCard
            username={username || 'Pioneer'}
            walletAddress={walletData.address}
            balance={walletData.balance}
            reputaScore={mode.mode === 'demo' ? 0 : levelProgress.displayScore}
            level={levelProgress.levelIndex + 1}
            trustLevel={levelProgress.currentLevel}
            progressPercent={Math.round(levelProgress.progressInLevel)}
            pointsToNext={levelProgress.pointsToNextLevel}
            maxPoints={getBackendScoreCap()}
            isVip={isProUser}
            onShare={() => setShowShareCard(true)}
          />
        </div>

        {/* Section Navigation - Hidden on mobile (using bottom nav) */}
        <div className="hidden sm:flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {sectionButtons.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all whitespace-nowrap ${
                activeSection === section.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <section.icon className={`w-3.5 h-3.5 ${activeSection === section.id ? 'text-purple-400' : ''}`} />
              {section.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Trust Gauge */}
            <TrustGauge 
              score={levelProgress.displayScore} 
              trustLevel={gaugeLevel}
              consistencyScore={walletData.consistencyScore ?? 85}
              networkTrust={walletData.networkTrust ?? 90}
            />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-4 hover:border-purple-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }} onClick={() => setActiveSection('transactions')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Total Tx</p>
                    <p className="font-bold text-white">{walletData?.totalTransactions || 0}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 hover:border-cyan-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }} onClick={() => setActiveSection('analytics')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                    <div onClick={(e) => e.stopPropagation()}>
                      <PointsExplainer
                        currentPoints={userPoints.total}
                        checkInPoints={userPoints.checkIn}
                        transactionPoints={userPoints.transactions}
                        activityPoints={userPoints.activity}
                        streakBonus={userPoints.streak}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Analytics</p>
                    <p className="font-bold text-white">View Charts</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 hover:border-emerald-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }} onClick={() => setActiveSection('portfolio')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Portfolio</p>
                    <p className="font-bold text-white">{tokens.length} Tokens</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 hover:border-amber-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(245, 158, 11, 0.2)' }} onClick={() => setActiveSection('audit')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Audit</p>
                    <p className="font-bold text-white">Full Report</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Check-in & Points Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DailyCheckIn 
                onPointsEarned={handlePointsEarned}
                isDemo={mode.mode === 'demo'}
              />
              
              <div className="glass-card p-5" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 217, 255, 0.15) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                      }}
                    >
                      <Award className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Total Points</p>
                      <p className="text-2xl font-black text-white">{userPoints.total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                    <p className="text-[9px] font-bold uppercase text-cyan-400">Check-in</p>
                    <p className="text-sm font-black text-cyan-400">{userPoints.checkIn}</p>
                  </div>
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <p className="text-[9px] font-bold uppercase text-purple-400">Activity</p>
                    <p className="text-sm font-black text-purple-400">{userPoints.activity}</p>
                  </div>
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <p className="text-[9px] font-bold uppercase text-amber-400">Streak</p>
                    <p className="text-sm font-black text-amber-400">{userPoints.streak}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Preview */}
            <div className="glass-card p-5" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Recent Transactions
                </h3>
                <button 
                  onClick={onReset}
                  className="p-2 rounded-lg transition-all active:scale-95 hover:bg-white/5 touch-target"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </button>
                <h1 className="text-sm sm:text-lg font-bold uppercase tracking-wider text-white/90">
                  {activeSection === 'overview' ? 'Reputa Score' : activeSection}
                </h1>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <ModeStatusBadge mode={mode.mode} compact />
                {!isProUser && (
                  <Button onClick={onUpgradePrompt} className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold text-[10px] sm:text-xs uppercase px-2 sm:px-3 py-1.5 hover:opacity-90 transition-opacity">
                    <Sparkles className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Pro</span>
                  </Button>
                )}
                <button onClick={() => window.location.reload()} className="p-2 rounded-lg transition-all active:scale-95 hover:bg-white/5 touch-target" title="Refresh">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            </div>

            {/* Main Profile Card - Always visible at top */}
            <div className="mb-5">
              <MainCard
                username={username || 'Pioneer'}
                walletAddress={walletData.address}
                balance={walletData.balance}
                reputaScore={mode.mode === 'demo' ? 0 : levelProgress.displayScore}
                level={levelProgress.levelIndex + 1}
                trustLevel={levelProgress.currentLevel}
                progressPercent={Math.round(levelProgress.progressInLevel)}
                pointsToNext={levelProgress.pointsToNextLevel}
                maxPoints={getBackendScoreCap()}
                isVip={isProUser}
                onShare={() => setShowShareCard(true)}
              />
            </div>

            {/* Section Navigation - Hidden on mobile (using bottom nav) */}
            <div className="hidden sm:flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              {sectionButtons.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all whitespace-nowrap ${
                    activeSection === section.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <section.icon className={`w-3.5 h-3.5 ${activeSection === section.id ? 'text-purple-400' : ''}`} />
                  {section.label}
                </button>
              ))}
            </div>

            {/* Content Sections */}
            {activeSection === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <TrustGauge score={levelProgress.displayScore} trustLevel={gaugeLevel} consistencyScore={walletData.consistencyScore ?? 85} networkTrust={walletData.networkTrust ?? 90} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-4 hover:border-purple-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }} onClick={() => setActiveSection('transactions')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center"><Activity className="w-5 h-5 text-white" /></div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Total Tx</p>
                        <p className="font-bold text-white">{walletData?.totalTransactions || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-4 hover:border-cyan-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }} onClick={() => setActiveSection('analytics')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center"><LineChart className="w-5 h-5 text-white" /></div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Analytics</p>
                        <p className="font-bold text-white">View Charts</p>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-4 hover:border-emerald-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }} onClick={() => setActiveSection('portfolio')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center"><PieChart className="w-5 h-5 text-white" /></div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Portfolio</p>
                        <p className="font-bold text-white">{tokens.length} Tokens</p>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-4 hover:border-amber-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(245, 158, 11, 0.2)' }} onClick={() => setActiveSection('audit')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center"><FileText className="w-5 h-5 text-white" /></div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Audit</p>
                        <p className="font-bold text-white">Full Report</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DailyCheckIn onPointsEarned={handlePointsEarned} isDemo={mode.mode === 'demo'} />
                  <div className="glass-card p-5" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 217, 255, 0.15) 100%)', border: '1px solid rgba(139, 92, 246, 0.4)' }}><Award className="w-5 h-5 text-purple-400" /></div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Total Points</p>
                          <p className="text-2xl font-black text-white">{userPoints.total.toLocaleString()}</p>
                        </div>
                      </div>
                      <PointsExplainer currentPoints={userPoints.total} checkInPoints={userPoints.checkIn} transactionPoints={userPoints.transactions} activityPoints={userPoints.activity} streakBonus={userPoints.streak} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'analytics' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass-card p-6" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center"><LineChart className="w-5 h-5 text-purple-400" /></div>
                        <h2 className="text-lg font-black uppercase tracking-wide">Volume Timeline</h2>
                      </div>
                    </div>
                    <div className="h-[300px] w-full"><Suspense fallback={<div>Loading chart...</div>}><TransactionTimeline data={timelineData} period={period} onPeriodChange={handlePeriodChange} /></Suspense></div>
                  </div>
                  <div className="glass-card p-6" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center"><PieChart className="w-5 h-5 text-cyan-400" /></div>
                      <h2 className="text-lg font-black uppercase tracking-wide">Score Breakdown</h2>
                    </div>
                    <div className="h-[300px] w-full"><Suspense fallback={<div>Loading chart...</div>}><ScoreBreakdownChart data={breakdownData} /></Suspense></div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'transactions' && (
              <div className="animate-in fade-in duration-300">
                <Suspense fallback={<div>Loading activity...</div>}><TransactionList transactions={walletData.transactions || []} address={walletData.address} /></Suspense>
              </div>
            )}

            {activeSection === 'audit' && (
              <div className="animate-in fade-in duration-300">
                <Suspense fallback={<div>Loading audit...</div>}><AuditReport walletData={walletData} isPro={isProUser} /></Suspense>
              </div>
            )}

            {activeSection === 'portfolio' && (
              <div className="animate-in fade-in duration-300">
                <Suspense fallback={<div>Loading portfolio...</div>}><TokenPortfolio data={portfolioData} tokens={tokens} /></Suspense>
              </div>
            )}

            {activeSection === 'wallet' && (
              <div className="animate-in fade-in duration-300">
                <MiningDaysWidget walletData={walletData} />
              </div>
            )}

            {activeSection === 'network' && (
              <div className="animate-in fade-in duration-300">
                <NetworkInfoPage onBack={() => setActiveSection('overview')} />
              </div>
            )}

            {activeSection === 'profile' && (
              <div className="animate-in fade-in duration-300">
                <ProfilePage {...profilePageData} />
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="glass-card p-6" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <Settings className="w-6 h-6 text-purple-400" />
                    <h2 className="text-lg font-black uppercase tracking-wide text-white">Settings</h2>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeItem={activeSection === 'overview' ? 'dashboard' : activeSection}
        onItemClick={handleSidebarNavigation}
        onMenuClick={() => setIsSideDrawerOpen(true)}
      />

      {/* Side Drawer for mobile */}
      <SideDrawer
        isOpen={isSideDrawerOpen}
        onClose={() => setIsSideDrawerOpen(false)}
        activeItem={activeSection === 'overview' ? 'dashboard' : activeSection}
        onItemClick={(item) => {
          handleSidebarNavigation(item);
          setIsSideDrawerOpen(false);
        }}
        username={username}
        walletAddress={walletData.address}
        balance={walletData.balance}
        onLogout={onReset}
      />

      {/* Share Card Modal */}
      {showShareCard && (
        <Suspense fallback={null}>
          <ShareReputaCard
            isOpen={showShareCard}
            onClose={() => setShowShareCard(false)}
            username={username || 'Pioneer'}
            reputaScore={levelProgress.displayScore}
            trustLevel={levelProgress.currentLevel}
          />
        </Suspense>
      )}
    </div>
  );
}
