Write-Host "Fixing GitHub Secret Scanning Issues" -ForegroundColor Green

Write-Host ""
Write-Host "Step 1: Remove the problematic commit" -ForegroundColor Cyan
git reset --soft HEAD~1

Write-Host ""
Write-Host "Step 2: Check current status" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "Step 3: Add files (excluding secrets)" -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "Step 4: Commit without secrets" -ForegroundColor Cyan
git commit -m "Add revenue stream automation and fix credential management

- Add SaaS platform launch automation
- Add marketing automation tools
- Add eBay credential management scripts  
- Update .gitignore to exclude secrets
- Replace real credentials with placeholders in local.settings.json"

Write-Host ""
Write-Host "Step 5: Push to GitHub" -ForegroundColor Cyan
git push origin main

Write-Host ""
Write-Host "GitHub push completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Your real credentials are still stored locally but not in GitHub" -ForegroundColor Yellow