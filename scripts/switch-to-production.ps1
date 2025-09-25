# Quick script to switch eBay from sandbox to production
# Run this after sandbox testing is complete

Write-Host "🚀 Switching eBay to Production Mode" -ForegroundColor Green

# Function to securely store credentials
function Set-ApiCredential {
    param($Name, $Value)
    cmdkey /generic:"HiddenHavenThreads_$Name" /user:"api" /pass:"$Value" | Out-Null
    Write-Host "✅ Stored $Name securely" -ForegroundColor Green
}

# Function to get stored credentials
function Get-ApiCredential {
    param($Name)
    try {
        $cred = cmdkey /list:"HiddenHavenThreads_$Name" 2>$null
        if ($cred) {
            return "found"
        }
    } catch {
        return $null
    }
}

Write-Host "📋 Current eBay environment check..." -ForegroundColor Yellow

$currentEnv = Get-ApiCredential "EBAY_ENVIRONMENT"
if ($currentEnv) {
    Write-Host "✅ Found existing eBay configuration" -ForegroundColor Green
} else {
    Write-Host "⚠️ No existing eBay configuration found" -ForegroundColor Yellow
}

Write-Host "`n🔄 Switching to Production Environment..." -ForegroundColor Cyan

# Set production environment
Set-ApiCredential "EBAY_ENVIRONMENT" "production"

# Get production credentials
Write-Host "`n📝 Enter your eBay PRODUCTION credentials:" -ForegroundColor Magenta
Write-Host "⚠️ Make sure these are PRODUCTION keys, not sandbox!" -ForegroundColor Red

$prodToken = Read-Host "Enter your eBay PRODUCTION Access Token"
Set-ApiCredential "EBAY_ACCESS_TOKEN" $prodToken

$devId = Read-Host "Enter your eBay PRODUCTION Dev ID"
Set-ApiCredential "EBAY_DEV_ID" $devId

$appId = Read-Host "Enter your eBay PRODUCTION App ID"
Set-ApiCredential "EBAY_APP_ID" $appId

$certId = Read-Host "Enter your eBay PRODUCTION Cert ID"
Set-ApiCredential "EBAY_CERT_ID" $certId

# Test production connection
Write-Host "`n🧪 Testing production API connection..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $prodToken"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.ebay.com/sell/account/v1/payment_policy" -Headers $headers -Method GET
    Write-Host "✅ Production API connection successful!" -ForegroundColor Green
    
    # Get production policy IDs
    Write-Host "`n📋 Fetching production policy IDs..." -ForegroundColor Yellow
    
    if ($response.paymentPolicies) {
        $response.paymentPolicies | ForEach-Object {
            Write-Host "  💳 Payment Policy: $($_.name) - ID: $($_.paymentPolicyId)" -ForegroundColor Cyan
            Set-ApiCredential "EBAY_PAYMENT_POLICY_ID" $_.paymentPolicyId
        }
    }
    
    # Get return policies
    $returnPolicies = Invoke-RestMethod -Uri "https://api.ebay.com/sell/account/v1/return_policy" -Headers $headers -Method GET
    if ($returnPolicies.returnPolicies) {
        $returnPolicies.returnPolicies | ForEach-Object {
            Write-Host "  🔄 Return Policy: $($_.name) - ID: $($_.returnPolicyId)" -ForegroundColor Cyan
            Set-ApiCredential "EBAY_RETURN_POLICY_ID" $_.returnPolicyId
        }
    }
    
    # Get fulfillment policies
    $fulfillmentPolicies = Invoke-RestMethod -Uri "https://api.ebay.com/sell/account/v1/fulfillment_policy" -Headers $headers -Method GET
    if ($fulfillmentPolicies.fulfillmentPolicies) {
        $fulfillmentPolicies.fulfillmentPolicies | ForEach-Object {
            Write-Host "  📦 Fulfillment Policy: $($_.name) - ID: $($_.fulfillmentPolicyId)" -ForegroundColor Cyan
            Set-ApiCredential "EBAY_FULFILLMENT_POLICY_ID" $_.fulfillmentPolicyId
        }
    }
    
    Write-Host "`n🎉 Successfully switched to eBay Production!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\scripts\sync-credentials.ps1 -KeyVaultName 'your-keyvault'" -ForegroundColor Gray
    Write-Host "  2. Test with: .\scripts\quick-test.ps1" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Production API connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check your production credentials and try again." -ForegroundColor Yellow
}