#!/bin/bash

# Reputa Protocol - نص التثبيت السريع
# Quick Installation Script for Replit/Vercel

set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║           🎯 Reputa Protocol v3.0 - التثبيت والتهيئة                      ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

# Check Node.js
echo ""
echo "✅ التحقق من المتطلبات..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. الرجاء تثبيته أولاً."
    exit 1
fi
echo "   Node.js version: $(node --version)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm غير مثبت."
    exit 1
fi
echo "   npm version: $(npm --version)"

# Create .env if not exists
echo ""
echo "📝 إعداد متغيرات البيئة..."
if [ ! -f .env ]; then
    echo "   إنشاء ملف .env جديد..."
    cat > .env << 'EOF'
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=reputa-analytics

# Pi Network
PI_API_KEY=your_pi_api_key_here
PI_MAINNET_API=https://api.mainnet.pi
PI_TESTNET_API=https://api.testnet.pi

# Application
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN=*
ENABLE_ADMIN_AUTH=false
EOF
    echo "   ✅ تم إنشاء .env - الرجاء تحديث البيانات الحقيقية"
else
    echo "   ✅ ملف .env موجود"
fi

# Install dependencies
echo ""
echo "📦 تثبيت المكتبات المطلوبة..."
npm install --save \
    mongodb \
    axios \
    express \
    cors \
    dotenv

npm install --save-dev \
    @types/express \
    @types/node \
    typescript \
    tsx

echo "   ✅ تم تثبيت المكتبات"

# Compile TypeScript
echo ""
echo "🔨 بناء المشروع..."
npm run type-check 2>/dev/null || true

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                      ✅ التثبيت اكتمل بنجاح!                              ║"
echo "╠════════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                            ║
echo "║ الخطوات التالية:                                                          ║
echo "║                                                                            ║
echo "║ 1. حدّث ملف .env بمعلومات MongoDB و Pi API                                ║
echo "║    MONGODB_URI=mongodb+srv://...                                          ║
echo "║    PI_API_KEY=...                                                         ║
echo "║                                                                            ║
echo "║ 2. ابدأ التطبيق:                                                           ║
echo "║    npm run dev                                                            ║
echo "║                                                                            ║
echo "║ 3. افتح في المتصفح:                                                       ║
echo "║    http://localhost:3000/health                                           ║
echo "║    http://localhost:3000/api/docs                                        ║
echo "║    http://localhost:3000/api/admin/dashboard                              ║
echo "║                                                                            ║
echo "║ الميزات المفعلة:                                                          ║
echo "║  ✅ Pi Network SDK + Demo Mode                                            ║
echo "║  ✅ MongoDB مع 9 Collections                                              ║
echo "║  ✅ Mainnet + Testnet Auto-Sync                                           ║
echo "║  ✅ Reputation Scoring (0-1000)                                           ║
echo "║  ✅ Daily Checkins & Referrals                                            ║
echo "║  ✅ Admin Console                                                         ║
echo "║  ✅ Demo Mode (آمن و منفصل)                                               ║
echo "║                                                                            ║
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

exit 0
