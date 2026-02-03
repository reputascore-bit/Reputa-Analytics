/**
 * Reputa Protocol Configuration
 * Complete setup and initialization configuration
 */

export const REPUTA_CONFIG = {
  // ==================== DATABASE ====================
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'reputa-analytics',
    collections: {
      users: 'Users',
      wallets: 'Wallets',
      pointsLog: 'Points_Log',
      dailyCheckin: 'Daily_Checkin',
      referrals: 'Referrals',
      transactions: 'Transactions',
      blockchainSync: 'Blockchain_Sync',
      demoMode: 'Demo_Mode',
      adminLogs: 'Admin_Logs',
    },
  },

  // ==================== PI NETWORK ====================
  piNetwork: {
    sdkVersion: '2.0',
    mainnetApiUrl: process.env.PI_MAINNET_API || 'https://api.mainnet.pi',
    testnetApiUrl: process.env.PI_TESTNET_API || 'https://api.testnet.pi',
    apiKey: process.env.PI_API_KEY || '',
    scopes: ['username', 'payments', 'wallet'],
  },

  // ==================== SCORING SYSTEM ====================
  scoring: {
    // Max points per component
    maxScores: {
      walletAge: 200,
      transactionQuality: 400,
      staking: 300,
      tokenHolding: 100,
      activity3Months: 100,
      dexActivity: 100,
      mainnetReputation: 800, // 60% of 1000 + 20% (testnet weight)
      testnetReputation: 200, // 20% of 1000
      appPoints: 200, // 20% of 1000
      totalReputationScore: 1000,
    },

    // Weights in final score
    weights: {
      mainnet: 0.6, // 60%
      testnet: 0.2, // 20%
      app: 0.2, // 20%
    },

    // Penalties
    penalties: {
      offChainTransferPerUnit: 50,
    },

    // App point calculations
    appPoints: {
      dailyLoginBase: 3,
      dailyLoginWithAds: 5,
      referralConfirmed: 10,
      taskCompleted: 5, // Base, can vary
    },
  },

  // ==================== SYNC SETTINGS ====================
  sync: {
    // Auto-sync interval (milliseconds)
    userSyncInterval: 5 * 60 * 1000, // 5 minutes
    weeklyUpdateTime: '00:00', // UTC
    blockchainSyncTimeout: 10000, // 10 seconds
    maxRetries: 3,
    retryDelayMs: 1000,
  },

  // ==================== DEMO MODE ====================
  demoMode: {
    enabled: true,
    autoInitialize: false, // Don't auto-activate demo for new users
    demoPointsRange: {
      mainnetMin: 300,
      mainnetMax: 600,
      testnetMin: 100,
      testnetMax: 250,
      appMin: 80,
      appMax: 180,
    },
    demoWalletBalance: {
      mainnetMin: 150,
      mainnetMax: 500,
      testnetMin: 50,
      testnetMax: 200,
    },
    demoTransactionCount: {
      min: 20,
      max: 100,
    },
  },

  // ==================== REPUTATION LEVELS ====================
  levels: [
    { name: 'Bronze', minScore: 0, maxScore: 300, badge: '🥉' },
    { name: 'Silver', minScore: 300, maxScore: 500, badge: '🥈' },
    { name: 'Gold', minScore: 500, maxScore: 700, badge: '🥇' },
    { name: 'Platinum', minScore: 700, maxScore: 900, badge: '💎' },
    { name: 'Diamond', minScore: 900, maxScore: 1000, badge: '👑' },
  ],

  // ==================== LEADERBOARD ====================
  leaderboard: {
    topCount: 100,
    updateFrequency: 'hourly',
  },

  // ==================== API ====================
  api: {
    prefix: '/api',
    adminPrefix: '/api/admin',
    demoPrefix: '/api/demo',
    port: process.env.PORT || 3000,
    corsOrigin: process.env.CORS_ORIGIN || '*',
    requestTimeout: 30000, // 30 seconds
  },

  // ==================== LOGGING ====================
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    includeTimestamp: true,
  },

  // ==================== SECURITY ====================
  security: {
    enableAdminAuth: process.env.ENABLE_ADMIN_AUTH === 'true',
    adminTokenHeader: 'X-Admin-Token',
    rateLimitEnabled: true,
    rateLimitPerMinute: 100,
    corsEnabled: true,
  },
};

// ==================== ENVIRONMENT VALIDATION ====================

export function validateConfig(): boolean {
  const required = [
    'MONGODB_URI',
    'MONGODB_DB_NAME',
  ];

  const optional = [
    'PI_API_KEY',
    'PI_MAINNET_API',
    'PI_TESTNET_API',
    'PORT',
    'LOG_LEVEL',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      console.warn(`⚠️  Missing required environment variable: ${key}`);
      // In production, you might want to throw an error here
    }
  }

  console.log('✅ Configuration validated');
  return true;
}

// ==================== ENVIRONMENT SETUP GUIDE ====================

export const ENV_SETUP_GUIDE = `
╔════════════════════════════════════════════════════════════════════════════╗
║                   Reputa Protocol - Environment Setup                      ║
╚════════════════════════════════════════════════════════════════════════════╝

REQUIRED ENVIRONMENT VARIABLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MongoDB Configuration:
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   MONGODB_DB_NAME=reputa-analytics

2. Pi Network SDK:
   PI_API_KEY=your_pi_api_key
   PI_MAINNET_API=https://api.mainnet.pi
   PI_TESTNET_API=https://api.testnet.pi

OPTIONAL ENVIRONMENT VARIABLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. Application Settings:
   PORT=3000
   LOG_LEVEL=info
   CORS_ORIGIN=*
   ENABLE_ADMIN_AUTH=false (set to true for production)

EXAMPLE .env FILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DB_NAME=reputa-analytics

# Pi Network
PI_API_KEY=your_key_here
PI_MAINNET_API=https://api.mainnet.pi
PI_TESTNET_API=https://api.testnet.pi

# Application
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
ENABLE_ADMIN_AUTH=true

ON VERCEL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all required variables
3. Redeploy the project for changes to take effect

ON REPLIT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Create .env file in root directory
2. Add environment variables
3. Click "Run" - Replit will load .env automatically

╚════════════════════════════════════════════════════════════════════════════╝
`;

export default REPUTA_CONFIG;
