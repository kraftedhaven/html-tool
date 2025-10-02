# Simple eBay Credential Setup
Write-Host "🔧 eBay Credential Setup" -ForegroundColor Green

function Set-Credential {
    param($Name, $Value)
    cmdkey /generic:"HiddenHavenThreads_$Name" /user:"api" /pass:"$Value" | Out-Null
    Write-Host "✅ Stored $Name" -ForegroundColor Green
}

Write-Host ""
Write-Host "Choose environment:" -ForegroundColor Cyan
Write-Host "1 = Production" -ForegroundColor Yellow
Write-Host "2 = Sandbox" -ForegroundColor Yellow

$env = Read-Host "Enter 1 or 2"

if ($env -eq "1") {
    Write-Host ""
    Write-Host "📱 PRODUCTION SETUP" -ForegroundColor Magenta
    $environment = "production"
}
elseif ($env -eq "2") {
    Write-Host ""
    Write-Host "🧪 SANDBOX SETUP" -ForegroundColor Magenta  
    $environment = "sandbox"
}
else {
    Write-Host "Invalid choice" -ForegroundColor Red
    exit
}

Write-Host "Get credentials from: https://developer.ebay.com/" -ForegroundColor Yellow
Write-Host ""

$appId = Read-Host "App ID (Client ID)"
if ($appId) { Set-Credential "EBAY_APP_ID" $appId }

$devId = Read-Host "Dev ID"  
if ($devId) { Set-Credential "EBAY_DEV_ID" $devId }

$certId = Read-Host "Cert ID (Client Secret)"
if ($certId) { Set-Credential "EBAY_CERT_ID" $certId }

$token = Read-Host "User Token"
if ($token) { Set-Credential "EBAY_ACCESS_TOKEN" $token }

Set-Credential "EBAY_ENVIRONMENT" $environment

Write-Host ""
Write-Host "✅ Setup complete for $environment!" -ForegroundColor Green
Write-Host "Test with: .\scripts\test-ebay-connection.ps1" -ForegroundColor Cyan