import type { VercelRequest, VercelResponse } from '@vercel/node';

interface WalletRequest {
  userId?: string;
  walletAddress?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. إعدادات CORS (ضرورية لعمل الـ API مع تطبيقات React/Vite)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // معالجة طلبات التمهيد (Preflight requests)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, walletAddress } = (req.method === 'GET' ? req.query : req.body) as WalletRequest;

    if (!userId && !walletAddress) {
      return res.status(400).json({ 
        error: 'userId or walletAddress is required' 
      });
    }

    // 2. الحفاظ على الهيكل الأصلي للمحاكاة (Mock Data)
    const mockWalletData = {
      walletAddress: walletAddress || `G${Math.random().toString(36).substring(2, 56).toUpperCase()}`,
      balance: parseFloat((Math.random() * 1000).toFixed(2)),
      network: (process.env.PI_NETWORK as string) || 'testnet', // تأكيد النوع لـ TypeScript
      userId: userId || 'mock_user',
      lastUpdated: new Date().toISOString(),
      transactions: {
        total: Math.floor(Math.random() * 100) + 10,
        sent: Math.floor(Math.random() * 50),
        received: Math.floor(Math.random() * 50)
      }
    };

    console.log('[GET-WALLET]', mockWalletData);

    return res.status(200).json({
      success: true,
      wallet: mockWalletData
    });

  } catch (error) {
    console.error('[GET-WALLET ERROR]', error);
    return res.status(500).json({ 
      error: 'Failed to fetch wallet data' 
    });
  }
}
