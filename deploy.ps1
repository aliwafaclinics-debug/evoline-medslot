# ════════════════════════════════════════════════════════════════════════════════════
#  Evoline MedSlot — سكريت النشر التلقائي
#  Railway (Backend + PostgreSQL) + Vercel (Frontend)
# ════════════════════════════════════════════════════════════════════════════════════
#
# الاستخدام:
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#   .\deploy.ps1
#
# المتطلبات:
#   - Node.js 20+
#   - حساب Railway (railway.app)
#   - حساب Vercel (vercel.com)
#
# ════════════════════════════════════════════════════════════════════════════════════

param(
    [switch]$SkipLogin = $false,
    [switch]$SkipBackend = $false,
    [switch]$SkipFrontend = $false
)

# ──── Colors for output ────
$Colors = @{
    Green  = "Green"
    Blue   = "Cyan"
    Yellow = "Yellow"
    Red    = "Red"
}

function Step { 
    Write-Host "`n▶ $($args -join ' ')" -ForegroundColor $Colors.Blue
}

function Ok { 
    Write-Host "✅ $($args -join ' ')" -ForegroundColor $Colors.Green
}

function Warn { 
    Write-Host "⚠️ $($args -join ' ')" -ForegroundColor $Colors.Yellow
}

function Err { 
    Write-Host "❌ $($args -join ' ')" -ForegroundColor $Colors.Red
}

# ════════════════════════════════════════════════════════════════════════════════════
# 0) فحص المتطلبات الأساسية
# ════════════════════════════════════════════════════════════════════════════════════
Step "فحص المتطلبات الأساسية"

# Check Node.js
$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
    Err "Node.js غير مثبت. ثبّه من nodejs.org"
    exit 1
}
Ok "Node.js موجود: $nodeVersion"

# Check npm
$npmVersion = npm -v 2>$null
if (-not $npmVersion) {
    Err "npm غير مثبت"
    exit 1
}
Ok "npm موجود: $npmVersion"

# Check/Install Railway CLI
$railwayExists = railway --version 2>$null
if (-not $railwayExists) {
    Warn "Railway CLI غير مثبت – جاري التثبيت..."
    npm install -g @railway/cli
}
Ok "Railway CLI جاهز"

# Check/Install Vercel CLI
$vercelExists = vercel --version 2>$null
if (-not $vercelExists) {
    Warn "Vercel CLI غير مثبت – جاري التثبيت..."
    npm install -g vercel
}
Ok "Vercel CLI جاهز"

# Check database schema
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbSchema = Join-Path $scriptDir "database" "evoline_medslot_schema_simplified.sql"
if (-not (Test-Path $dbSchema)) {
    Err "ملف السكيما غير موجود في: $dbSchema"
    exit 1
}
Ok "ملف قاعدة البيانات موجود"

# ════════════════════════════════════════════════════════════════════════════════════
# 1) تسجيل الدخول
# ════════════════════════════════════════════════════════════════════════════════════
if (-not $SkipLogin) {
    Step "تسجيل الدخول إلى Railway و Vercel"

    Write-Host "سيُفتح متصفح لتسجيل الدخول إلى Railway..."
    Start-Sleep -Seconds 2
    railway login

    Write-Host "`nسيُفتح متصفح لتسجيل الدخول إلى Vercel..."
    Start-Sleep -Seconds 2
    vercel login

    Ok "تم تسجيل الدخول بنجاح"
}

# ════════════════════════════════════════════════════════════════════════════════════
# 2) نشر الباك إند على Railway
# ════════════════════════════════════════════════════════════════════════════════════
if (-not $SkipBackend) {
    Step "إعداد ونشر الباك إند على Railway"

    $backendDir = Join-Path $scriptDir "apps" "backend"
    Push-Location $backendDir

    # Initialize Railway project
    if (-not (Test-Path ".railway" -or (Test-Path "railway.json"))) {
        Write-Host "إنشاء مشروع Railway جديد..."
        railway init --name "evoline-medslot-backend"
    } else {
        Warn "مشروع Railway موجود مسبقاً – سيتم استخدامه"
    }

    # Add PostgreSQL plugin
    Write-Host "إضافة قاعدة بيانات PostgreSQL..."
    railway add --plugin postgresql 2>$null || Warn "قد تكون قاعدة البيانات مضافة مسبقاً"

    # Generate secure JWT secrets
    Write-Host "توليد مفاتيح أمان عشوائية..."
    $jwtAccess = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    $jwtRefresh = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

    # Set environment variables
    Write-Host "إعداد متغيرات البيئة..."
    railway variables set NODE_ENV="production"
    railway variables set PORT="3001"
    railway variables set JWT_ACCESS_SECRET="$jwtAccess"
    railway variables set JWT_REFRESH_SECRET="$jwtRefresh"
    railway variables set JWT_ACCESS_EXPIRES_IN="15m"
    railway variables set JWT_REFRESH_EXPIRES_IN="30d"
    railway variables set FRONTEND_URL="https://evolinemedslot.ae"

    Ok "متغيرات البيئة جُهزّت (المفاتيح محفوظة بأمان في Railway)"

    # Deploy
    Write-Host "نشر الباك إند..."
    railway up --detach

    Ok "تم رفع الباك إند"

    # Get backend URL
    Write-Host "الحصول على رابط الباك إند..."
    Start-Sleep -Seconds 5
    $backendUrl = railway domain 2>$null | Select-String -Pattern 'https?://[^ ]+' | ForEach-Object { $_.Matches[0].Value }

    if (-not $backendUrl) {
        Warn "لم يتم استخراج رابط الباك إند تلقائياً. استخدم:"
        Write-Host "  railway domain`n"
        $backendUrl = Read-Host "أدخل رابط الباك إند يدوياً (مثل https://xxx.up.railway.app)"
    }

    Ok "رابط الباك إند: $backendUrl"

    Pop-Location
}

# ════════════════════════════════════════════════════════════════════════════════════
# 3) تشغيل سكيما قاعدة البيانات
# ════════════════════════════════════════════════════════════════════════════════════
Step "تشغيل سكيما قاعدة البيانات"

if (Get-Command psql -ErrorAction SilentlyContinue) {
    $dbUrl = railway variables get DATABASE_URL 2>$null
    if ($dbUrl) {
        Write-Host "تشغيل ملف السكيما على قاعدة البيانات..."
        & psql $dbUrl -f $dbSchema
        Ok "تم إنشاء الجداول بنجاح"
    } else {
        Warn "لم يتم العثور على DATABASE_URL. شغّل يدوياً:"
        Write-Host "  psql `"(railway variables get DATABASE_URL)`" -f $dbSchema"
    }
} else {
    Warn "psql غير مثبت محلياً. شغّل يدوياً بعد تثبيت PostgreSQL:"
    Write-Host "  psql `"(railway variables get DATABASE_URL)`" -f $dbSchema"
}

# ════════════════════════════════════════════════════════════════════════════════════
# 4) نشر الفرونت إند على Vercel
# ════════════════════════════════════════════════════════════════════════════════════
if (-not $SkipFrontend) {
    Step "إعداد ونشر الفرونت إند على Vercel"

    $frontendDir = Join-Path $scriptDir "apps" "frontend"
    Push-Location $frontendDir

    # Create .env.production
    Write-Host "إنشاء ملف البيئة للإنتاج..."
    if (-not $backendUrl) {
        $backendUrl = Read-Host "أدخل رابط الباك إند (مثل https://xxx.up.railway.app)"
    }

    "NEXT_PUBLIC_API_URL=${backendUrl}/api" | Out-File -FilePath ".env.production" -Encoding utf8
    Ok "تم إنشاء .env.production"

    # Deploy to Vercel
    Write-Host "نشر الفرونت إند على Vercel..."
    vercel --prod --yes --name "evoline-medslot"

    Ok "تم نشر الفرونت إند"

    $frontendUrl = vercel ls "evoline-medslot" 2>$null | Select-String -Pattern 'https?://[^ ]+\.vercel\.app' | ForEach-Object { $_.Matches[0].Value } | Select-Object -First 1
    if ($frontendUrl) {
        Ok "رابط الفرونت إند: $frontendUrl"
    } else {
        Warn "تحقق من رابط الفرونت إند في لوحة Vercel"
    }

    Pop-Location
}

# ════════════════════════════════════════════════════════════════════════════════════
# 5) ربط الدومين (اختياري)
# ════════════════════════════════════════════════════════════════════════════════════
Step "ربط الدومين المخصص (اختياري)"

$linkDomain = Read-Host "هل تريد ربط دومين evolinemedslot.ae الآن (y/n)"

if ($linkDomain -eq "y" -or $linkDomain -eq "Y") {
    Write-Host "ربط evolinemedslot.ae بـ Vercel..."
    vercel domains add "evolinemedslot.ae" --yes 2>$null || Warn "فشل ربط الدومين – راجع لوحة Vercel"

    Write-Host "`n$([char]0x26a0) أضف سجلات DNS هذه عند مزود الدومين:"
    Write-Host "  Type: A      Name: @      Value: 76.76.21.21" -ForegroundColor Yellow
    Write-Host "  Type: CNAME  Name: www    Value: cname.vercel-dns.com" -ForegroundColor Yellow

    Write-Host "`nربط api.evolinemedslot.ae بـ Railway..."
    $backendDir = Join-Path $scriptDir "apps" "backend"
    Push-Location $backendDir
    railway domain add "api.evolinemedslot.ae" 2>$null || Warn "أضف هذا يدوياً من لوحة Railway"
    Pop-Location
} else {
    Warn "تم تخطي ربط الدومين. يمكنك تنفيذه لاحقاً بنفس الأوامر."
}

# ════════════════════════════════════════════════════════════════════════════════════
# 6) التحقق النهائي
# ════════════════════════════════════════════════════════════════════════════════════
Step "التحقق من نجاح النشر"

Write-Host "فحص الباك إند..."
try {
    $response = Invoke-WebRequest -Uri "${backendUrl}/api/v1/clinics" -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Ok "الباك إند يستجيب بنجاح ✓"
    }
} catch {
    Warn "الباك إند لا يستجيب بعد – قد يحتاج دقيقة إضافية للإقلاع"
}

if ($frontendUrl) {
    Write-Host "فحص الفرونت إند..."
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Ok "الفرونت إند يستجيب بنجاح ✓"
        }
    } catch {
        Warn "تحقق من الفرونت إند في المتصفح"
    }
}

# ════════════════════════════════════════════════════════════════════════════════════
# الملخص النهائي
# ════════════════════════════════════════════════════════════════════════════════════
Step "ملخص الروابط"

$summary = @"

  $(Write-Host "Backend API:" -ForegroundColor Green -NoNewline)      ${backendUrl}/api
  $(Write-Host "Swagger Docs:" -ForegroundColor Green -NoNewline)     ${backendUrl}/api/docs
  $(Write-Host "Frontend:" -ForegroundColor Green -NoNewline)         ${frontendUrl}
  $(Write-Host "Domain (إذا ربطت):" -ForegroundColor Green -NoNewline)  https://evolinemedslot.ae

  الخطوات التالية:
  1. سجّل أول حساب Admin عبر Swagger (POST /api/v1/auth/register)
  2. أضف مفاتيح Twilio و SendGrid عند الحاجة الفعلية:
     railway variables set TWILIO_ACCOUNT_SID="..."
     railway variables set SENDGRID_API_KEY="..."
  3. راجع dashboard.railway.app و vercel.com/dashboard للمراقبة

"@

Write-Host $summary
Ok "Evoline MedSlot جاهز للعمل! 🎉"
