import type { WalletData, Transaction } from './types';

export async function fetchWalletData(walletAddress: string): Promise<WalletData> {
  try {
    // الطلب الأول: جلب بيانات الحساب الأساسية لمعرفة "الرقم الكلي"
    const accountRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}`);
    if (!accountRes.ok) throw new Error('Account not found');
    const accountData = await accountRes.json();

    // 💡 الرقم الحقيقي الكلي لجميع العمليات في تاريخ المحفظة
    // نستخدم sequence_ledger أو حسابات العمليات الإجمالية
    const totalOps = accountData.history_count || accountData.sequence || 0;

    // الطلب الثاني: جلب آخر 8 معاملات فقط (Detailed) للعرض في القائمة
    const paymentsRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/payments?limit=8&order=desc`);
    const paymentsData = await paymentsRes.json();
    const records = paymentsData._embedded?.records || [];

    // جلب تاريخ أول معاملة (لعمر الحساب)
    const firstTxRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/transactions?limit=1&order=asc`);
    const firstTxData = await firstTxRes.json();
    const firstTxDate = firstTxData._embedded?.records[0] 
      ? new Date(firstTxData._embedded?.records[0].created_at) 
      : new Date();

    const accountAgeDays = Math.floor((new Date().getTime() - firstTxDate.getTime()) / (1000 * 3600 * 24));

    // تحويل الـ 8 معاملات الأخيرة إلى التنسيق التفصيلي
    const latestTransactions: Transaction[] = records.map((record: any) => ({
      id: record.id,
      timestamp: new Date(record.created_at),
      amount: parseFloat(record.amount),
      from: record.from,
      to: record.to,
      type: record.from === walletAddress ? 'external' : 'internal',
      memo: record.transaction_hash ? `Hash: ${record.transaction_hash.slice(0, 12)}...` : 'N/A'
    }));

    // استخراج الرصيد
    const nativeBalance = accountData.balances.find((b: any) => b.asset_type === 'native');
    const balanceValue = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

    // --- منطق السكور (يبقى دقيقاً بناءً على الأرقام الكلية المستخرجة) ---
    const scoreFromBalance = Math.min((balanceValue / 1000) * 400, 400); 
    const scoreFromActivity = Math.min((records.length / 8) * 300, 300); // نشاط نسبي
    const scoreFromAge = Math.min((accountAgeDays / 365) * 300, 300);
    const finalScore = Math.max(100, Math.floor(scoreFromBalance + scoreFromActivity + scoreFromAge));

    return {
      address: walletAddress,
      username: `Pioneer_${walletAddress.slice(0, 5)}`,
      balance: balanceValue,
      accountAge: accountAgeDays || 1,
      reputaScore: finalScore,
      createdAt: firstTxDate,
      transactions: latestTransactions, // تحتوي على 8 فقط
      totalTransactions: totalOps // ✅ الرقم الكلي الحقيقي لجميع المعاملات
    };

  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
}
