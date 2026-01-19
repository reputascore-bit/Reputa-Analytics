export async function createVIPPayment(uid: string, onSuccess: () => void) {
  try {
    if (!(window as any).Pi) {
      alert("Please open this app inside Pi Browser");
      return;
    }

    await (window as any).Pi.createPayment({
      amount: 1,
      memo: "VIP Subscription for Reputa Score",
      metadata: { uid: uid, type: "vip_upgrade" },
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        const response = await fetch('/api/pi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, action: 'approve', uid }) // إرسال uid
        });
        if (response.ok) return paymentId;
        throw new Error("Server Approval Failed");
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        const response = await fetch('/api/pi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid, action: 'complete', uid }) // إرسال uid
        });

        if (response.ok) {
          onSuccess(); 
          return paymentId;
        }
        throw new Error("Server Completion Failed");
      },

      onCancel: (paymentId: string) => console.log("Cancelled:", paymentId),
      onError: (error: Error) => alert("Payment Error: " + error.message),
    });
  } catch (err) {
    console.error("Critical Payment Error:", err);
  }
}
