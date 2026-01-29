interface PiPaymentSDK {
  init?: (options: { version: string }) => Promise<void>;
  authenticate?: (scopes: string[], onIncomplete: (payment: any) => void) => Promise<{ user: { uid: string; username: string } }>;
  createPayment: (config: any, callbacks: any) => Promise<{ identifier: string } | void>;
}

declare global {
  interface Window {
    Pi?: PiPaymentSDK;
  }
}

export async function createVIPPayment(uid: string, onSuccess: () => void) {
  if (!window.Pi) {
    alert("Please open this app in Pi Browser");
    return;
  } 

  try {
    await window.Pi.createPayment({
      amount: 1, 
      memo: "Reputa Score VIP Access",
      metadata: { uid, plan: "vip" },
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, action: 'approve', uid }),
        });
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid, action: 'complete', uid }),
        });

        if (res.ok) {
          onSuccess();
        } else {
          alert("❌ Final step failed. Please contact support.");
        }
      },

      onCancel: () => {
        alert("❌ Payment cancelled");
      },

      onError: (error: any) => {
        alert("❌ Pi SDK Error: " + JSON.stringify(error));
      },
    });
  } catch (err: any) {
    alert("❌ Connection Error: " + err.message);
  }
}
