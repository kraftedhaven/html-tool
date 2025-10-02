# Update eBay App to Sandbox Environment
Write-Host "🔧 Updating eBay App to Sandbox Environment" -ForegroundColor Green

# Function to securely store credentials
function Set-ApiCredential {
    param($Name, $Value)
    cmdkey /generic:"HiddenHavenThreads_$Name" /user:"api" /pass:"$Value" | Out-Null
    Write-Host "✅ Stored $Name securely" -ForegroundColor Green
}

Write-Host "📱 EBAY SANDBOX SETUP" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Gray
Write-Host "1. Go to: https://developer.ebay.com/" -ForegroundColor Yellow
Write-Host "2. Sign in with your eBay developer account" -ForegroundColor Yellow
Write-Host "3. Click 'My Account' → 'Keys'" -ForegroundColor Yellow
Write-Host "4. Look for the 'Sandbox Keys' section" -ForegroundColor Yellow
Write-Host "5. Copy the following values:`n" -ForegroundColor Yellow

$ebayAppId = Read-Host "📋 Paste your eBay Sandbox App ID (Client ID)"
Set-ApiCredential "EBAY_APP_ID" $ebayAppId

$ebayDevId = Read-Host "📋 Paste your eBay Sandbox Dev ID"
Set-ApiCredential "EBAY_DEV_ID" $ebayDevId

$ebayCertId = Read-Host "📋 Paste your eBay Sandbox Cert ID (Client Secret)"
Set-ApiCredential "EBAY_CERT_ID" $ebayCertId

Write-Host "`n⚠️ For the Sandbox User Token:" -ForegroundColor Red
Write-Host "6. Click 'Get a User Token' button in the SANDBOX section" -ForegroundColor Yellow
Write-Host "7. Sign in with your SANDBOX test user account" -ForegroundColor Yellow
Write-Host "8. Authorize your app" -ForegroundColor Yellow
Write-Host "9. Copy the generated token" -ForegroundColor Yellow

$ebayToken = Read-Host "📋 Paste your eBay Sandbox User Token"
Set-ApiCredential "EBAY_ACCESS_TOKEN" $ebayToken
Set-ApiCredential "EBAY_ENVIRONMENT" "sandbox"

# Test Sandbox connection
Write-Host "`n🧪 Testing eBay Sandbox Connection..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $ebayToken"
    "Content-Type" = "application/json"
    "X-EBAY-C-MARKETPLACE-ID" = "EBAY_US"
}

try {
    # Test with sandbox endpoint
    $response = Invoke-RestMethod -Uri "https://api.sandbox.ebay.com/sell/account/v1/privilege" -Headers $headers -Method GET
    Write-Host "✅ eBay Sandbox API connection successful!" -ForegroundColor Green
    Write-Host "User privileges: $($response.privileges -join ', ')" -ForegroundColor Cyan
    
    # Try to get policies from sandbox
    Write-Host "📋 Fetching sandbox policies..." -ForegroundColor Yellow
    
    try {
        $paymentPolicies = Invoke-RestMethod -Uri "https://api.sandbox.ebay.com/sell/account/v1/payment_policy" -Headers $headers -Method GET
        if ($paymentPolicies.paymentPolicies -and $paymentPolicies.paymentPolicies.Count -gt 0) {
            $paymentPolicy = $paymentPolicies.paymentPolicies[0]
            Write-Host "  💳 Payment Policy: $($paymentPolicy.name) - ID: $($paymentPolicy.paymentPolicyId)" -ForegroundColor Cyan
            Set-ApiCredential "EBAY_PAYMENT_POLICY_ID" $paymentPolicy.paymentPolicyId
        } else {
            Write-Host "  ⚠️ No payment policies found. You may need to create them in sandbox." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️ Could not fetch payment policies: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    try {
        $returnPolicies = Invoke-RestMethod -Uri "https://api.sandbox.ebay.com/sell/account/v1/return_policy" -Headers $headers -Method GET
        if ($returnPolicies.returnPolicies -and $returnPolicies.returnPolicies.Count -gt 0) {
            $returnPolicy = $returnPolicies.returnPolicies[0]
            Write-Host "  🔄 Return Policy: $($returnPolicy.name) - ID: $($returnPolicy.returnPolicyId)" -ForegroundColor Cyan
            Set-ApiCredential "EBAY_RETURN_POLICY_ID" $returnPolicy.returnPolicyId
        } else {
            Write-Host "  ⚠️ No return policies found. You may need to create them in sandbox." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️ Could not fetch return policies: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    try {
        $fulfillmentPolicies = Invoke-RestMethod -Uri "https://api.sandbox.ebay.com/sell/account/v1/fulfillment_policy" -Headers $headers -Method GET
        if ($fulfillmentPolicies.fulfillmentPolicies -and $fulfillmentPolicies.fulfillmentPolicies.Count -gt 0) {
            $fulfillmentPolicy = $fulfillmentPolicies.fulfillmentPolicies[0]
            Write-Host "  📦 Fulfillment Policy: $($fulfillmentPolicy.name) - ID: $($fulfillmentPolicy.fulfillmentPolicyId)" -ForegroundColor Cyan
            Set-ApiCredential "EBAY_FULFILLMENT_POLICY_ID" $fulfillmentPolicy.fulfillmentPolicyId
        } else {
            Write-Host "  ⚠️ No fulfillment policies found. You may need to create them in sandbox." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️ Could not fetch fulfillment policies: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ eBay Sandbox connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Make sure you're using SANDBOX credentials, not production" -ForegroundColor Gray
    Write-Host "  2. Verify the token was generated for sandbox environment" -ForegroundColor Gray
    Write-Host "  3. Check that your sandbox user account is properly set up" -ForegroundColor Gray
}

Write-Host "`n📝 Creating Sandbox Policies (if needed)..." -ForegroundColor Yellow
Write-Host "If you don't have policies, you can create them through:" -ForegroundColor Cyan
Write-Host "  1. eBay Seller Hub (sandbox): https://www.sandbox.ebay.com/sh/ovw" -ForegroundColor Gray
Write-Host "  2. Or use the API to create them programmatically" -ForegroundColor Gray

Write-Host "`n🎉 Sandbox setup complete!" -ForegroundColor Green
Write-Host "Your app is now configured for eBay Sandbox environment." -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Test listings in sandbox: .\scripts\test-ebay-connection.ps1" -ForegroundColor Gray
Write-Host "  2. Create test policies if needed" -ForegroundColor Gray
Write-Host "  3. Switch back to production when ready: .\scripts\collect-credentials.ps1" -ForegroundColor Gray