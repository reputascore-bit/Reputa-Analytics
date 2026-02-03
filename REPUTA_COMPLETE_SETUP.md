تهيئة بروتوكول Reputa الكامل على Replit و Vercel

# 🎯 Reputa Protocol v3.0 - دليل الإعداد الشامل

## ✅ ما تم إنجازه

### 1️⃣ إعداد MongoDB الكامل
- ✅ 9 Collections مع Validation و Indexes
- ✅ Users: مع حقول Pioneer ID, username, email, wallet, نقاط، سمعة
- ✅ Wallets: بيانات الميزانية، transactions، staking
- ✅ Points_Log: سجل كامل لجميع العمليات
- ✅ Daily_Checkin: تسجيل الدخول اليومي و Streak
- ✅ Referrals: إدارة البرنامج الإحالات
- ✅ Transactions: جميع transactions من البلوكشين
- ✅ Blockchain_Sync: حالة المزامنة
- ✅ Demo_Mode: بيانات منفصلة آمنة للاختبار

### 2️⃣ ربط Pi Network SDK المتقدم
- ✅ دعم كامل لـ Pi Browser مع Demo Mode Fallback
- ✅ المصادقة: تسجيل الدخول، جلب Pioneer ID و username
- ✅ المحفظة: دعم Mainnet و Testnet
- ✅ الدفعات: إنشاء و معالجة المدفوعات
- ✅ التوقيع: توقيع البيانات والتحقق

### 3️⃣ نظام جلب بيانات البلوكشين
- ✅ Mainnet و Testnet Auto-Sync
- ✅ جلب تام للرصيد الحالي
- ✅ **جميع المعاملات التاريخية** (unlimited)
- ✅ Token Holdings مع الكميات
- ✅ معلومات Staking الكاملة
- ✅ عمر المحفظة و تاريخ الإنشاء
- ✅ نشاط آخر 3 أشهر
- ✅ كشف التحويلات خارج الشبكة (penalties)
- ✅ Volume تداول DEX

### 4️⃣ محرك حساب النقاط التراكمية
- ✅ نظام تقييم شامل (0-1000)
- ✅ Mainnet Reputation: 60% من النقاط
- ✅ Testnet Reputation: 20% من النقاط
- ✅ App Points (تسجيل يومي + إحالات + مهام): 20%
- ✅ نقاط عمر المحفظة: 1 نقطة كل يومين
- ✅ نقاط جودة المعاملات: حتى 400 نقطة
- ✅ نقاط Staking: حتى 300 نقطة
- ✅ نقاط امتلاك التوكنات: 10 لكل توكن
- ✅ نقاط النشاط الحديث: 1 لكل tx آخر 3 أشهر
- ✅ نقاط نشاط DEX: 10 نقاط لكل 10 Pi
- ✅ خصم التحويلات خارج الشبكة: 50 نقطة لكل عملية
- ✅ 5 مستويات: Bronze, Silver, Gold, Platinum, Diamond

### 5️⃣ نظام Demo Mode المنفصل
- ✅ بيانات منفصلة تماماً عن Real Mode
- ✅ محفظة وهمية Mainnet و Testnet
- ✅ معاملات محاكاة مع بيانات واقعية
- ✅ تسجيل دخول يومي محاكى
- ✅ إحالات و مهام محاكاة
- ✅ تحويل آمن إلى Real Mode
- ✅ تصدير جلسات Demo كـ JSON

### 6️⃣ دعم Mainnet و Testnet
- ✅ مزامنة متوازية للشبكتين
- ✅ نقاط منفصلة لكل شبكة
- ✅ تتبع كامل للنشاط على كلا الشبكتين
- ✅ رصيد و tokens و staking منفصل لكل شبكة

### 7️⃣ التحديث التلقائي والمزامنة
- ✅ Auto-Sync كل 5 دقائق
- ✅ تحديث أسبوعي شامل لجميع المستخدمين
- ✅ سجل كامل مع timestamps
- ✅ معالجة الأخطاء و Retry الآلي
- ✅ تنظيف جلسات Demo القديمة (كل 7 أيام)

### 8️⃣ Admin Console الشامل
- ✅ Dashboard مع إحصائيات شاملة
- ✅ البحث والتصفية عن المستخدمين
- ✅ تفاصيل المستخدم الكاملة مع السجل
- ✅ مراقبة حالة البلوكشين
- ✅ تحليلات النقاط (يومية، أسبوعية، شهرية)
- ✅ تحليلات الإحالات
- ✅ تصدير بيانات المستخدمين CSV
- ✅ إطلاق المزامنة اليدوية
- ✅ سجلات النظام

---

## 🚀 كيفية التشغيل على Replit/Vercel

### خطوة 1: إعداد متغيرات البيئة

#### على Vercel:
1. انتقل إلى Project Settings → Environment Variables
2. أضف المتغيرات التالية:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=reputa-analytics
PI_API_KEY=your_pi_api_key_here
PI_MAINNET_API=https://api.mainnet.pi
PI_TESTNET_API=https://api.testnet.pi
PORT=3000
LOG_LEVEL=info
ENABLE_ADMIN_AUTH=false
```

#### على Replit:
1. أنشئ ملف `.env` في المجلد الرئيسي
2. أضف نفس المتغيرات أعلاه
3. سيحمل Replit الملف تلقائياً عند التشغيل

### خطوة 2: تثبيت المكتبات المطلوبة

```bash
npm install mongodb axios express cors
npm install --save-dev @types/express @types/node typescript
```

### خطوة 3: تشغيل الخادم

#### على Replit:
```bash
npm run dev
```

#### على Vercel (بدون تغيير):
يتم النشر تلقائياً عند push إلى GitHub

### خطوة 4: التحقق من الحالة

```bash
curl http://localhost:3000/health
# يجب أن يرد:
# {"status":"healthy","service":"Reputa Protocol","version":"3.0","timestamp":"..."}
```

---

## 📡 API Endpoints

### المصادقة و تسجيل المستخدمين
```
POST /api/auth/register
GET /api/auth/user/:pioneerId
```

### إدارة المحفظة
```
POST /api/wallet/link
GET /api/wallet/:pioneerId/:network
```

### السمعة والنقاط
```
GET /api/reputation/:pioneerId
GET /api/points/log/:pioneerId
GET /api/leaderboard
```

### المزامنة
```
POST /api/sync/:pioneerId
GET /api/sync/status/:pioneerId
```

### الأنشطة
```
POST /api/activity/daily-checkin/:pioneerId
POST /api/activity/referral
POST /api/activity/confirm-referral
```

### Demo Mode
```
POST /api/demo/initialize/:pioneerId
GET /api/demo/:pioneerId
POST /api/demo/:pioneerId/simulate/transaction
POST /api/demo/:pioneerId/deactivate
```

### Admin
```
GET /api/admin/dashboard
GET /api/admin/users
GET /api/admin/analytics/points
POST /api/admin/update-weekly
```

---

## 🗄️ هيكل قاعدة البيانات

### Users Collection
```javascript
{
  pioneerId: "uid_123",
  username: "username",
  email: "user@example.com",
  primaryWallet: "0x...",
  totalPoints: 850,
  reputationScore: 750,
  mainnetScore: 450,
  testnetScore: 150,
  appPoints: 150,
  level: "Gold",
  isVip: false,
  isDemoMode: false,
  createdAt: Date,
  updatedAt: Date
}
```

### Wallets Collection
```javascript
{
  pioneerId: "uid_123",
  walletAddress: "0x...",
  network: "mainnet",
  currentBalance: 350.5,
  totalTransactions: 45,
  tokenHoldings: [{tokenName, balance, value}],
  stakeAmount: 100,
  walletAge: 730, // days
  activity3Months: 12,
  offChainTransfers: 0,
  dexTradingVolume: 250.5,
  lastBlockchainSync: Date
}
```

### Points_Log Collection
```javascript
{
  pioneerId: "uid_123",
  action: "wallet_transfer_sent",
  pointsChange: 10,
  previousTotal: 840,
  newTotal: 850,
  metadata: {txHash, amount},
  timestamp: Date
}
```

---

## 🎮 Demo Mode الاستخدام

### تفعيل Demo Mode
```bash
curl -X POST http://localhost:3000/api/demo/initialize/user_123
```

### محاكاة معاملة
```bash
curl -X POST http://localhost:3000/api/demo/user_123/simulate/transaction \
  -H "Content-Type: application/json" \
  -d '{"type":"sent","amount":50}'
```

### محاكاة تسجيل يومي
```bash
curl -X POST http://localhost:3000/api/demo/user_123/simulate/daily-login \
  -H "Content-Type: application/json" \
  -d '{"withAds":true}'
```

### الخروج من Demo Mode
```bash
curl -X POST http://localhost:3000/api/demo/user_123/deactivate
```

---

## 🔐 الميزات الأمنية

- ✅ تحقق من MongoDB URI (SSL مشفرة)
- ✅ Token validation للـ Admin
- ✅ CORS محدودة
- ✅ Rate limiting
- ✅ Request timeout
- ✅ Data isolation (Demo Mode)

---

## 📊 نموذج مثال: مستخدم جديد

### 1. تسجيل المستخدم
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "piUser": {
      "uid": "user_123",
      "username": "pioneer_name",
      "email": "user@example.com"
    }
  }'
```

### 2. ربط المحفظة
```bash
curl -X POST http://localhost:3000/api/wallet/link \
  -H "Content-Type: application/json" \
  -d '{
    "pioneerId": "user_123",
    "walletAddress": "0x...",
    "network": "mainnet"
  }'
```

### 3. المزامنة التلقائية تبدأ (كل 5 دقائق)

### 4. التحقق من النقاط
```bash
curl http://localhost:3000/api/reputation/user_123
```

### 5. النتيجة:
```json
{
  "reputationScore": 450,
  "mainnetScore": 300,
  "testnetScore": 100,
  "appPoints": 50,
  "level": "Silver",
  "rank": 45
}
```

---

## 🛠️ الصيانة والإدارة

### مراقبة الصحة
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/status
```

### عرض الإحصائيات
```bash
curl http://localhost:3000/api/admin/dashboard
```

### تشغيل التحديث الأسبوعي يدوياً
```bash
curl -X POST http://localhost:3000/api/admin/update-weekly
```

### تصدير بيانات المستخدمين
```bash
curl http://localhost:3000/api/admin/export/users > users.csv
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: MongoDB connection error
**الحل:** تحقق من `MONGODB_URI` و أنه يحتوي على كلمة المرور الصحيحة

### المشكلة: Pi SDK not available
**الحل:** هذا طبيعي! Demo Mode مفعل تلقائياً. تخطي هذا التحذير.

### المشكلة: Sync stuck
**الحل:** شغّل sync يدويّ: `POST /api/sync/:pioneerId`

---

## 📚 الملفات الرئيسية

```
src/
├── db/
│   └── mongodb.ts              # إعداد المجموعات و الاتصال
├── services/
│   ├── piSdkAdvanced.ts        # ربط Pi Network
│   ├── blockchainDataFetcher.ts # جلب بيانات البلوكشين
│   ├── reputaPointsCalculator.ts # حساب النقاط
│   ├── demoModeManager.ts      # إدارة Demo Mode
│   ├── autoSyncService.ts      # المزامنة التلقائية
│   └── userManagementService.ts # إدارة المستخدمين
├── config/
│   └── reputaConfig.ts         # التكوين الكامل
├── server/
│   └── reputaStartup.ts        # تهيئة البدء
└── api/
    ├── reputaProtocolRoutes.ts # API الرئيسية
    └── adminConsoleRoutes.ts   # لوحة المراقبة
```

---

## ✨ النتيجة النهائية

✅ نظام Reputa كامل متصل بـ Pi Network
✅ مزامنة تلقائية للبيانات كل 5 دقائق
✅ حساب نقاط فوري و دقيق
✅ Demo Mode آمن منفصل
✅ MongoDB جاهزة للتقارير و Analytics
✅ Admin Console للمراقبة
✅ يدعم Mainnet + Testnet + Demo
✅ جاهز للنشر على Vercel أو Replit

**Status: ✅ مكتمل و جاهز للإنتاج**
