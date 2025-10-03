Write-Host "Fixing GitHub Sync Issues" -ForegroundColor Green

Write-Host "Current situation: Branch diverged with Azure workflow conflict" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1: Fetch latest changes" -ForegroundColor Cyan
git fetch origin

Write-Host ""
Write-Host "Step 2: Create backup of current work" -ForegroundColor Cyan
git branch backup-before-sync

Write-Host ""
Write-Host "Step 3: Reset to match remote (keeping local changes)" -ForegroundColor Cyan
git reset --soft origin/main

Write-Host ""
Write-Host "Step 4: Check what needs to be committed" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "Step 5: Add all changes" -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "Step 6: Commit with proper message" -ForegroundColor Cyan
git commit -m "Sync with Azure workflow and add revenue stream automation

- Add SaaS platform launch scripts
- Add marketing automation tools  
- Add revenue stream activation
- Add eBay credential management scripts
- Integrate with Azure Static Web Apps workflow"

Write-Host ""
Write-Host "Step 7: Push to GitHub" -ForegroundColor Cyan
git push origin main

Write-Host ""
Write-Host "GitHub sync completed!" -ForegroundColor Green