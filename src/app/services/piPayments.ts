declare global {
  interface Window {
    Pi: any;
  }
}

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

    if (!res.ok) throw new Error("Failed to create payment");

    const payment = await res.json();

    // 2️⃣ إنشاء الدفع داخل Pi Browser
    await window.Pi.createPayment(
      {
        amount: payment.amount, // 1 Pi (testnet)
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
          alert("❌ Payment failed");
        },
      }
    );
  } catch (err) {
    console.error(err);
    alert("❌ Could not start Pi payment");
  }
}
