import type { WalletData, Transaction } from './types';

export async function fetchWalletData(walletAddress: string): Promise<WalletData> {
  try {
    // 1. جلب بيانات الحساب الأساسية
    const response = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}`);
    if (!response.ok) throw new Error('Account not found');
    const data = await response.json();

    const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
    const balanceValue = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

    // 2. جلب تاريخ أول عملية لتحديد عمر الحساب الحقيقي
    const txRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/transactions?limit=1&order=asc`);
    const txData = await txRes.json();
    const firstTxDate = txData._embedded.records[0] 
      ? new Date(txData._embedded.records[0].created_at) 
      : new Date();
    
    const accountAgeDays = Math.floor((new Date().getTime() - firstTxDate.getTime()) / (1000 * 3600 * 24));

    // 3. جلب آخر 10 عمليات دفع فعلية
    const paymentsRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/payments?limit=10&order=desc`);
    const paymentsData = await paymentsRes.json();
    const records = paymentsData._embedded.records;

    const realTransactions: Transaction[] = records.map((record: any) => ({
      id: record.id,
      timestamp: new Date(record.created_at),
      amount: parseFloat(record.amount),
      from: record.from,
      to: record.to,
      type: record.from === walletAddress ? 'external' : 'internal',
      memo: `Hash: ${record.transaction_hash.slice(0, 8)}`
    }));

    // --- بروتوكول حساب النقاط (Dynamic Score Calculation) ---
    // معادلة: الرصيد (350 نقطة) + النشاط (350 نقطة) + العمر (300 نقطة)
    const scoreFromBalance = Math.min((balanceValue / 500) * 350, 350); 
    const scoreFromActivity = Math.min((records.length / 10) * 350, 350);
    const scoreFromAge = Math.min((accountAgeDays / 365) * 300, 300);
    
    const finalScore = Math.max(100, Math.floor(scoreFromBalance + scoreFromActivity + scoreFromAge));

    return {
      address: walletAddress,
      username: await fetchUsername(walletAddress),
      balance: balanceValue,
      accountAge: accountAgeDays || 1,
      reputaScore: finalScore,
      createdAt: firstTxDate,
      transactions: realTransactions,
      // ✅ تصحيح: نستخدم عدد السجلات بدلاً من التسلسل التقني sequence
      totalTransactions: records.length 
    };

  } catch (error) {
    console.error("Testnet Fetch Error:", error);
    return fallbackData(walletAddress);
  }
}

export async function fetchUsername(walletAddress: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && (window as any).Pi) {
      const auth = await (window as any).Pi.authenticate(['username']);
      return auth.user.username;
    }
  } catch (e) { }
  return `User_${walletAddress.slice(0, 5)}`;
}

function fallbackData(address: string): WalletData {
  return {
    address,
    username: `Pioneer_${address.slice(0, 4)}`,
    balance: 0,
    accountAge: 1,
    reputaScore: 100,
    createdAt: new Date(),
    transactions: [],
    totalTransactions: 0
  };
}
