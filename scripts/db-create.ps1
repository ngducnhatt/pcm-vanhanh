# PCM Van Hanh - Tao database XAMPP (phan rieng)
# Chay: powershell -ExecutionPolicy Bypass -File scripts/db-create.ps1
#   hoac: npm run db:create

$ErrorActionPreference = "Stop"

$mysqlBin = "C:\xampp\mysql\bin"
if (-not (Test-Path "$mysqlBin\mysql.exe")) {
    Write-Host "Khong tim thay MySQL tai $mysqlBin. Hay bat XAMPP Control Panel truoc." -ForegroundColor Red
    exit 1
}
$env:Path = "$mysqlBin;$env:Path"

# Nhap mat khau root (Enter neu khong co), cho nhap lai 3 lan
$mysqlPasswordPlain = ""
$connected = $false
for ($attempt = 1; $attempt -le 3; $attempt++) {
    $sec = Read-Host "Nhap mat khau user root MySQL (lan $attempt/3, de trong neu khong co)" -AsSecureString
    $mysqlPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    )
    if ([string]::IsNullOrEmpty($mysqlPasswordPlain)) {
        $testResult = mysql -u root -e "SELECT 1" 2>&1
    } else {
        $testResult = mysql -u root -p"$mysqlPasswordPlain" -e "SELECT 1" 2>&1
    }
    if ($LASTEXITCODE -eq 0) { $connected = $true; break }
    Write-Host "Mat khau sai! Thu lai." -ForegroundColor Red
}
if (-not $connected) {
    Write-Host "Khong ket noi duoc MySQL sau 3 lan thu." -ForegroundColor Red
    exit 1
}

$mysqlArgs = @("-u", "root")
if (-not [string]::IsNullOrEmpty($mysqlPasswordPlain)) { $mysqlArgs += "-p$mysqlPasswordPlain" }

# Chay file SQL rieng (giữ đúng charset utf8mb4)
$sqlFile = Join-Path $PSScriptRoot "create-database.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "Khong tim thay $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Dang tao database pcm_vanhanh + pcm_vanhanh_test..." -ForegroundColor Yellow
Get-Content $sqlFile -Raw | mysql @mysqlArgs 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tao database that bai!" -ForegroundColor Red
    exit 1
}

Write-Host "Xong! Da co 2 database: pcm_vanhanh, pcm_vanhanh_test (utf8mb4_unicode_ci)." -ForegroundColor Green
Write-Host "Buoc tiep theo: npm run db:migrate" -ForegroundColor Cyan
