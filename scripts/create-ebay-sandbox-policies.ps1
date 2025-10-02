# Create eBay Sandbox Policies
Write-Host "📋 Creating eBay Sandbox Policies" -ForegroundColor Green

# Get stored token
try {
    $tokenCmd = cmdkey /list:"HiddenHavenThreads_EBAY_ACCESS_TOKEN" 2>$null
    if (-not $tokenCmd) {
        Write-Host "❌ No eBay token found. Run update-ebay-sandbox.ps1 first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error accessing stored credentials." -ForegroundColor Red
    exit 1
}

$token = Read-Host "📋 Paste your eBay Sandbox User Token"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "X-EBAY-C-MARKETPLACE-ID" = "EBAY_US"
}

Write-Host "`n💳 Creating Payment Policy..." -ForegroundColor Yellow

$paymentPolicyData = @{
    name = "Sandbox Payment Policy"
    description = "Test payment policy for sandbox"
    marketplaceId = "EBAY_US"
    paymentMethods = @(
        @{
            paymentMethodType = "PAYPAL"
            recipientAccountReference = @{
                referenceId = "paypal-email"
                referenceType = "PAYPAL_EMAIL"
            }
        }
    )
    immediatePay = $false
} | ConvertTo-Json -Depth 10

try {
    $paymentResponse = Invoke-RestMethod -Uri "https://api.sandbox.ebay.com/sell/account/v1/payment_policy" -Headers $headers -Method POST -Body $paymentPolicyData
    Write-Host "✅ Payment Policy created: $($paymentResponse.paymentPolicyId)" -ForegroundColor Green
    
    # Store the policy ID
    cmdkey /generic:"HiddenHavenThreads_EBAY_PAYMENT_POLICY_ID" /user:"api" /pass:"$($paymentResponse.paymentPolicyId)" | Out-Null
} catch {
    Write-Host "⚠️ Payment Policy creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n🔄 Creating Return Policy..." -ForegroundColor Yellow

$returnPolicyData = @{
    name = "Sandbox Return Policy"
    description = "Test return policy for sandbox"
    marketplaceId = "EBAY_US"
    returnsAccepted = $true
    returnPeriod = @{
        value = 30
        unit = "DAY"
    }
    returnShippingCostPayer = "SELLER"
    returnMethod = "REPLACEMENT"
} | ConvertTo-Json -Depth 10

try {
    $returnResponse = Invoke-RestMethod -Uri "https://api.sandbox.ebay.com/sell/account/v1/return_policy" -Headers $headers -Method POST -Body $returnPolicyData
    Write-Host "✅ Return Policy created: $($returnResponse.returnPolicyId)" -ForegroundColor Green
    
    # Store the policy ID
    cmdkey /generic:"HiddenHavenThreads_EBAY_RETURN_POLICY_ID" /user:"api" /pass:"$($returnResponse.returnPolicyId)" | Out-Null
} catch {
    Write-Host "⚠️ Return Policy creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n📦 Creating Fulfillment Policy..." -ForegroundColor Yellow

$fulfillmentPolicyData = @{
    name = "Sandbox Fulfillment Policy"
    description = "Test fulfillment policy for sandbox"
    marketplaceId = "EBAY_US"
    categoryTypes = @(
        @{
            name = "ALL_EXCLUDING_MOTORS_VEHICLES"
            default = $true
        }
    )
    handlingTime = @{
        value = 1
        unit = "DAY"
    }
    shippingOptions = @(
        @{
            optionType = "DOMESTIC"
            costType = "FLAT_RATE"
            shippingServices = @(
                @{
                    sortOrder = 1
                    shippingCarrierCode = "USPS"
                    shippingServiceCode = "USPSGround"
                    shippingCost = @{
                        value = "5.99"
                        currency = "USD"
                    }
                    freeShipping = $false
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $fulfillmentResponse = Invoke-RestMethod -Uri "https://api.sandbox.ebay.com/sell/account/v1/fulfillment_policy" -Headers $headers -Method POST -Body $fulfillmentPolicyData
    Write-Host "✅ Fulfillment Policy created: $($fulfillmentResponse.fulfillmentPolicyId)" -ForegroundColor Green
    
    # Store the policy ID
    cmdkey /generic:"HiddenHavenThreads_EBAY_FULFILLMENT_POLICY_ID" /user:"api" /pass:"$($fulfillmentResponse.fulfillmentPolicyId)" | Out-Null
} catch {
    Write-Host "⚠️ Fulfillment Policy creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n🎉 Sandbox policies setup complete!" -ForegroundColor Green
Write-Host "You can now test listing items in the eBay sandbox environment." -ForegroundColor Cyan