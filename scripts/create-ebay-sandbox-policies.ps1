# Create eBay Sandbox Policies
Write-Host "Creating eBay Sandbox Policies..."

# Get stored token
$cred = cmdkey /list:HiddenHavenThreads_EBAY_ACCESS_TOKEN
if ($LASTEXITCODE -ne 0) {
    Write-Host "Could not find stored eBay credentials. Please run update-ebay-sandbox.ps1 first."
    exit 1
}

$tokenLine = $cred | Select-String "Password"
if (-not $tokenLine) {
    Write-Host "Could not parse stored eBay credentials."
    exit 1
}

$token = $tokenLine.ToString().Split()[-1]
if (-not $token) {
    Write-Host "Could not extract token from stored credentials."
    exit 1
}


$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "X-EBAY-C-MARKETPLACE-ID" = "EBAY_US"
}

# Payment Policy
Write-Host "Creating Payment Policy..."
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
    Write-Host "Payment Policy created: $($paymentResponse.paymentPolicyId)"
    cmdkey /generic:"HiddenHavenThreads_EBAY_PAYMENT_POLICY_ID" /user:"api" /pass:"$($paymentResponse.paymentPolicyId)" | Out-Null
} catch {
    Write-Host "Payment Policy creation failed: $($_.Exception.Message)"
}

# Return Policy
Write-Host "Creating Return Policy..."
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
    Write-Host "Return Policy created: $($returnResponse.returnPolicyId)"
    cmdkey /generic:"HiddenHavenThreads_EBAY_RETURN_POLICY_ID" /user:"api" /pass:"$($returnResponse.returnPolicyId)" | Out-Null
} catch {
    Write-Host "Return Policy creation failed: $($_.Exception.Message)"
}

# Fulfillment Policy
Write-Host "Creating Fulfillment Policy..."
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
    Write-Host "Fulfillment Policy created: $($fulfillmentResponse.fulfillmentPolicyId)"
    cmdkey /generic:"HiddenHavenThreads_EBAY_FULFILLMENT_POLICY_ID" /user:"api" /pass:"$($fulfillmentResponse.fulfillmentPolicyId)" | Out-Null
} catch {
    Write-Host "Fulfillment Policy creation failed: $($_.Exception.Message)"
}

Write-Host "Sandbox policies setup complete!"