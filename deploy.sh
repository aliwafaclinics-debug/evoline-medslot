#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  Evoline MedSlot — سكريبت النشر التلقائي
#  Railway (Backend + PostgreSQL) + Vercel (Frontend)
# ════════════════════════════════════════════════════════════
#
# الاستخدام:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# المتطلبات:
#   - Node.js 20+
#   - حساب Railway (railway.app)
#   - حساب Vercel (vercel.com)
#   - psql مثبت محلياً (لتشغيل السكيما)
#
# ════════════════════════════════════════════════════════════

set -e  # أوقف السكريبت فوراً عند أي خطأ

# ── ألوان للطباعة ──
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

step() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BLUE}▶ $1${NC}"; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; }

PROJECT_NAME="evoline-medslot"
DOMAIN="evolinemedslot.ae"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/apps/backend"
FRONTEND_DIR="$SCRIPT_DIR/apps/frontend"
DB_SCHEMA="$SCRIPT_DIR/database/evoline_medslot_schema.sql"

# ════════════════════════════════════════════════════════════
# 0) فحص المتطلبات
# ════════════════════════════════════════════════════════════
step "فحص المتطلبات الأساسية"

command -v node >/dev/null 2>&1 || { err "Node.js غير مثبت. ثبّته من nodejs.org"; exit 1; }
ok "Node.js موجود: $(node -v)"

command -v npm >/dev/null 2>&1 || { err "npm غير مثبت"; exit 1; }
ok "npm موجود: $(npm -v)"

if ! command -v railway >/dev/null 2>&1; then
  warn "Railway CLI غير مثبت — جاري التثبيت..."
  npm install -g @railway/cli
fi
ok "Railway CLI جاهز"

if ! command -v vercel >/dev/null 2>&1; then
  warn "Vercel CLI غير مثبت — جاري التثبيت..."
  npm install -g vercel
fi
ok "Vercel CLI جاهز"

if [ ! -f "$DB_SCHEMA" ]; then
  err "ملف السكيما غير موجود في: $DB_SCHEMA"
  exit 1
fi
ok "ملف قاعدة البيانات موجود"

# ════════════════════════════════════════════════════════════
# 1) تسجيل الدخول
# ════════════════════════════════════════════════════════════
step "تسجيل الدخول إلى Railway و Vercel"

echo "سيُفتح المتصفح لتسجيل الدخول إلى Railway..."
railway login

echo -e "\nسيُفتح المتصفح لتسجيل الدخول إلى Vercel..."
vercel login

ok "تم تسجيل الدخول بنجاح"

# ════════════════════════════════════════════════════════════
# 2) نشر الباك إند على Railway
# ════════════════════════════════════════════════════════════
step "إعداد ونشر الباك إند على Railway"

cd "$BACKEND_DIR"

if [ ! -f ".railway/project.json" ] && [ ! -f "railway.json" ]; then
  echo "إنشاء مشروع Railway جديد..."
  railway init --name "${PROJECT_NAME}-backend"
else
  warn "مشروع Railway موجود مسبقاً — سيتم استخدامه"
fi

echo "إضافة قاعدة بيانات PostgreSQL..."
railway add --plugin postgresql || warn "قد تكون قاعدة البيانات مضافة مسبقاً"

# توليد مفاتيح أمان عشوائية قوية
JWT_ACCESS=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)

echo "إعداد متغيرات البيئة..."
railway variables set NODE_ENV="production"
railway variables set PORT="3001"
railway variables set JWT_ACCESS_SECRET="$JWT_ACCESS"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH"
railway variables set JWT_ACCESS_EXPIRES_IN="15m"
railway variables set JWT_REFRESH_EXPIRES_IN="30d"
railway variables set FRONTEND_URL="https://${DOMAIN}"

ok "متغيرات البيئة جُهّزت (المفاتيح محفوظة بأمان في Railway)"

echo "نشر الباك إند..."
railway up --detach

ok "تم رفع الباك إند"

echo "توليد رابط الدومين..."
railway domain || warn "استخدم 'railway domain' يدوياً إذا فشل التوليد التلقائي"

BACKEND_URL=$(railway domain 2>/dev/null | grep -oE 'https?://[^ ]+' | head -1)

if [ -z "$BACKEND_URL" ]; then
  warn "لم يتم استخراج رابط الباك إند تلقائياً. شغّل: railway domain"
  read -p "أدخل رابط الباك إند يدوياً (مثل https://xxx.up.railway.app): " BACKEND_URL
fi

ok "رابط الباك إند: $BACKEND_URL"

# ════════════════════════════════════════════════════════════
# 3) تشغيل سكيما قاعدة البيانات
# ════════════════════════════════════════════════════════════
step "تشغيل سكيما قاعدة البيانات"

if command -v psql >/dev/null 2>&1; then
  DATABASE_URL=$(railway variables get DATABASE_URL 2>/dev/null)
  if [ -n "$DATABASE_URL" ]; then
    echo "تشغيل ملف السكيما على قاعدة البيانات..."
    psql "$DATABASE_URL" -f "$DB_SCHEMA" && ok "تم إنشاء الجداول بنجاح" \
      || warn "حدث خطأ أثناء تشغيل السكيما — تحقق يدوياً"
  else
    warn "لم يتم العثور على DATABASE_URL. شغّل يدوياً:"
    echo "  psql \"\$(railway variables get DATABASE_URL)\" -f $DB_SCHEMA"
  fi
else
  warn "psql غير مثبت محلياً. شغّل هذا الأمر يدوياً بعد تثبيته:"
  echo "  psql \"\$(railway variables get DATABASE_URL)\" -f $DB_SCHEMA"
fi

# ════════════════════════════════════════════════════════════
# 4) نشر الفرونت إند على Vercel
# ════════════════════════════════════════════════════════════
step "إعداد ونشر الفرونت إند على Vercel"

cd "$FRONTEND_DIR"

echo "NEXT_PUBLIC_API_URL=${BACKEND_URL}/api" > .env.production
ok "تم إنشاء .env.production"

echo "نشر الفرونت إند على Vercel (إنتاج)..."
vercel --prod --yes --name "$PROJECT_NAME"

FRONTEND_URL=$(vercel ls "$PROJECT_NAME" 2>/dev/null | grep -oE 'https?://[^ ]+\.vercel\.app' | head -1)
ok "رابط الفرونت إند: ${FRONTEND_URL:-تحقق من لوحة Vercel}"

# ════════════════════════════════════════════════════════════
# 5) ربط الدومين (اختياري)
# ════════════════════════════════════════════════════════════
step "ربط الدومين المخصص (اختياري)"

read -p "هل تريد ربط دومين ${DOMAIN} الآن؟ (y/n): " LINK_DOMAIN

if [[ "$LINK_DOMAIN" == "y" || "$LINK_DOMAIN" == "Y" ]]; then
  echo "ربط ${DOMAIN} بـ Vercel..."
  vercel domains add "$DOMAIN" --yes || warn "فشل ربط الدومين — راجع لوحة Vercel"

  echo -e "\n${YELLOW}أضف سجلات DNS هذه عند مزود الدومين:${NC}"
  echo "  Type: A      Name: @      Value: 76.76.21.21"
  echo "  Type: CNAME  Name: www    Value: cname.vercel-dns.com"

  echo -e "\nربط api.${DOMAIN} بـ Railway..."
  cd "$BACKEND_DIR"
  railway domain add "api.${DOMAIN}" || warn "أضف هذا يدوياً من لوحة Railway"
else
  warn "تم تخطي ربط الدومين. يمكنك تنفيذه لاحقاً بنفس الأوامر."
fi

# ════════════════════════════════════════════════════════════
# 6) التحقق النهائي
# ════════════════════════════════════════════════════════════
step "التحقق من نجاح النشر"

echo "فحص الباك إند..."
if curl -sf "${BACKEND_URL}/api/v1/clinics" >/dev/null 2>&1; then
  ok "الباك إند يستجيب بنجاح ✓"
else
  warn "الباك إند لا يستجيب بعد — قد يحتاج دقيقة إضافية للإقلاع"
fi

echo "فحص الفرونت إند..."
if [ -n "$FRONTEND_URL" ] && curl -sfI "$FRONTEND_URL" >/dev/null 2>&1; then
  ok "الفرونت إند يستجيب بنجاح ✓"
else
  warn "تحقق من الفرونت إند يدوياً في المتصفح"
fi

# ════════════════════════════════════════════════════════════
# الملخص النهائي
# ════════════════════════════════════════════════════════════
step "🎉 اكتمل النشر — ملخص الروابط"

cat << EOF

  ${GREEN}Backend API:${NC}      ${BACKEND_URL}/api
  ${GREEN}Swagger Docs:${NC}     ${BACKEND_URL}/api/docs
  ${GREEN}Frontend:${NC}         ${FRONTEND_URL}
  ${GREEN}Domain (إذا رُبط):${NC}  https://${DOMAIN}

  ${YELLOW}الخطوات التالية:${NC}
  1. سجّل أول حساب Admin عبر Swagger (POST /api/v1/auth/register)
  2. أضف مفاتيح Twilio و SendGrid عند الحاجة الفعلية:
     railway variables set TWILIO_ACCOUNT_SID="..."
     railway variables set SENDGRID_API_KEY="..."
  3. راجع dashboard.railway.app و vercel.com/dashboard للمراقبة

EOF

ok "Evoline MedSlot جاهز للعمل! 🚀"
