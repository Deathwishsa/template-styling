# === Vite Deploy Script v1 - Interactive GitHub vs Domain ===
# Run this ONLY on the deploy machine. It promotes the current prod branch to
# the live branch as a built static site, then force-pushes live (which GitHub
# Pages serves). Mirrors the Angular deploy-to-live.ps1 flow, adapted for Vite.
#
# Optional parameter: -DeployType g|d  (skips the interactive prompt)
param(
    [string]$DeployType = ""
)

# Raise Node.js heap limit so the build doesn't OOM on large projects
$env:NODE_OPTIONS = "--max-old-space-size=4096"

Write-Host "🚀 Vite Deploy to Live - Starting (v1)..." -ForegroundColor Cyan

# 1. Stash any changes to the script / working tree
Write-Host "Step 1: Stashing working-tree changes..." -ForegroundColor Yellow
git stash push -m "temp stash" --include-untracked

# 2. Get latest prod
Write-Host "Step 2: Pulling latest prod..." -ForegroundColor Yellow
git checkout prod
git pull origin prod

# 3. Go to live and reset it to prod
Write-Host "Step 3: Resetting live to prod..." -ForegroundColor Yellow
git checkout live
git reset --hard prod

# 4. Install dependencies
Write-Host "Step 4: npm install..." -ForegroundColor Yellow
npm install --legacy-peer-deps

# === Choose deployment type ===
if (-not $DeployType) {
    Write-Host "`nIs this for GitHub Pages (subfolder) or Custom Domain?" -ForegroundColor Cyan
    Write-Host "Enter [g] for GitHub Pages or [d] for Custom Domain: " -NoNewline
    $DeployType = Read-Host
}

if ($DeployType -eq "g" -or $DeployType -eq "G") {
    $base = "/template-styling/"
    $deployTypeLabel = "GitHub"
    Write-Host "→ GitHub Pages mode selected (base = /template-styling/)" -ForegroundColor Yellow
}
else {
    $base = "/"
    $deployTypeLabel = "Domain"
    Write-Host "→ Custom Domain / Root mode selected (base = /)" -ForegroundColor Yellow
}

# 5. Build with the correct base path (Vite reads VITE_BASE in vite.config.ts)
Write-Host "Step 5: Building (Vite) with base '$base'..." -ForegroundColor Yellow
$env:VITE_BASE = $base
npm run build

# Check build (Vite emits a flat dist/ with index.html at its root)
if (-Not (Test-Path "dist/index.html")) {
    Write-Host "❌ Build failed - dist/index.html not found" -ForegroundColor Red
    if (-not $DeployType) { Read-Host "Press Enter to exit" }
    exit 1
}
Write-Host "✅ Build successful!" -ForegroundColor Green

# 6. Clean everything except this script + .git + dist + dotfiles
Write-Host "Step 6: Cleaning non-build files..." -ForegroundColor Yellow
Get-ChildItem -Path . | Where-Object {
    $_.Name -ne "deploy-to-live.ps1" -and
    $_.Name -ne ".git" -and
    $_.Name -ne "dist" -and
    $_.Name -notlike ".*"
} | Remove-Item -Recurse -Force

# 7. Copy the build output to the repo root
Write-Host "Step 7: Copying build to root..." -ForegroundColor Yellow
Copy-Item -Path "dist/*" -Destination . -Recurse -Force

# 8. Static-host fix (404 fallback for deep links + disable Jekyll)
Write-Host "Step 8: Creating 404.html + .nojekyll..." -ForegroundColor Yellow
Copy-Item -Path "index.html" -Destination "404.html" -Force
New-Item -ItemType File -Name ".nojekyll" -Force | Out-Null

# 9. Commit & Force Push live
Write-Host "Step 9: Committing & force pushing live..." -ForegroundColor Yellow
git add .
$commitMessage = "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $deployTypeLabel"
git commit -m $commitMessage
git push origin live --force

git stash pop -q 2>$null

Write-Host "`n🎉 SUCCESS! Deployment completed." -ForegroundColor Green
Write-Host "Live site: https://deathwishsa.github.io/template-styling/" -ForegroundColor Magenta
Write-Host "GitHub live branch: https://github.com/Deathwishsa/template-styling/tree/live" -ForegroundColor Magenta

if (-not $DeployType) { Read-Host "`nPress Enter to close window" }
