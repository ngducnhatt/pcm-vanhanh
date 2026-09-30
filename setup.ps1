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

# Kiểm tra PostgreSQL
Write-Host "[2/7] Kiem tra PostgreSQL..." -ForegroundColor Yellow
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
if (-not (Test-Path "$pgBin\psql.exe")) {
    Write-Host "  PostgreSQL khong tim thay tai $pgBin" -ForegroundColor Red
    exit 1
}
$env:Path = "$pgBin;$env:Path"
Write-Host "  PostgreSQL 18 - OK" -ForegroundColor Green

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

# Nhap mat khau postgres (cho phep nhap lai neu sai)
Write-Host "[4/7] Ket noi PostgreSQL..." -ForegroundColor Yellow
$maxAttempts = 3
$connected = $false

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    $postgresPassword = Read-Host "  Nhap mat khau user postgres (lan $attempt/$maxAttempts)" -AsSecureString
    $postgresPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword)
    )
    
    $env:PGPASSWORD = $postgresPasswordPlain
    
    # Thu ket noi
    $testResult = psql -U postgres -d postgres -tAc "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $connected = $true
        Write-Host "  Ket noi PostgreSQL thanh cong!" -ForegroundColor Green
        break
    } else {
        Write-Host "  Mat khau sai! Vui long thu lai." -ForegroundColor Red
    }
}

if (-not $connected) {
    Write-Host "  Khong the ket noi PostgreSQL sau $maxAttempts lan thu." -ForegroundColor Red
    exit 1
}

# Tao database va user
Write-Host "  Tao database va user..." -ForegroundColor Yellow

# Kiem tra database da ton tai chua
$dbExists = psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='pcm_vanhanh'" 2>$null
if ($dbExists -ne "1") {
    psql -U postgres -d postgres -c "CREATE DATABASE pcm_vanhanh;" 2>&1 | Out-Null
    Write-Host "  Database 'pcm_vanhanh' da tao" -ForegroundColor Green
} else {
    Write-Host "  Database 'pcm_vanhanh' da ton tai" -ForegroundColor Green
}

# Kiem tra user pcm_app da ton tai chua
$userExists = psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='pcm_app'" 2>$null
if ($userExists -ne "1") {
    psql -U postgres -d postgres -c "CREATE USER pcm_app WITH PASSWORD 'pcm_app_password';" 2>&1 | Out-Null
    Write-Host "  User 'pcm_app' da tao" -ForegroundColor Green
} else {
    Write-Host "  User 'pcm_app' da ton tai" -ForegroundColor Green
}

# Cap quyen cho pcm_app tren database va schema public
Write-Host "  Cap quyen cho pcm_app..." -ForegroundColor Yellow
psql -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE pcm_vanhanh TO pcm_app;" 2>&1 | Out-Null
psql -U postgres -d pcm_vanhanh -c "GRANT ALL ON SCHEMA public TO pcm_app;" 2>&1 | Out-Null
psql -U postgres -d pcm_vanhanh -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pcm_app;" 2>&1 | Out-Null
Write-Host "  Quyen da cap" -ForegroundColor Green

# Cap nhat .env
Write-Host "[5/7] Cap nhat .env..." -ForegroundColor Yellow
$envContent = @"
DATABASE_URL=postgresql://pcm_app:pcm_app_password@localhost:5432/pcm_vanhanh
PG_POOL_MAX=5
GOOGLE_MAPS_API_KEY=

ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@localhost
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_PHONE=0901234567
"@
$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "  .env da cap nhat" -ForegroundColor Green

# Chay migrations
Write-Host "[6/7] Chay database migrations..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://pcm_app:pcm_app_password@localhost:5432/pcm_vanhanh"
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
Write-Host "  Admin: admin / admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Nhan Enter de chay ung dung..." -ForegroundColor Yellow
Read-Host
npm run dev
