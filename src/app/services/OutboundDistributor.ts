// OutboundDistributor.ts
// ملف منعزل لإدارة المعاملات من التطبيق للمستخدم (App-to-User)

export const executeExternalPayout = async (userWallet: string, amount: number, memoText: string) => {
  try {
    // التأكد من وجود SDK في نافذة المتصفح
    if (!(window as any).Pi) {
      console.error("Pi SDK is not initialized");
      return;
    }

    const payment = await (window as any).Pi.createPayment({
      amount: amount,
      memo: memoText, 
      metadata: { action: "REPUTA_DISTRIBUTION" },
      uid: `dist_${Date.now()}`
    }, {
      onReadyForServerApproval: (paymentId: string) => {
        // يتم استدعاء API السيرفر الخاص بك هنا للموافقة
        console.log("العملية تنتظر موافقة السيرفر، رقم المعاملة:", paymentId);
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log("اكتملت المعاملة بنجاح على البلوكشين:", txid);
        // هنا يمكنك إضافة منطق لتحديث واجهتك إذا أردت
      },
      onCancel: (paymentId: string) => console.log("تم إلغاء عملية الدفع الخارجة"),
      onError: (error: any) => console.error("حدث خطأ أثناء الدفع للمستخدم:", error),
    });
  } catch (err) {
    console.error("فشل تقني في محرك التوزيع:", err);
  }
};
