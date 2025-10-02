# Add eBay Credentials
Write-Host "🔧 Add eBay Credentials" -ForegroundColor Green

function Add-Credential {
    param($Name, $Value)
    cmdkey /generic:"HiddenHavenThreads_$Name" /user:"api" /pass:"$Value" | Out-Null
    Write-Host "✅ Added $Name" -ForegroundColor Green
}

Write-Host ""
Write-Host "Environment:" -ForegroundColor Cyan
Write-Host "1 = Production" -ForegroundColor Yellow
Write-Host "2 = Sandbox" -ForegroundColor Yellow

$choice = Read-Host "Choose (1 or 2)"

Write-Host ""
if ($choice -eq "1") {
    Write-Host "📱 PRODUCTION CREDENTIALS" -ForegroundColor Magenta
    $env = "production"
}
if ($choice -eq "2") {
    Write-Host "🧪 SANDBOX CREDENTIALS" -ForegroundColor Magenta
    $env = "sandbox"
}
if ($choice -ne "1" -and $choice -ne "2") {
    Write-Host "❌ Invalid choice" -ForegroundColor Red
    exit
}

Write-Host "Get from: https://developer.ebay.com/" -ForegroundColor Yellow
Write-Host ""

$appId = Read-Host "App ID"
if ($appId) { Add-Credential "EBAY_APP_ID" $appId }

$devId = Read-Host "Dev ID"
if ($devId) { Add-Credential "EBAY_DEV_ID" $devId }

$certId = Read-Host "Cert ID"
if ($certId) { Add-Credential "EBAY_CERT_ID" $certId }

$token = Read-Host "User Token"
if ($token) { Add-Credential "EBAY_ACCESS_TOKEN" $token }

Add-Credential "EBAY_ENVIRONMENT" $env

Write-Host ""
Write-Host "✅ Done! Environment: $env" -ForegroundColor Green
Write-Host "Test: .\scripts\test-ebay-connection.ps1" -ForegroundColor Cyan