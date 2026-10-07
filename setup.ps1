# PCM Vận Hành - Auto Setup Script
# Chạy bằng PowerShell: .\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PCM Vận Hành - Auto Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Node.js
Write-Host "[1/7] Kiem tra Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  Node.js $nodeVersion - OK" -ForegroundColor Green
} catch {
    Write-Host "  Node.js khong tim thay! Vui long cai Node.js 22 LTS." -ForegroundColor Red
    exit 1
}

# Kiểm tra MySQL/MariaDB (XAMPP)
Write-Host "[2/7] Kiem tra MySQL/MariaDB..." -ForegroundColor Yellow
$mysqlBin = "C:\xampp\mysql\bin"
if (-not (Test-Path "$mysqlBin\mysql.exe")) {
    Write-Host "  MySQL khong tim thay tai $mysqlBin" -ForegroundColor Red
    exit 1
}
$env:Path = "$mysqlBin;$env:Path"
Write-Host "  MySQL/MariaDB - OK" -ForegroundColor Green

# Cai dat dependencies
Write-Host "[3/7] Cai dat npm dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  npm ci that bai!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  node_modules da ton tai" -ForegroundColor Green
}
Write-Host "  Dependencies OK" -ForegroundColor Green

# Nhap mat khau root MySQL (cho phep nhap lai neu sai)
Write-Host "[4/7] Ket noi MySQL..." -ForegroundColor Yellow
$maxAttempts = 3
$connected = $false

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    $mysqlPassword = Read-Host "  Nhap mat khau user root MySQL (lan $attempt/$maxAttempts, de trong neu khong co)" -AsSecureString
    $mysqlPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
    )

    # Thu ket noi
    if ([string]::IsNullOrEmpty($mysqlPasswordPlain)) {
        $testResult = mysql -u root -e "SELECT 1" 2>&1
    } else {
        $testResult = mysql -u root -p"$mysqlPasswordPlain" -e "SELECT 1" 2>&1
    }
    if ($LASTEXITCODE -eq 0) {
        $connected = $true
        Write-Host "  Ket noi MySQL thanh cong!" -ForegroundColor Green
        break
    } else {
        Write-Host "  Mat khau sai! Vui long thu lai." -ForegroundColor Red
    }
}

if (-not $connected) {
    Write-Host "  Khong the ket noi MySQL sau $maxAttempts lan thu." -ForegroundColor Red
    exit 1
}

$mysqlArgs = @("-u", "root")
if (-not [string]::IsNullOrEmpty($mysqlPasswordPlain)) { $mysqlArgs += "-p$mysqlPasswordPlain" }

# Tao database
Write-Host "  Tao database..." -ForegroundColor Yellow
mysql @mysqlArgs -e "CREATE DATABASE IF NOT EXISTS pcm_vanhanh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1 | Out-Null
Write-Host "  Database 'pcm_vanhanh' san sang" -ForegroundColor Green

# Cap nhat .env
Write-Host "[5/7] Cap nhat .env..." -ForegroundColor Yellow
$dbUrl = if ([string]::IsNullOrEmpty($mysqlPasswordPlain)) { "mysql://root:@localhost:3306/pcm_vanhanh" } else { "mysql://root:${mysqlPasswordPlain}@localhost:3306/pcm_vanhanh" }
$envContent = @"
DATABASE_URL=$dbUrl
PG_POOL_MAX=5
GOOGLE_MAPS_API_KEY=

ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@localhost
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@2026PCM
ADMIN_PHONE=0901234567
"@
$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "  .env da cap nhat (doi ADMIN_PASSWORD ngay sau khi dang nhap lan dau)" -ForegroundColor Green

# Chay migrations
Write-Host "[6/7] Chay database migrations..." -ForegroundColor Yellow
$env:DATABASE_URL = $dbUrl
npm run db:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Migration that bai!" -ForegroundColor Red
    exit 1
}
Write-Host "  Migrations OK" -ForegroundColor Green

# Tao admin user
Write-Host "  Tao admin user..." -ForegroundColor Yellow
npm run db:admin
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Tao admin that bai!" -ForegroundColor Red
    exit 1
}
Write-Host "  Admin user OK" -ForegroundColor Green

# Build va chay
Write-Host "[7/7] Build va chay ung dung..." -ForegroundColor Yellow
Write-Host "  Dang build (co the mat vai phut)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Build that bai!" -ForegroundColor Red
    exit 1
}
Write-Host "  Build OK" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup hoan tat!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Truy cap: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Admin: admin (mat khau trong .env - doi ngay sau lan dang nhap dau)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Nhan Enter de chay ung dung..." -ForegroundColor Yellow
Read-Host
npm run dev
