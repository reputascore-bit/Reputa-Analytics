// تأكد من أن الإعدادات داخل OutboundDistributor تتطابق مع Mainnet
export const executeExternalPayout = async (address: string, amount: number, memo: string) => {
  try {
    // إذا كنت تستخدم Pi SDK للتحويل من التطبيق للمستخدم (App-to-User)
    // يجب أن تكون المحفظة التي ترسل منها تحتوي على رصيد كافٍ ورسوم (Fees)
    const payment = await window.Pi.createPayment({
      amount: amount,
      memo: memo,
      metadata: { target_address: address },
      uid: "payout_event_" + Date.now()
    }, {
      // ⚠️ ملاحظة هامة: لكي تكتمل هذه المعاملة، يجب أن تكون محفظة المطور 
      // مرتبطة بـ App Wallet ومفعلة في الـ Developer Portal
      onReadyForServerApproval: (paymentId: string) => {
        // استدعاء السيرفر لعمل Approve
        fetch('/api/pi-payment', {
          method: 'POST',
          body: JSON.stringify({ paymentId, action: 'approve' })
        });
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        // استدعاء السيرفر لعمل Complete
        fetch('/api/pi-payment', {
          method: 'POST',
          body: JSON.stringify({ paymentId, action: 'complete', txid })
        });
      },
      onCancel: (paymentId: string) => console.log("Cancelled"),
      onError: (error: Error, paymentId?: string) => console.error(error)
    });
  } catch (e) {
    console.error("Payout failed", e);
  }
};
