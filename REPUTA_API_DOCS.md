📡 Reputa Protocol API Documentation v3.0

# شامل API Reference

## ✅ قائمة المحتويات
1. المصادقة و التسجيل
2. إدارة المحفظة
3. السمعة و النقاط
4. الأنشطة و المشاركة
5. Demo Mode
6. لوحة المراقبة (Admin)
7. Analytics و التقارير

---

## 1️⃣ المصادقة و التسجيل (Authentication)

### تسجيل مستخدم جديد
**POST** `/api/auth/register`

```json
Request:
{
  "piUser": {
    "uid": "user_123",
    "username": "pioneer_name",
    "email": "user@example.com",
    "firstName": "First",
    "lastName": "Last"
  }
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "pioneerId": "user_123",
    "username": "pioneer_name",
    "email": "user@example.com",
    "totalPoints": 0,
    "reputationScore": 0,
    "level": "Bronze",
    "createdAt": "2026-02-03T..."
  }
}
```

### الحصول على ملف المستخدم
**GET** `/api/auth/user/:pioneerId`

```bash
curl http://localhost:3000/api/auth/user/user_123

Response:
{
  "success": true,
  "user": {
    "pioneerId": "user_123",
    "username": "pioneer_name",
    "totalPoints": 850,
    "reputationScore": 750,
    "level": "Gold",
    "isVip": false,
    "isDemoMode": false
  }
}
```

---

## 2️⃣ إدارة المحفظة (Wallet Management)

### ربط محفظة جديدة
**POST** `/api/wallet/link`

```json
Request:
{
  "pioneerId": "user_123",
  "walletAddress": "0xabcd1234...",
  "network": "mainnet"
}

Response:
{
  "success": true,
  "message": "Wallet linked successfully"
}
```

### الحصول على بيانات المحفظة
**GET** `/api/wallet/:pioneerId/:network`

Parameters:
- `pioneerId` - معرّف Pioneer
- `network` - "mainnet" أو "testnet"

```bash
curl http://localhost:3000/api/wallet/user_123/mainnet

Response:
{
  "success": true,
  "wallet": {
    "pioneerId": "user_123",
    "walletAddress": "0xabcd1234...",
    "network": "mainnet",
    "currentBalance": 350.5,
    "totalTransactions": 45,
    "tokenHoldings": [
      {
        "tokenName": "Pi",
        "symbol": "PI",
        "balance": 350.5,
        "value": 350.5
      }
    ],
    "stakeAmount": 100,
    "walletAge": 730,
    "activity3Months": 12,
    "dexTradingVolume": 250.5,
    "lastBlockchainSync": "2026-02-03T..."
  }
}
```

---

## 3️⃣ السمعة و النقاط (Reputation & Points)

### الحصول على درجة السمعة
**GET** `/api/reputation/:pioneerId`

```bash
curl http://localhost:3000/api/reputation/user_123

Response:
{
  "success": true,
  "pioneerId": "user_123",
  "reputationScore": 750,
  "mainnetScore": 450,
  "testnetScore": 150,
  "appPoints": 150,
  "totalPoints": 750,
  "level": "Gold",
  "rank": 45,
  "stats": {
    "user": {...},
    "mainnet": {
      "balance": 350.5,
      "transactions": 45,
      "walletAge": 730,
      "stakeAmount": 100,
      "tokenHoldings": [...]
    },
    "testnet": {...},
    "activity": {
      "totalDailyLogins": 60,
      "currentStreak": 15,
      "referralsGiven": 3,
      "referralsPending": 1
    }
  }
}
```

### الحصول على سجل النقاط
**GET** `/api/points/log/:pioneerId`

Parameters:
- `limit` - عدد السجلات (افتراضي: 50)

```bash
curl http://localhost:3000/api/points/log/user_123?limit=20

Response:
{
  "success": true,
  "count": 20,
  "log": [
    {
      "pioneerId": "user_123",
      "action": "wallet_transfer_sent",
      "pointsChange": 10,
      "previousTotal": 840,
      "newTotal": 850,
      "metadata": {
        "txHash": "0x...",
        "amount": 25.5
      },
      "timestamp": "2026-02-03T..."
    }
  ]
}
```

### جدول أفضل المستخدمين (Leaderboard)
**GET** `/api/leaderboard`

Parameters:
- `limit` - عدد المستخدمين (افتراضي: 100)

```bash
curl http://localhost:3000/api/leaderboard?limit=10

Response:
{
  "success": true,
  "count": 10,
  "leaderboard": [
    {
      "rank": 1,
      "pioneerId": "top_user",
      "username": "legend_pioneer",
      "reputationScore": 950,
      "mainnetScore": 570,
      "testnetScore": 190,
      "appPoints": 190,
      "level": "Diamond"
    }
  ]
}
```

---

## 4️⃣ الأنشطة و المشاركة (Activities)

### تسجيل دخول يومي
**POST** `/api/activity/daily-checkin/:pioneerId`

```json
Request:
{
  "withAds": false
}

Response:
{
  "success": true,
  "message": "Daily check-in recorded",
  "pointsEarned": 3
}
```

Parameters:
- `withAds` - مع الإعلانات (نعم/لا) - النقاط: 5 مع الإعلانات، 3 بدونها

### إضافة إحالة
**POST** `/api/activity/referral`

```json
Request:
{
  "referrerId": "user_123",
  "referredEmail": "friend@example.com"
}

Response:
{
  "success": true,
  "message": "Referral added"
}
```

### تأكيد إحالة (عند التسجيل)
**POST** `/api/activity/confirm-referral`

```json
Request:
{
  "referrerId": "user_123",
  "referredPioneerId": "new_user_456"
}

Response:
{
  "success": true,
  "message": "Referral confirmed",
  "pointsAwarded": 10
}
```

---

## 5️⃣ مزامنة البلوكشين (Blockchain Sync)

### تشغيل مزامنة يدوية
**POST** `/api/sync/:pioneerId`

```bash
curl -X POST http://localhost:3000/api/sync/user_123

Response:
{
  "success": true,
  "message": "Sync started",
  "sync": {
    "pioneerId": "user_123",
    "status": "synced",
    "lastSync": "2026-02-03T...",
    "nextSync": "2026-02-03T... (+5 minutes)",
    "message": "Synced mainnet (45 tx) and testnet (12 tx)"
  }
}
```

### الحصول على حالة المزامنة
**GET** `/api/sync/status/:pioneerId`

```bash
curl http://localhost:3000/api/sync/status/user_123

Response:
{
  "success": true,
  "status": {
    "pioneerId": "user_123",
    "lastSyncTime": "2026-02-03T...",
    "mainnetLastSync": "2026-02-03T...",
    "mainnetBalance": 350.5,
    "mainnetTransactions": 45,
    "testnetLastSync": "2026-02-03T...",
    "testnetBalance": 80.25,
    "testnetTransactions": 12
  }
}
```

---

## 6️⃣ Demo Mode

### تفعيل Demo Mode
**POST** `/api/demo/initialize/:pioneerId`

```bash
curl -X POST http://localhost:3000/api/demo/initialize/user_123

Response:
{
  "success": true,
  "message": "Demo mode initialized",
  "demoData": {
    "pioneerId": "user_123",
    "isActive": true,
    "demoPoints": {
      "mainnetScore": 400,
      "testnetScore": 150,
      "appPoints": 100,
      "totalReputationScore": 650,
      "level": "Gold"
    },
    "demoWallets": {
      "mainnet": {
        "address": "0x...",
        "balance": 300,
        "totalTransactions": 50
      },
      "testnet": {
        "address": "0x...",
        "balance": 120,
        "totalTransactions": 25
      }
    }
  }
}
```

### الحصول على بيانات Demo
**GET** `/api/demo/:pioneerId`

```bash
curl http://localhost:3000/api/demo/user_123

Response:
{
  "success": true,
  "demoData": {...}
}
```

### محاكاة معاملة
**POST** `/api/demo/:pioneerId/simulate/transaction`

```json
Request:
{
  "type": "sent",
  "amount": 50
}

Types: "sent", "received", "stake", "dex"

Response:
{
  "success": true,
  "message": "Transaction simulated"
}
```

### محاكاة تسجيل يومي
**POST** `/api/demo/:pioneerId/simulate/daily-login`

```json
Request:
{
  "withAds": true
}

Response:
{
  "success": true,
  "message": "Daily login simulated",
  "pointsEarned": 5
}
```

### الخروج من Demo Mode
**POST** `/api/demo/:pioneerId/deactivate`

```bash
curl -X POST http://localhost:3000/api/demo/user_123/deactivate

Response:
{
  "success": true,
  "message": "Demo mode deactivated"
}
```

### إعادة تعيين Demo Mode
**POST** `/api/demo/:pioneerId/reset`

```bash
curl -X POST http://localhost:3000/api/demo/user_123/reset

Response:
{
  "success": true,
  "message": "Demo mode reset"
}
```

---

## 7️⃣ لوحة المراقبة (Admin Console)

### Dashboard الرئيسي
**GET** `/api/admin/dashboard`

```bash
curl http://localhost:3000/api/admin/dashboard

Response:
{
  "success": true,
  "dashboard": {
    "users": {
      "total": 1250,
      "byLevel": [
        {"_id": "Gold", "count": 450},
        {"_id": "Silver", "count": 380}
      ]
    },
    "reputation": {
      "totalPoints": 850000,
      "averageScore": 680
    },
    "blockchain": {
      "totalTransactions": 45000,
      "mainnet": 35000,
      "testnet": 10000
    },
    "activity": {
      "dailyLogins": 25000,
      "confirmedReferrals": 800
    },
    "demoMode": {
      "activeSessions": 45
    }
  }
}
```

### قائمة المستخدمين
**GET** `/api/admin/users`

Parameters:
- `limit` - عدد النتائج (افتراضي: 100)
- `skip` - تخطي (افتراضي: 0)

```bash
curl http://localhost:3000/api/admin/users?limit=50

Response:
{
  "success": true,
  "totalCount": 1250,
  "count": 50,
  "users": [...]
}
```

### البحث عن مستخدم
**GET** `/api/admin/users/search`

Parameters:
- `query` - البحث عن pioneerId, username, email
- `level` - تصفية حسب المستوى
- `sortBy` - الترتيب (افتراضي: reputationScore)
- `order` - 1 (تصاعدي) أو -1 (تنازلي)

```bash
curl "http://localhost:3000/api/admin/users/search?query=pioneer&level=Gold&sortBy=totalPoints&order=-1"

Response:
{
  "success": true,
  "count": 25,
  "users": [...]
}
```

### تفاصيل المستخدم الكاملة
**GET** `/api/admin/user/:pioneerId/details`

```bash
curl http://localhost:3000/api/admin/user/user_123/details

Response:
{
  "success": true,
  "user": {...},
  "wallets": [...],
  "recentTransactions": [...],
  "pointsHistory": [...],
  "referrals": {
    "given": [...],
    "received": [...]
  },
  "dailyLogins": [...]
}
```

### حالة البلوكشين
**GET** `/api/admin/blockchain/status`

```bash
curl http://localhost:3000/api/admin/blockchain/status

Response:
{
  "success": true,
  "syncStatus": [
    {"_id": "synced", "count": 1200},
    {"_id": "syncing", "count": 30}
  ],
  "recentTransactions": [...],
  "networks": {
    "mainnet": {
      "totalBalance": 350000,
      "avgBalance": 280,
      "totalTransactions": 35000
    },
    "testnet": {...}
  }
}
```

### تحليلات النقاط
**GET** `/api/admin/analytics/points`

```bash
curl http://localhost:3000/api/admin/analytics/points

Response:
{
  "success": true,
  "pointsByAction": [
    {
      "_id": "daily_login",
      "totalPoints": 75000,
      "count": 25000
    }
  ],
  "dailyTrend": [
    {
      "_id": "2026-02-03",
      "totalPoints": 2500,
      "count": 800
    }
  ],
  "topEarners": [...]
}
```

### تحليلات الإحالات
**GET** `/api/admin/analytics/referrals`

```bash
curl http://localhost:3000/api/admin/analytics/referrals

Response:
{
  "success": true,
  "stats": {
    "total": 1200,
    "confirmed": 950,
    "pending": 250,
    "conversionRate": 0.79
  },
  "topReferrers": [...]
}
```

### تحديث النقاط الأسبوعي
**POST** `/api/admin/update-weekly`

```bash
curl -X POST http://localhost:3000/api/admin/update-weekly

Response:
{
  "success": true,
  "message": "Weekly update completed",
  "result": {
    "updated": 1200,
    "failed": 5
  }
}
```

### حذف المستخدم
**DELETE** `/api/admin/user/:pioneerId`

```bash
curl -X DELETE http://localhost:3000/api/admin/user/user_123

Response:
{
  "success": true,
  "message": "User deleted successfully"
}
```

### تصدير بيانات CSV
**GET** `/api/admin/export/users`

```bash
curl http://localhost:3000/api/admin/export/users > users.csv
```

---

## 🔑 Error Codes

| Code | Message | الحل |
|------|---------|------|
| 404 | User not found | تحقق من pioneerId |
| 404 | Wallet not found | ربط محفظة أولاً |
| 500 | MongoDB connection error | تحقق من MONGODB_URI |
| 500 | Sync error | أعد المحاولة لاحقاً |

---

## ✅ معايير النجاح

جميع الـ responses تحتوي على:
- `"success": true/false`
- `"message": "..."` (في حالة الخطأ)
- `"data": {...}` (البيانات المطلوبة)

---

**آخر تحديث: 2026-02-03**
**نسخة API: v3.0**
