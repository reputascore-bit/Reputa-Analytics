if (response.ok) {
      // --- التحسين المطلوب لبيانات المعاملات الحقيقية (دقة متناهية) ---
      
      const now = new Date();
      const txTimestamp = now.toISOString();
      
      // 1. تحديد نوع المعاملة بدقة (مثلاً: التحقق إذا كانت قيمة معينة تعني شراء توكن)
      const isDexSwap = parseFloat(amount) === 3.14; 
      const txType = isDexSwap ? "Pi DEX Swap" : "Sent";
      const subType = isDexSwap ? "Ecosystem Exchange" : "Wallet Transfer";

      // 2. إنشاء كائن المعاملة التفصيلي المتوافق مع التصميم الاحترافي
      const transactionDetail = JSON.stringify({
        id: responseData.identifier ? responseData.identifier.substring(0, 8) : Math.random().toString(36).substring(2, 10),
        type: txType,
        subType: subType,
        amount: parseFloat(amount).toFixed(2),
        status: "Success",
        // إضافة الوقت الدقيق بالدقائق والساعات (02:45 PM)
        exactTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        dateLabel: "Today", 
        timestamp: txTimestamp,
        to: cleanAddress
      });

      // حفظ المعاملة في قائمة الـ History (ليقرأها ملف get-wallet بالتفاصيل الجديدة)
      await redis.lpush(`history:${cleanAddress}`, transactionDetail);
      await redis.ltrim(`history:${cleanAddress}`, 0, 9);

      // زيادة عداد المعاملات الحقيقي لتحديث الإحصائيات في واجهة المستخدم
      await redis.incr(`tx_count:${cleanAddress}`);
      await redis.incr(`tx_count:${recipientUid}`);
      
      // زيادة العداد الإجمالي للتطبيق
      await redis.incr('total_app_transactions');
      
      return res.status(200).json({ success: true, data: responseData });
    }
