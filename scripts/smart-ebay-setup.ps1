Write-Host "Smart eBay Credential Setup" -ForegroundColor Green
Write-Host "Checking existing credentials..." -ForegroundColor Cyan
Write-Host ""

# Check what's already stored
$existingCreds = cmdkey /list | findstr HiddenHavenThreads

Write-Host "Found existing credentials:" -ForegroundColor Yellow
$existingCreds | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host ""

# Check if we have production credentials
$hasProdAppId = $existingCreds | Select-String "EBAY_APP_ID"
$hasProdToken = $existingCreds | Select-String "EBAY_ACCESS_TOKEN"

if ($hasProdAppId -and $hasProdToken) {
    Write-Host "Production credentials found!" -ForegroundColor Green
    $setupProd = $false
} else {
    Write-Host "Need production credentials" -ForegroundColor Yellow
    $setupProd = $true
}

# Ask what to do
Write-Host ""
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host "1 = Add missing sandbox credentials only" -ForegroundColor Yellow
Write-Host "2 = Add both production and sandbox (full setup)" -ForegroundColor Yellow
Write-Host "3 = Just switch environment" -ForegroundColor Yellow

$choice = Read-Host "Choose (1, 2, or 3)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "=== SANDBOX CREDENTIALS ===" -ForegroundColor Magenta
    Write-Host "Enter your sandbox credentials:" -ForegroundColor Yellow
    
    $sandboxAppId = Read-Host "Sandbox App ID"
    $sandboxDevId = Read-Host "Sandbox Dev ID"
    $sandboxCertId = Read-Host "Sandbox Cert ID"
    $sandboxToken = Read-Host "Sandbox User Token"
    
    # Store sandbox with SANDBOX prefix
    cmdkey /generic:"HiddenHavenThreads_SANDBOX_EBAY_APP_ID" /user:"api" /pass:"$sandboxAppId"
    cmdkey /generic:"HiddenHavenThreads_SANDBOX_EBAY_DEV_ID" /user:"api" /pass:"$sandboxDevId"
    cmdkey /generic:"HiddenHavenThreads_SANDBOX_EBAY_CERT_ID" /user:"api" /pass:"$sandboxCertId"
    cmdkey /generic:"HiddenHavenThreads_SANDBOX_EBAY_ACCESS_TOKEN" /user:"api" /pass:"$sandboxToken"
    
    # Set sandbox as active
    cmdkey /generic:"HiddenHavenThreads_EBAY_APP_ID" /user:"api" /pass:"$sandboxAppId"
    cmdkey /generic:"HiddenHavenThreads_EBAY_DEV_ID" /user:"api" /pass:"$sandboxDevId"
    cmdkey /generic:"HiddenHavenThreads_EBAY_CERT_ID" /user:"api" /pass:"$sandboxCertId"
    cmdkey /generic:"HiddenHavenThreads_EBAY_ACCESS_TOKEN" /user:"api" /pass:"$sandboxToken"
    cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"sandbox"
    
    Write-Host "Sandbox setup complete and activated!" -ForegroundColor Green
}
elseif ($choice -eq "2") {
    # Full setup - run the complete script
    Write-Host "Running full setup..." -ForegroundColor Cyan
    & ".\scripts\setup-all-ebay-creds.ps1"
    return
}
elseif ($choice -eq "3") {
    # Just switch environment
    Write-Host "Which environment?" -ForegroundColor Cyan
    Write-Host "1 = Production" -ForegroundColor Yellow
    Write-Host "2 = Sandbox" -ForegroundColor Yellow
    
    $envChoice = Read-Host "Choose (1 or 2)"
    
    if ($envChoice -eq "1") {
        cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"production"
        Write-Host "Switched to PRODUCTION" -ForegroundColor Green
    } else {
        cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"sandbox"
        Write-Host "Switched to SANDBOX" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Test connection: .\scripts\test-ebay-simple.ps1" -ForegroundColor Gray