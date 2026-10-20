# PCM Vận Hành - Auto Setup cho Windows + XAMPP
# Chạy: powershell -ExecutionPolicy Bypass -File .\setup.ps1
#
# Script này sẽ:
#   1. Kiểm tra Node.js và MySQL/MariaDB của XAMPP
#   2. Kết nối MySQL bằng user root (hỏi mật khẩu, cho nhập lại 3 lần)
#   3. Tạo database pcm_vanhanh + pcm_vanhanh_test
#   4. Sinh file .env (không ghi BOM, an toàn với dotenv)
#   5. Cài dependency, chạy migration, tạo tài khoản admin
#   6. Khởi động Next.js ở chế độ dev
#
# Không dùng script này nếu bạn muốn tự cấu hình .env bằng tay:
# xem docs/CHAY-LAN-DAU.md.

param(
    [string]$MySqlBin = "C:\xampp\mysql\bin",
    [switch]$NoStart
)

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
Set-Location $projectRoot

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Fail([string]$Message) {
    Write-Host "LỖI: $Message" -ForegroundColor Red
    exit 1
}

function ConvertTo-EnvValue([string]$Value) {
    if ($Value -match '[#\s"''\\]') {
        return '"' + ($Value -replace '\\', '\\\\' -replace '"', '\"') + '"'
    }
    return $Value
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PCM Vận Hành - Auto Setup (XAMPP)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# 1. Node.js
# ---------------------------------------------------------------------------
Write-Step "[1/6] Kiểm tra Node.js"
try {
    $nodeVersion = (& node --version).Trim()
} catch {
    Fail "Không tìm thấy Node.js. Cài Node.js 22 LTS từ https://nodejs.org rồi chạy lại."
}
if ($nodeVersion -notmatch '^v(\d+)\.(\d+)\.') {
    Fail "Không đọc được phiên bản Node.js ($nodeVersion)."
}
$nodeMajor = [int]$Matches[1]
$nodeMinor = [int]$Matches[2]
if ($nodeMajor -lt 22 -or ($nodeMajor -eq 22 -and $nodeMinor -lt 5)) {
    Fail "Cần Node.js >= 22.5.0 (hiện tại $nodeVersion). Cài Node.js 22 LTS rồi chạy lại."
}
Write-Host "  Node.js $nodeVersion - OK" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 2. MySQL/MariaDB của XAMPP
# ---------------------------------------------------------------------------
Write-Step "[2/6] Kiểm tra MySQL/MariaDB (XAMPP)"
$mysqlExe = Join-Path $MySqlBin "mysql.exe"
if (-not (Test-Path $mysqlExe)) {
    Fail "Không tìm thấy $mysqlExe. Bật XAMPP Control Panel và kiểm tra thư mục cài XAMPP."
}
$env:Path = "$MySqlBin;$env:Path"

$mysqlPasswordPlain = ""
$connected = $false
for ($attempt = 1; $attempt -le 3; $attempt++) {
    $secure = Read-Host "  Mật khẩu user root MySQL (lần $attempt/3, để trống nếu chưa đặt)" -AsSecureString
    $mysqlPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    )

    if ([string]::IsNullOrEmpty($mysqlPasswordPlain)) {
        & mysql -u root -e "SELECT 1" 2>&1 | Out-Null
    } else {
        & mysql -u root "-p$mysqlPasswordPlain" -e "SELECT 1" 2>&1 | Out-Null
    }

    if ($LASTEXITCODE -eq 0) {
        $connected = $true
        break
    }
    Write-Host "  Không kết nối được. Kiểm tra MySQL đã Start trong XAMPP chưa và mật khẩu đúng chưa." -ForegroundColor Yellow
}
if (-not $connected) {
    Fail "Không kết nối được MySQL sau 3 lần thử. Mở XAMPP Control Panel, bấm Start ở dòng MySQL."
}
Write-Host "  Kết nối MySQL - OK" -ForegroundColor Green

$mysqlArgs = @("-u", "root")
if (-not [string]::IsNullOrEmpty($mysqlPasswordPlain)) { $mysqlArgs += "-p$mysqlPasswordPlain" }

# ---------------------------------------------------------------------------
# 3. Tạo database
# ---------------------------------------------------------------------------
Write-Step "[3/6] Tạo database"
$sqlFile = Join-Path $projectRoot "scripts\create-database.sql"
if (-not (Test-Path $sqlFile)) { Fail "Không tìm thấy $sqlFile" }
Get-Content $sqlFile -Raw | & mysql @mysqlArgs 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "Tạo database thất bại. Kiểm tra quyền của user root." }
Write-Host "  Đã tạo (hoặc giữ nguyên) pcm_vanhanh và pcm_vanhanh_test" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 4. Sinh .env
# ---------------------------------------------------------------------------
Write-Step "[4/6] Tạo file .env"
if (Test-Path ".env") {
    $answer = Read-Host "  .env đã tồn tại. Ghi đè? (y/N)"
    if ($answer -notmatch '^(y|yes)$') {
        Write-Host "  Giữ nguyên .env hiện có." -ForegroundColor Yellow
    } else {
        Remove-Item ".env" -Force
    }
}

if (-not (Test-Path ".env")) {
    $adminName = Read-Host "  Họ tên admin (Enter để dùng 'Administrator')"
    if ([string]::IsNullOrWhiteSpace($adminName)) { $adminName = "Administrator" }

    $adminUsername = Read-Host "  Tên đăng nhập admin (Enter để dùng 'admin')"
    if ([string]::IsNullOrWhiteSpace($adminUsername)) { $adminUsername = "admin" }
    $adminUsername = $adminUsername.Trim().ToLowerInvariant()

    $adminEmail = Read-Host "  Email admin (Enter để dùng 'admin@localhost')"
    if ([string]::IsNullOrWhiteSpace($adminEmail)) { $adminEmail = "admin@localhost" }

    $adminPhone = Read-Host "  Số điện thoại admin (Enter để dùng '0901234567')"
    if ([string]::IsNullOrWhiteSpace($adminPhone)) { $adminPhone = "0901234567" }

    $secureAdminPassword = Read-Host "  Mật khẩu admin (Enter để sinh ngẫu nhiên)" -AsSecureString
    $adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAdminPassword)
    )
    if ([string]::IsNullOrWhiteSpace($adminPassword)) {
        $chars = (48..57) + (65..90) + (97..122)
        $adminPassword = -join (1..16 | ForEach-Object { [char]($chars | Get-Random) })
        Write-Host "  Mật khẩu admin ngẫu nhiên: $adminPassword" -ForegroundColor Yellow
        Write-Host "  (đã ghi vào .env - hãy lưu lại và đổi sau khi đăng nhập)" -ForegroundColor Yellow
    }

    $encodedDbPassword = [uri]::EscapeDataString($mysqlPasswordPlain)
    $databaseUrl = "mysql://root:$encodedDbPassword@localhost:3306/pcm_vanhanh"

    $envContent = @"
# Sinh tự động bởi setup.ps1 - KHÔNG commit file này.
DATABASE_URL=$databaseUrl
DB_POOL_MAX=10
GOOGLE_MAPS_API_KEY=
PUBLIC_DOMAIN=localhost
# Để trống = không tin header IP nào (an toàn mặc định).
# Điền "x-forwarded-for" nếu deploy sau reverse proxy Caddy.
TRUSTED_PROXY_HEADERS=

ADMIN_NAME=$(ConvertTo-EnvValue $adminName)
ADMIN_EMAIL=$(ConvertTo-EnvValue $adminEmail)
ADMIN_USERNAME=$(ConvertTo-EnvValue $adminUsername)
ADMIN_PASSWORD=$(ConvertTo-EnvValue $adminPassword)
ADMIN_PHONE=$(ConvertTo-EnvValue $adminPhone)
"@

    # UTF8Encoding($false) = UTF-8 không BOM. BOM ở đầu file làm hỏng key đầu tiên
    # (DATABASE_URL) khi dotenv đọc .env trên Windows PowerShell 5.1.
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Join-Path $projectRoot ".env"), $envContent + "`r`n", $utf8NoBom)
    Write-Host "  Đã tạo .env" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 5. Cài dependency + migrate + admin
# ---------------------------------------------------------------------------
Write-Step "[5/6] Cài dependency và khởi tạo database"
if (-not (Test-Path "node_modules")) {
    & npm ci
    if ($LASTEXITCODE -ne 0) { Fail "npm ci thất bại. Kiểm tra kết nối mạng và phiên bản Node.js." }
} else {
    Write-Host "  node_modules đã tồn tại - bỏ qua npm ci" -ForegroundColor Green
}

& npm run db:migrate
if ($LASTEXITCODE -ne 0) { Fail "Migration thất bại. Xem lỗi phía trên." }

& npm run db:admin
if ($LASTEXITCODE -ne 0) { Fail "Tạo tài khoản admin thất bại. Kiểm tra ADMIN_* trong .env." }

# ---------------------------------------------------------------------------
# 6. Chạy app
# ---------------------------------------------------------------------------
Write-Step "[6/6] Hoàn tất"
Write-Host ""
Write-Host "  Mở: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Đăng nhập bằng ADMIN_USERNAME / ADMIN_PASSWORD trong .env" -ForegroundColor Cyan
Write-Host "  Đổi mật khẩu admin ngay sau lần đăng nhập đầu tiên." -ForegroundColor Yellow
Write-Host ""

if (-not $NoStart) {
    Write-Host "  Nhấn Enter để chạy npm run dev (Ctrl+C để dừng)..." -ForegroundColor Yellow
    Read-Host | Out-Null
    & npm run dev
}
