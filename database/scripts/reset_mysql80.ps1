<#
.SYNOPSIS
    Reset MySQL80 root password on port 3307 safely.
.DESCRIPTION
    Pure PowerShell 5.1-compatible script.
    - Preserves backup_mysql80_data
    - Does not touch MySQL91 (port 3306)
    - Uses masked password input (never printed or logged)
    - Uses official MySQL 8.0 --init-file procedure
    - Cleans up temporary SQL files immediately
    - Starts MySQL80 Windows service normally
    - Verifies authentication on port 3307
    - Updates C:\FSD\backend\.env only after verified authentication
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# 1. Admin check
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script must be run in an Administrator PowerShell window. Right-click PowerShell -> 'Run as Administrator'."
    exit 1
}

# 2. Check verified backup exists
$backupDir = "C:\ProgramData\MySQL\backup_mysql80_data"
if (-not (Test-Path $backupDir)) {
    Write-Error "Safety check failed: Cold backup directory not found at $backupDir. Aborting to protect data."
    exit 1
}
Write-Host "[1/7] Verified cold backup exists at $backupDir." -ForegroundColor Green

# 3. Check port 3307 is free
$portCheck = netstat -ano | Select-String ":3307\s"
if ($portCheck) {
    Write-Error "Safety check failed: Port 3307 is currently occupied. Ensure MySQL80 service is stopped."
    exit 1
}
Write-Host "[2/7] Port 3307 is free." -ForegroundColor Green

# 4. Confirm binaries and config
$mysqldPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$mysqladminPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqladmin.exe"
$mysqlCliPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$myIniPath = "C:\ProgramData\MySQL\MySQL Server 8.0-NewData\my.ini"

foreach ($f in @($mysqldPath, $mysqladminPath, $mysqlCliPath, $myIniPath)) {
    if (-not (Test-Path $f)) {
        Write-Error "Required MySQL80 file missing: $f"
        exit 1
    }
}
Write-Host "[3/7] Confirmed MySQL80 binaries and my.ini configuration." -ForegroundColor Green

# 5. Prompt for new password securely
$sec = Read-Host "Enter new MySQL80 root password (characters are hidden)" -AsSecureString
if (-not $sec -or $sec.Length -eq 0) {
    Write-Error "Password cannot be empty. Aborting."
    exit 1
}

$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$plainPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$initFile = "C:\ProgramData\MySQL\mysql80-init.sql"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

try {
    # 6. Write init file using pure .NET (no command-line quoting issues)
    $escapedSql = $plainPwd.Replace("'", "''")
    $sqlText = "ALTER USER 'root'@'localhost' IDENTIFIED BY '$escapedSql';`r`n"
    [System.IO.File]::WriteAllText($initFile, $sqlText, $utf8NoBom)
    Write-Host "[4/7] Temporary SQL init file created securely." -ForegroundColor Green

    # 7. Start temporary mysqld
    Write-Host "[5/7] Starting temporary mysqld to apply password reset..." -ForegroundColor Cyan
    $proc = Start-Process -FilePath $mysqldPath -ArgumentList "--defaults-file=`"$myIniPath`"", "--init-file=`"$initFile`"", "--console" -PassThru -WindowStyle Hidden

    $listening = $false
    for ($i = 0; $i -lt 35; $i++) {
        Start-Sleep -Seconds 1
        if ($proc.HasExited) {
            break
        }
        $check = netstat -ano | Select-String ":3307\s"
        if ($check) {
            $listening = $true
            break
        }
    }

    if (-not $listening) {
        Write-Error "Temporary mysqld failed to listen on port 3307 within 35 seconds (ExitCode: $($proc.ExitCode))."
        exit 1
    }
    Write-Host "Temporary mysqld is ready on port 3307. Reset statement applied." -ForegroundColor Green

    # 8. Shutdown temporary mysqld
    Write-Host "Shutting down temporary mysqld..." -ForegroundColor Cyan
    $env:MYSQL_PWD = $plainPwd
    & $mysqladminPath -h 127.0.0.1 -P 3307 -u root shutdown
    $proc.WaitForExit(15000) | Out-Null
    if (-not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}
finally {
    # Always clean up init file immediately
    if (Test-Path $initFile) {
        Remove-Item $initFile -Force -ErrorAction SilentlyContinue
        Write-Host "Temporary SQL init file deleted." -ForegroundColor Green
    }
}

# 9. Start normal Windows service
Write-Host "[6/7] Starting normal MySQL80 Windows Service..." -ForegroundColor Cyan
Start-Service -Name MySQL80
(Get-Service -Name MySQL80).WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
Write-Host "MySQL80 Windows service is running." -ForegroundColor Green

# 10. Verify authentication on port 3307
Write-Host "[7/7] Verifying root authentication on 127.0.0.1:3307..." -ForegroundColor Cyan
$env:MYSQL_PWD = $plainPwd
$verifyOutput = & $mysqlCliPath -h 127.0.0.1 -P 3307 -u root -e "SELECT 'AUTH_OK' AS status, VERSION() AS version;" 2>&1

if ($verifyOutput -notmatch "AUTH_OK") {
    Write-Error "Authentication verification failed on 127.0.0.1:3307. Output: $verifyOutput"
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "Authentication verified successfully on port 3307!" -ForegroundColor Green

# 11. Update backend .env securely
$envFilePath = "C:\FSD\backend\.env"
if (Test-Path $envFilePath) {
    $lines = [System.IO.File]::ReadAllLines($envFilePath)
    $escapedForEnv = $plainPwd.Replace('\', '\\').Replace('"', '\"')
    $newLines = foreach ($line in $lines) {
        if ($line.StartsWith("DB_PASSWORD=")) {
            "DB_PASSWORD=`"$escapedForEnv`""
        } else {
            $line
        }
    }
    [System.IO.File]::WriteAllLines($envFilePath, $newLines, $utf8NoBom)
    Write-Host "Updated DB_PASSWORD in $envFilePath." -ForegroundColor Green
}

# 12. Clean up memory
Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
$plainPwd = $null
$escapedSql = $null
$escapedForEnv = $null
$sec = $null

Write-Host "`n=== ALL STEPS COMPLETED SUCCESSFULLY ===" -ForegroundColor Green
Write-Host "MySQL80 root password has been reset, verified, and saved to backend/.env." -ForegroundColor Green
