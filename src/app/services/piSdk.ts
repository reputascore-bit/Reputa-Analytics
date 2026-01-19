/** * Pi SDK Service - Unified wrapper for Pi Network SDK
 */

import type { PiUser } from '../protocol/types';

export function isPiBrowser(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

function getPiSDK() {
  return (window as any).Pi;
}

/**
 * ✅ التعديل الحاسم: محاولة التهيئة في كل مرة يتم استدعاء المصادقة لضمان عدم التجمد
 */
export async function initializePiSDK(): Promise<void> {
  if (!isPiBrowser()) return;

  try {
    const Pi = getPiSDK();
    // نستخدم await هنا لضمان اكتمال التهيئة قبل أي خطوة أخرى
    await Pi.init({ version: '2.0', sandbox: true }); 
    console.log('[PI SDK] Sandbox Initialized');
  } catch (error) {
    // إذا كانت مهيأة مسبقاً، سيمر الكود بسلام
    console.warn('[PI SDK] Already initialized or check portal settings');
  }
}

/**
 * ✅ تعديل المصادقة: استدعاء التهيئة يدوياً داخل الدالة لضمان استجابة الزر
 */
export async function authenticateUser(scopes: string[] = ['username', 'payments', 'wallet_address']): Promise<any> {
  if (!isPiBrowser()) {
    return { username: "Guest_Explorer", uid: "demo" };
  }

  try {
    const Pi = getPiSDK();
    
    // 💡 إضافة ذكية: إذا لم يستجب الـ SDK، نقوم بإعادة تهيئته فوراً
    if (!Pi || !Pi.authenticate) {
       await initializePiSDK();
    }

    // طلب المصادقة
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    
    return {
      uid: auth.user.uid,
      username: auth.user.username,
      wallet_address: auth.user.wallet_address,
      accessToken: auth.accessToken
    };
  } catch (error: any) {
    console.error('[PI SDK] Authentication failed:', error);
    // تنبيه المستخدم بالخطأ الحقيقي (مثل عدم تطابق الرابط المسجل في البوابة)
    alert("Pi Browser Link Error: " + (error.message || "Please refresh the page"));
    throw error;
  }
}

function onIncompletePaymentFound(payment: any) {
  console.log('[PI SDK] Incomplete payment found:', payment);
  if (payment) {
     fetch('/api/pi-payment', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction.txid, action: 'complete' })
     });
  }
}
