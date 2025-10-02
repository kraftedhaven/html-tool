# Simple eBay Sandbox Setup
Write-Host "🔧 Setting up eBay Sandbox Environment" -ForegroundColor Green

# Function to securely store credentials
function Set-ApiCredential {
    param($Name, $Value)
    cmdkey /generic:"HiddenHavenThreads_$Name" /user:"api" /pass:"$Value" | Out-Null
    Write-Host "✅ Stored $Name securely" -ForegroundColor Green
}

Write-Host ""
Write-Host "📱 EBAY SANDBOX CREDENTIALS" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Gray
Write-Host "Get these from: https://developer.ebay.com/" -ForegroundColor Yellow
Write-Host "Go to 'My Account' → 'Keys' → 'Sandbox Keys' section" -ForegroundColor Yellow
Write-Host ""

$ebayAppId = Read-Host "📋 Enter your eBay Sandbox App ID (Client ID)"
if ($ebayAppId) {
    Set-ApiCredential "EBAY_APP_ID" $ebayAppId
}

$ebayDevId = Read-Host "📋 Enter your eBay Sandbox Dev ID"
if ($ebayDevId) {
    Set-ApiCredential "EBAY_DEV_ID" $ebayDevId
}

$ebayCertId = Read-Host "📋 Enter your eBay Sandbox Cert ID (Client Secret)"
if ($ebayCertId) {
    Set-ApiCredential "EBAY_CERT_ID" $ebayCertId
}

Write-Host ""
Write-Host "⚠️ For the User Token:" -ForegroundColor Red
Write-Host "1. Click 'Get a User Token' in the SANDBOX section" -ForegroundColor Yellow
Write-Host "2. Sign in with your sandbox test account" -ForegroundColor Yellow
Write-Host "3. Authorize your app" -ForegroundColor Yellow

$ebayToken = Read-Host "📋 Enter your eBay Sandbox User Token"
if ($ebayToken) {
    Set-ApiCredential "EBAY_ACCESS_TOKEN" $ebayToken
    Set-ApiCredential "EBAY_ENVIRONMENT" "sandbox"
    
    Write-Host ""
    Write-Host "🧪 Testing connection..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $ebayToken"
        "Content-Type" = "application/json"
        "X-EBAY-C-MARKETPLACE-ID" = "EBAY_US"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.sandbox.ebay.com/sell/account/v1/privilege" -Headers $headers -Method GET
        Write-Host "✅ eBay Sandbox connection successful!" -ForegroundColor Green
        Write-Host "Privileges: $($response.privileges -join ', ')" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Make sure you're using sandbox credentials" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host "Next: Run .\scripts\test-ebay-connection.ps1 to verify" -ForegroundColor Cyan