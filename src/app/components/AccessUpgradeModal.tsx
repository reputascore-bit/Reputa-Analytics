// ✅ دالة التعامل مع ضغطة الزر مع تشخيص الأخطاء
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
      alert("Initiating Pi Payment for: " + currentUser.username);
      
      // 2. استدعاء الدالة ومراقبة التنفيذ
      await createVIPPayment(currentUser.uid, () => {
        alert("Success! Callback triggered.");
        onUpgrade();
        onClose();
      });
      
    } catch (err: any) {
      alert("Crash Error: " + err.message);
    }
  };
