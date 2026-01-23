export async function createVIPPayment(
  uid: string,
  onSuccess: () => void
) {
  if (!window.Pi) {
    alert("❌ Please open this app in Pi Browser");
    return;
  }

  try {
    // 1️⃣ نطلب من السيرفر معلومات الدفع
    const res = await fetch('/api/pi/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });

    // إذا فشل السيرفر في الرد، سنعرف السبب هنا
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Server Error: ${res.status} - ${JSON.stringify(errorData)}`);
    }

    const payment = await res.json();

    // 2️⃣ إنشاء الدفع داخل Pi Browser
    await window.Pi.createPayment(
      {
        amount: payment.amount, 
        memo: "Reputa Score VIP Access",
        metadata: {
          uid,
          plan: "vip",
        },
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch('/api/pi/approve-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId }),
          });
        },

        onReadyForServerCompletion: async (
          paymentId: string,
          txid: string
        ) => {
          await fetch('/api/pi/complete-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid, uid }),
          });
          onSuccess();
        },

        onCancel: () => {
          alert("❌ Payment cancelled");
        },

        onError: (error: any) => {
          console.error("Pi Payment Error:", error);
          // تعديل: إظهار تفاصيل خطأ الـ SDK
          alert("❌ SDK Error: " + JSON.stringify(error));
        },
      }
    );
  } catch (err: any) {
    console.error(err);
    // تعديل: إظهار الخطأ الحقيقي بدلاً من رسالة ثابتة
    alert("❌ Error Detail: " + err.message);
  }
}
