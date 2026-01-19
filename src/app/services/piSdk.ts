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
 * ✅ التعديل الحاسم: إصلاح التهيئة لتعمل في Sandbox مع معالجة التجميد
 */
export async function initializePiSDK(): Promise<void> {
  if (!isPiBrowser()) return;

  try {
    const Pi = getPiSDK();
    // استخدام await مع try/catch يضمن أن التطبيق لن يتوقف هنا
    await Pi.init({ version: '2.0', sandbox: true }); 
    console.log('[PI SDK] Sandbox Initialized successfully');
  } catch (error) {
    console.error('[PI SDK] Initialization failed:', error);
    // لا نطلق Alert هنا لكي لا نزعج المستخدم، لكننا نسجل الخطأ
  }
}

/**
 * ✅ تعديل المصادقة لإظهار التنبيهات (Alerts) في حالة Sandbox
 */
export async function authenticateUser(scopes: string[] = ['username', 'payments', 'wallet_address']): Promise<any> {
  if (!isPiBrowser()) {
    return { username: "Guest_Explorer", uid: "demo" };
  }

  try {
    const Pi = getPiSDK();
    
    // التأكد من وجود كائن Pi قبل المحاولة
    if (!Pi) throw new Error("Pi SDK not found in window");

    // طلب المصادقة مع إضافة alert في حال الفشل لمعرفة السبب (مثلاً App ID wrong)
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    
    return {
      uid: auth.user.uid,
      username: auth.user.username,
      wallet_address: auth.user.wallet_address,
      accessToken: auth.accessToken
    };
  } catch (error: any) {
    console.error('[PI SDK] Authentication failed:', error);
    // إضافة alert هنا ضرورية جداً في Sandbox لمعرفة لماذا لا يعمل الزر
    alert("Link Error: " + (error.message || "App not verified or configured correctly in Pi Dev Portal"));
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

// ... بقية الملف (getWalletAddress, createPayment, إلخ) تبقى كما هي دون تغيير
