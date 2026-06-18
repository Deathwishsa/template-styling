<#
.SYNOPSIS
    Hosts the Studio template on your local WiFi so you can view it on a phone / iPad.

.DESCRIPTION
    - Installs dependencies if needed.
    - Detects this machine's LAN IP address.
    - Prints the exact URL to open on another device on the same WiFi.
    - Starts the server bound to all network interfaces.

.PARAMETER Prod
    Serve the optimized production build (npm run build + vite preview)
    instead of the dev server. Slower to start, but mirrors the real site.

.EXAMPLE
    .\host.ps1
    .\host.ps1 -Prod
#>

[CmdletBinding()]
param(
    [switch]$Prod,
    # Serve plain HTTP. By default we serve HTTPS because phone motion sensors
    # (tilt / deviceorientation) only work in a secure context.
    [switch]$Http
)

$ErrorActionPreference = "Stop"

# Always operate from the script's own folder.
Set-Location -Path $PSScriptRoot

# HTTPS on by default (required for phone tilt). VITE_HTTPS is read by vite.config.
if ($Http) {
    $env:VITE_HTTPS = "0"
    $scheme = "http"
} else {
    $env:VITE_HTTPS = "1"
    $scheme = "https"
}

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }

# 1. Dependencies ------------------------------------------------------------
if (-not (Test-Path ".\node_modules")) {
    Write-Step "Installing dependencies (first run only)..."
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
}

# 2. Find the LAN IPv4 address ----------------------------------------------
# Prefer a Wi-Fi adapter; fall back to any private (RFC1918) address.
$candidates = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notlike "127.*" -and
        $_.IPAddress -notlike "169.254.*" -and
        (
            $_.IPAddress -like "192.168.*" -or
            $_.IPAddress -like "10.*" -or
            $_.IPAddress -match "^172\.(1[6-9]|2[0-9]|3[0-1])\."
        )
    }

$wifi = $candidates | Where-Object { $_.InterfaceAlias -match "Wi-?Fi|Wireless|WLAN" } | Select-Object -First 1
$chosen = if ($wifi) { $wifi } else { $candidates | Select-Object -First 1 }
$lanIp = if ($chosen) { $chosen.IPAddress } else { $null }

# 3. Port + mode -------------------------------------------------------------
if ($Prod) {
    $port = 4173    # vite preview default
    $mode = "PRODUCTION build"
} else {
    $port = 5173    # vite dev default
    $mode = "DEV server"
}

# 4. Show the URLs -----------------------------------------------------------
Write-Host ""
Write-Host "==================================================================" -ForegroundColor DarkGray
Write-Host "  Studio template - $mode" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor DarkGray
Write-Host "  On this PC : " -NoNewline; Write-Host "${scheme}://localhost:$port" -ForegroundColor Green
if ($lanIp) {
    Write-Host "  On phone   : " -NoNewline; Write-Host "${scheme}://${lanIp}:$port" -ForegroundColor Yellow
    Write-Host "               ^ open this on a device on the SAME WiFi"
} else {
    Write-Host "  Could not auto-detect a LAN IP. Read the 'Network:' URL that" -ForegroundColor Red
    Write-Host "  the server prints below instead." -ForegroundColor Red
}
Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
if ($scheme -eq "https") {
    Write-Host "  HTTPS is ON (needed for phone TILT / motion sensors)." -ForegroundColor DarkGray
    Write-Host "  The cert is self-signed, so your phone will warn 'Not secure'" -ForegroundColor DarkGray
    Write-Host "  -> tap Advanced > Proceed. (Use -Http to disable HTTPS.)" -ForegroundColor DarkGray
}
Write-Host "  First run? Windows may ask to allow Node.js on private" -ForegroundColor DarkGray
Write-Host "  networks - click ALLOW or phones can't connect." -ForegroundColor DarkGray
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor DarkGray
Write-Host "==================================================================" -ForegroundColor DarkGray
Write-Host ""

# 5. Start the server --------------------------------------------------------
# (HTTPS, when enabled, is applied by the basic-ssl plugin via VITE_HTTPS.)
if ($Prod) {
    Write-Step "Building optimized site..."
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed." }
    Write-Step "Serving production build over WiFi..."
    npx vite preview --host --port $port
} else {
    Write-Step "Starting dev server over WiFi..."
    npx vite --host --port $port
}
