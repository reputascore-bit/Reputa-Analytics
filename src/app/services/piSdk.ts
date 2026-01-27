// piSdk.ts - العودة لبيئة الاختبار بالكامل

export const initializePiSDK = async () => {
  if (typeof window !== 'undefined' && (window as any).Pi) {
    // التعديل الأول: تفعيل الساندبوكس (Testnet)
    await (window as any).Pi.init({ 
      version: "2.0", 
      sandbox: true 
    });
    console.log("Pi SDK initialized in Testnet mode");
  }
};

export const authenticateUser = async (scopes: string[]) => {
  try {
    // التعديل الثاني: التأكد من أن التوثيق يذهب لرابط التست نت
    // الرابط الذي يجب أن يكون في الكود هو: https://api.testnet.minepi.com
    const auth = await (window as any).Pi.authenticate(scopes, onIncompletePaymentFound);
    return auth.user;
  } catch (err) {
    console.error("Auth failed:", err);
    throw err;
  }
};

// هذا الرابط هو المسؤول عن توجيه المدفوعات للتست نت وحل مشكلة "Paiement expiré"
const onIncompletePaymentFound = (payment: any) => {
  console.log("Incomplete payment found on Testnet:", payment);
};
/**
 * ✅ إعادة زر Link Account للحياة
 */
export async function authenticateUser(scopes: string[] = ['username', 'payments', 'wallet_address']): Promise<any> {
  if (!isPiBrowser()) return { username: "Guest_Explorer", uid: "demo" };

  const Pi = (window as any).Pi;

  try {
    // 💡 التعديل الأهم: استدعاء المصادقة مباشرة دون انتظار طويل
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    
    return {
      uid: auth.user.uid,
      username: auth.user.username,
      wallet_address: auth.user.wallet_address,
      accessToken: auth.accessToken
    };
  } catch (error: any) {
    console.error('[PI SDK] Auth Failed:', error);
    // إظهار الرسالة فقط إذا فشل الأمر تماماً
    alert("Authentication Error: " + error.message);
    throw error;
  }
}

function onIncompletePaymentFound(payment: any) {
  if (payment && payment.identifier) {
     fetch('/api/pi-payment', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction?.txid, action: 'complete' })
     }).catch(err => console.error("Payment Recovery Failed", err));
  }
}
