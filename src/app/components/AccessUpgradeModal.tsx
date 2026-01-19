// ✅ النسخة المصححة والمؤمنة
  const handlePayment = async () => {
    console.log("Button pressed");
    
    // 1. فحص هل المستخدم موجود
    if (!currentUser) {
      alert("Error: No user data found. Please link your account.");
      return;
    }

    if (currentUser.uid === "demo") {
      alert("Demo mode: Please open the app in Pi Browser to pay.");
      return;
    }

    try {
      // تنبيه لبدء العملية
      console.log("Initiating Pi Payment for:", currentUser.username);
      
      // 2. استدعاء دالة الدفع
      // نمرر الـ UID ودالة النجاح
      await createVIPPayment(currentUser.uid, async () => {
        try {
          alert("✅ Payment Confirmed! Unlocking Features...");
          
          // تنفيذ دالة التحديث الموجودة في App.tsx
          if (typeof onUpgrade === 'function') {
            await onUpgrade(); 
          }
          
          // إغلاق النافذة
          onClose();
        } catch (callbackErr) {
          console.error("UI Update Error:", callbackErr);
        }
      });
      
    } catch (err: any) {
      // إظهار الخطأ إذا فشل استدعاء الـ SDK نفسه
      alert("Payment Failed: " + (err.message || "Unknown Error"));
      console.error("Pi Payment Error:", err);
    }
  };
