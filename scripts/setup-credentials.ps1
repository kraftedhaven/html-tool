# Simple Credential Setup - No complex formatting
param(
    [string]$KeyVaultName = ""
)

Write-Host "API Credential Setup" -ForegroundColor Green

# Store credential function
function Store-Credential {
    param($Name, $Value)
    cmdkey /generic:"HHT_$Name" /user:"api" /pass:"$Value" | Out-Null
    Write-Host "Stored $Name" -ForegroundColor Green
}

Write-Host ""
Write-Host "EBAY SETUP" -ForegroundColor Yellow
Write-Host "Go to: developer.ebay.com -> My Account -> Keys -> Production"

$ebayAppId = Read-Host "Enter eBay App ID"
Store-Credential "EBAY_APP_ID" $ebayAppId

$ebayDevId = Read-Host "Enter eBay Dev ID"
Store-Credential "EBAY_DEV_ID" $ebayDevId

$ebayCertId = Read-Host "Enter eBay Cert ID"
Store-Credential "EBAY_CERT_ID" $ebayCertId

$ebayToken = Read-Host "Enter eBay User Token"
Store-Credential "EBAY_ACCESS_TOKEN" $ebayToken
Store-Credential "EBAY_ENVIRONMENT" "production"

Write-Host ""
Write-Host "FACEBOOK SETUP" -ForegroundColor Yellow
Write-Host "Use Partner Integration for Conversion API"

$fbToken = Read-Host "Enter Facebook Access Token"
Store-Credential "FACEBOOK_ACCESS_TOKEN" $fbToken

$pixelId = Read-Host "Enter Facebook Pixel ID"
Store-Credential "FACEBOOK_PIXEL_ID" $pixelId

$convToken = Read-Host "Enter Facebook Conversion API Token"
Store-Credential "FACEBOOK_CONVERSION_API_TOKEN" $convToken

Write-Host ""
Write-Host "OTHER APIS" -ForegroundColor Yellow

$etsyToken = Read-Host "Enter Etsy Token (or press Enter to skip)"
if ($etsyToken) { Store-Credential "ETSY_ACCESS_TOKEN" $etsyToken }

$openaiKey = Read-Host "Enter OpenAI API Key"
Store-Credential "OPENAI_API_KEY" $openaiKey

$paypalEmail = Read-Host "Enter PayPal Email"
Store-Credential "PAYPAL_EMAIL" $paypalEmail

# Test eBay connection
Write-Host ""
Write-Host "Testing eBay connection..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $ebayToken"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.ebay.com/sell/account/v1/payment_policy" -Headers $headers
    Write-Host "eBay connection successful!" -ForegroundColor Green
    
    # Get first policy IDs
    if ($response.paymentPolicies -and $response.paymentPolicies.Count -gt 0) {
        $paymentId = $response.paymentPolicies[0].paymentPolicyId
        Store-Credential "EBAY_PAYMENT_POLICY_ID" $paymentId
        Write-Host "Payment Policy ID: $paymentId"
    }
    
    $returnResponse = Invoke-RestMethod -Uri "https://api.ebay.com/sell/account/v1/return_policy" -Headers $headers
    if ($returnResponse.returnPolicies -and $returnResponse.returnPolicies.Count -gt 0) {
        $returnId = $returnResponse.returnPolicies[0].returnPolicyId
        Store-Credential "EBAY_RETURN_POLICY_ID" $returnId
        Write-Host "Return Policy ID: $returnId"
    }
    
    $fulfillResponse = Invoke-RestMethod -Uri "https://api.ebay.com/sell/account/v1/fulfillment_policy" -Headers $headers
    if ($fulfillResponse.fulfillmentPolicies -and $fulfillResponse.fulfillmentPolicies.Count -gt 0) {
        $fulfillId = $fulfillResponse.fulfillmentPolicies[0].fulfillmentPolicyId
        Store-Credential "EBAY_FULFILLMENT_POLICY_ID" $fulfillId
        Write-Host "Fulfillment Policy ID: $fulfillId"
    }
    
} catch {
    Write-Host "eBay connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green

if ($KeyVaultName) {
    Write-Host "Syncing to Azure Key Vault: $KeyVaultName" -ForegroundColor Yellow
    
    $creds = @(
        "EBAY-ACCESS-TOKEN", "EBAY-ENVIRONMENT", "EBAY-DEV-ID", "EBAY-APP-ID", "EBAY-CERT-ID",
        "EBAY-PAYMENT-POLICY-ID", "EBAY-RETURN-POLICY-ID", "EBAY-FULFILLMENT-POLICY-ID",
        "FACEBOOK-ACCESS-TOKEN", "FACEBOOK-PIXEL-ID", "FACEBOOK-CONVERSION-API-TOKEN",
        "ETSY-ACCESS-TOKEN", "OPENAI-API-KEY", "PAYPAL-EMAIL"
    )
    
    foreach ($cred in $creds) {
        $localName = $cred -replace "-", "_"
        try {
            $value = (cmdkey /list:"HHT_$localName" | Select-String "Password:" | ForEach-Object { $_.ToString().Split(":")[1].Trim() })
            if ($value) {
                az keyvault secret set --vault-name $KeyVaultName --name $cred --value $value --output none
                Write-Host "Synced $cred to Key Vault" -ForegroundColor Green
            }
        } catch {
            Write-Host "Skipped $cred" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Next: Test with your Azure Function URL"