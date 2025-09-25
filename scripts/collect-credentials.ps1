# Simple Credential Collection Script
# Step-by-step guide to get your API credentials

Write-Host "🔐 API Credential Collection Guide" -ForegroundColor Green
Write-Host "Follow these steps to get your credentials:`n" -ForegroundColor Cyan

# Function to securely store credentials
function Set-ApiCredential {
    param($Name, $Value)
    cmdkey /generic:"HiddenHavenThreads_$Name" /user:"api" /pass:"$Value" | Out-Null
    Write-Host "✅ Stored $Name securely" -ForegroundColor Green
}

Write-Host "📱 EBAY CREDENTIALS" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Gray
Write-Host "1. Go to: https://developer.ebay.com/" -ForegroundColor Yellow
Write-Host "2. Sign in with your eBay seller account" -ForegroundColor Yellow
Write-Host "3. Click 'My Account' → 'Keys'" -ForegroundColor Yellow
Write-Host "4. Look for the 'Production Keys' section" -ForegroundColor Yellow
Write-Host "5. Copy the following 4 values:`n" -ForegroundColor Yellow

$ebayAppId = Read-Host "📋 Paste your eBay App ID (Client ID)"
Set-ApiCredential "EBAY_APP_ID" $ebayAppId

$ebayDevId = Read-Host "📋 Paste your eBay Dev ID"
Set-ApiCredential "EBAY_DEV_ID" $ebayDevId

$ebayCertId = Read-Host "📋 Paste your eBay Cert ID (Client Secret)"
Set-ApiCredential "EBAY_CERT_ID" $ebayCertId

Write-Host "`n⚠️ For the User Token, you need to generate it:" -ForegroundColor Red
Write-Host "6. Click 'Get a User Token' button on the eBay developer page" -ForegroundColor Yellow
Write-Host "7. Sign in and authorize your app" -ForegroundColor Yellow
Write-Host "8. Copy the generated token" -ForegroundColor Yellow

$ebayToken = Read-Host "📋 Paste your eBay User Token"
Set-ApiCredential "EBAY_ACCESS_TOKEN" $ebayToken
Set-ApiCredential "EBAY_ENVIRONMENT" "production"

Write-Host "`n📘 FACEBOOK CREDENTIALS" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Gray
Write-Host "1. Go to: https://business.facebook.com/" -ForegroundColor Yellow
Write-Host "2. Navigate to Events Manager" -ForegroundColor Yellow
Write-Host "3. Click 'Connect Data Sources' → 'Web'" -ForegroundColor Yellow
Write-Host "4. Choose 'Conversions API'" -ForegroundColor Yellow
Write-Host "5. Select 'Partner Integration'" -ForegroundColor Yellow
Write-Host "6. You'll get these 3 values:`n" -ForegroundColor Yellow

$facebookToken = Read-Host "📋 Paste your Facebook Access Token"
Set-ApiCredential "FACEBOOK_ACCESS_TOKEN" $facebookToken

$pixelId = Read-Host "📋 Paste your Facebook Pixel ID (numbers only)"
Set-ApiCredential "FACEBOOK_PIXEL_ID" $pixelId

$conversionToken = Read-Host "📋 Paste your Facebook Conversion API Access Token"
Set-ApiCredential "FACEBOOK_CONVERSION_API_TOKEN" $conversionToken

Write-Host "`n🎨 ETSY CREDENTIALS" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Gray
Write-Host "1. Go to: https://www.etsy.com/developers/" -ForegroundColor Yellow
Write-Host "2. Create an app or use existing" -ForegroundColor Yellow
Write-Host "3. Get your OAuth token" -ForegroundColor Yellow

$etsyToken = Read-Host "📋 Paste your Etsy Access Token"
Set-ApiCredential "ETSY_ACCESS_TOKEN" $etsyToken

Write-Host "`n🤖 OPENAI CREDENTIALS" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Gray
Write-Host "1. Go to: https://platform.openai.com/api-keys" -ForegroundColor Yellow
Write-Host "2. Create a new API key" -ForegroundColor Yellow

$openaiKey = Read-Host "📋 Paste your OpenAI API Key"
Set-ApiCredential "OPENAI_API_KEY" $openaiKey

Write-Host "`n💰 PAYPAL EMAIL" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Gray
$paypalEmail = Read-Host "📋 Enter your PayPal email address"
Set-ApiCredential "PAYPAL_EMAIL" $paypalEmail

# Test eBay connection
Write-Host "`n🧪 Testing eBay Production Connection..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $ebayToken"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.ebay.com/sell/account/v1/payment_policy" -Headers $headers -Method GET
    Write-Host "✅ eBay Production API connection successful!" -ForegroundColor Green
    
    # Auto-fetch policy IDs
    Write-Host "📋 Auto-fetching your eBay policy IDs..." -ForegroundColor Yellow
    
    if ($response.paymentPolicies) {
        $paymentPolicy = $response.paymentPolicies[0]
        Write-Host "  💳 Payment Policy: $($paymentPolicy.name) - ID: $($paymentPolicy.paymentPolicyId)" -ForegroundColor Cyan
        Set-ApiCredential "EBAY_PAYMENT_POLICY_ID" $paymentPolicy.paymentPolicyId
    }
    
    $returnPolicies = Invoke-RestMethod -Uri "https://api.ebay.com/sell/account/v1/return_policy" -Headers $headers -Method GET
    if ($returnPolicies.returnPolicies) {
        $returnPolicy = $returnPolicies.returnPolicies[0]
        Write-Host "  🔄 Return Policy: $($returnPolicy.name) - ID: $($returnPolicy.returnPolicyId)" -ForegroundColor Cyan
        Set-ApiCredential "EBAY_RETURN_POLICY_ID" $returnPolicy.returnPolicyId
    }
    
    $fulfillmentPolicies = Invoke-RestMethod -Uri "https://api.ebay.com/sell/account/v1/fulfillment_policy" -Headers $headers -Method GET
    if ($fulfillmentPolicies.fulfillmentPolicies) {
        $fulfillmentPolicy = $fulfillmentPolicies.fulfillmentPolicies[0]
        Write-Host "  📦 Fulfillment Policy: $($fulfillmentPolicy.name) - ID: $($fulfillmentPolicy.fulfillmentPolicyId)" -ForegroundColor Cyan
        Set-ApiCredential "EBAY_FULFILLMENT_POLICY_ID" $fulfillmentPolicy.fulfillmentPolicyId
    }
    
} catch {
    Write-Host "❌ eBay connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please double-check your eBay credentials." -ForegroundColor Yellow
}

Write-Host "`n🎉 Credential collection complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: .\scripts\sync-credentials.ps1 -KeyVaultName 'your-keyvault-name'" -ForegroundColor Gray
Write-Host "  2. Test: .\scripts\quick-test.ps1 -FunctionAppUrl 'your-function-url'" -ForegroundColor Gray