Write-Host "Complete eBay Credential Setup" -ForegroundColor Green
Write-Host "This will set up both Production and Sandbox credentials" -ForegroundColor Cyan
Write-Host ""

# Production Setup
Write-Host "=== PRODUCTION CREDENTIALS ===" -ForegroundColor Magenta
Write-Host "Get from: https://developer.ebay.com/ -> Production Keys" -ForegroundColor Yellow
Write-Host ""

$prodAppId = Read-Host "Production App ID"
$prodDevId = Read-Host "Production Dev ID" 
$prodCertId = Read-Host "Production Cert ID"
$prodToken = Read-Host "Production User Token"

# Store Production
cmdkey /generic:"HiddenHavenThreads_PROD_EBAY_APP_ID" /user:"api" /pass:"$prodAppId"
cmdkey /generic:"HiddenHavenThreads_PROD_EBAY_DEV_ID" /user:"api" /pass:"$prodDevId"
cmdkey /generic:"HiddenHavenThreads_PROD_EBAY_CERT_ID" /user:"api" /pass:"$prodCertId"
cmdkey /generic:"HiddenHavenThreads_PROD_EBAY_ACCESS_TOKEN" /user:"api" /pass:"$prodToken"

Write-Host "Production credentials stored!" -ForegroundColor Green
Write-Host ""

# Sandbox Setup
Write-Host "=== SANDBOX CREDENTIALS ===" -ForegroundColor Magenta
Write-Host "Get from: https://developer.ebay.com/ -> Sandbox Keys" -ForegroundColor Yellow
Write-Host ""

$sandboxAppId = Read-Host "Sandbox App ID"
$sandboxDevId = Read-Host "Sandbox Dev ID"
$sandboxCertId = Read-Host "Sandbox Cert ID" 
$sandboxToken = Read-Host "Sandbox User Token"

# Store Sandbox
cmdkey /generic:"HiddenHavenThreads_SANDBOX_EBAY_APP_ID" /user:"api" /pass:"$sandboxAppId"
cmdkey /generic:"HiddenHavenThreads_SANDBOX_EBAY_DEV_ID" /user:"api" /pass:"$sandboxDevId"
cmdkey /generic:"HiddenHavenThreads_SANDBOX_EBAY_CERT_ID" /user:"api" /pass:"$sandboxCertId"
cmdkey /generic:"HiddenHavenThreads_SANDBOX_EBAY_ACCESS_TOKEN" /user:"api" /pass:"$sandboxToken"

Write-Host "Sandbox credentials stored!" -ForegroundColor Green
Write-Host ""

# Set Active Environment
Write-Host "Which environment do you want to use now?" -ForegroundColor Cyan
Write-Host "1 = Production" -ForegroundColor Yellow
Write-Host "2 = Sandbox" -ForegroundColor Yellow

$choice = Read-Host "Choose (1 or 2)"

if ($choice -eq "1") {
    # Set Production as active
    cmdkey /generic:"HiddenHavenThreads_EBAY_APP_ID" /user:"api" /pass:"$prodAppId"
    cmdkey /generic:"HiddenHavenThreads_EBAY_DEV_ID" /user:"api" /pass:"$prodDevId"
    cmdkey /generic:"HiddenHavenThreads_EBAY_CERT_ID" /user:"api" /pass:"$prodCertId"
    cmdkey /generic:"HiddenHavenThreads_EBAY_ACCESS_TOKEN" /user:"api" /pass:"$prodToken"
    cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"production"
    Write-Host "Active environment: PRODUCTION" -ForegroundColor Cyan
}
else {
    # Set Sandbox as active
    cmdkey /generic:"HiddenHavenThreads_EBAY_APP_ID" /user:"api" /pass:"$sandboxAppId"
    cmdkey /generic:"HiddenHavenThreads_EBAY_DEV_ID" /user:"api" /pass:"$sandboxDevId"
    cmdkey /generic:"HiddenHavenThreads_EBAY_CERT_ID" /user:"api" /pass:"$sandboxCertId"
    cmdkey /generic:"HiddenHavenThreads_EBAY_ACCESS_TOKEN" /user:"api" /pass:"$sandboxToken"
    cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"sandbox"
    Write-Host "Active environment: SANDBOX" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Both environments are stored and ready to use" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test connection: .\scripts\test-ebay-simple.ps1" -ForegroundColor Gray
Write-Host "Switch environments: .\scripts\switch-ebay-env.ps1" -ForegroundColor Gray