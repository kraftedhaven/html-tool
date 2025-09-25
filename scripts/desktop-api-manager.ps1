# Desktop API Manager - Fast-track marketplace integrations
# This script helps manage API credentials and test connections locally

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "setup",
    
    [Parameter(Mandatory=$false)]
    [string]$Marketplace = "all"
)

Write-Host "🚀 Desktop API Manager - Fast Track Mode" -ForegroundColor Green

# Function to securely store credentials
function Set-ApiCredential {
    param($Name, $Value)
    
    # Store in Windows Credential Manager for security
    cmdkey /generic:"HiddenHavenThreads_$Name" /user:"api" /pass:"$Value" | Out-Null
    Write-Host "✅ Stored $Name securely" -ForegroundColor Green
}

# Function to get stored credentials
function Get-ApiCredential {
    param($Name)
    
    try {
        $cred = cmdkey /list:"HiddenHavenThreads_$Name" 2>$null
        if ($cred) {
            # Extract password from credential manager
            return (cmdkey /list:"HiddenHavenThreads_$Name" | Select-String "Password:" | ForEach-Object { $_.ToString().Split(":")[1].Trim() })
        }
    } catch {
        return $null
    }
}

# Function to test API connections
function Test-ApiConnection {
    param($Marketplace, $Token)
    
    Write-Host "🔍 Testing $Marketplace API connection..." -ForegroundColor Yellow
    
    switch ($Marketplace.ToLower()) {
        "ebay" {
            $environment = Get-ApiCredential "EBAY_ENVIRONMENT"
            $baseUrl = if ($environment -eq "sandbox") { "https://api.sandbox.ebay.com" } else { "https://api.ebay.com" }
            
            $headers = @{
                "Authorization" = "Bearer $Token"
                "Content-Type" = "application/json"
            }
            try {
                $response = Invoke-RestMethod -Uri "$baseUrl/sell/account/v1/payment_policy" -Headers $headers -Method GET
                Write-Host "✅ eBay API connection successful ($environment)" -ForegroundColor Green
                return $true
            } catch {
                Write-Host "❌ eBay API connection failed ($environment): $($_.Exception.Message)" -ForegroundColor Red
                return $false
            }
        }
        "facebook" {
            $headers = @{
                "Authorization" = "Bearer $Token"
            }
            try {
                $response = Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/me" -Headers $headers -Method GET
                Write-Host "✅ Facebook API connection successful" -ForegroundColor Green
                return $true
            } catch {
                Write-Host "❌ Facebook API connection failed: $($_.Exception.Message)" -ForegroundColor Red
                return $false
            }
        }
        "etsy" {
            $headers = @{
                "Authorization" = "Bearer $Token"
            }
            try {
                $response = Invoke-RestMethod -Uri "https://openapi.etsy.com/v3/application/user" -Headers $headers -Method GET
                Write-Host "✅ Etsy API connection successful" -ForegroundColor Green
                return $true
            } catch {
                Write-Host "❌ Etsy API connection failed: $($_.Exception.Message)" -ForegroundColor Red
                return $false
            }
        }
    }
}

# Function to get eBay policy IDs automatically
function Get-EbayPolicyIds {
    param($Token)
    
    $environment = Get-ApiCredential "EBAY_ENVIRONMENT"
    $baseUrl = if ($environment -eq "sandbox") { "https://api.sandbox.ebay.com" } else { "https://api.ebay.com" }
    
    Write-Host "📋 Fetching eBay policy IDs from $environment..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    try {
        # Get payment policies
        $paymentPolicies = Invoke-RestMethod -Uri "$baseUrl/sell/account/v1/payment_policy" -Headers $headers -Method GET
        $returnPolicies = Invoke-RestMethod -Uri "$baseUrl/sell/account/v1/return_policy" -Headers $headers -Method GET
        $fulfillmentPolicies = Invoke-RestMethod -Uri "$baseUrl/sell/account/v1/fulfillment_policy" -Headers $headers -Method GET
        
        Write-Host "📋 eBay Policy IDs Found:" -ForegroundColor Green
        
        if ($paymentPolicies.paymentPolicies) {
            $paymentPolicies.paymentPolicies | ForEach-Object {
                Write-Host "  💳 Payment Policy: $($_.name) - ID: $($_.paymentPolicyId)" -ForegroundColor Cyan
                Set-ApiCredential "EBAY_PAYMENT_POLICY_ID" $_.paymentPolicyId
            }
        }
        
        if ($returnPolicies.returnPolicies) {
            $returnPolicies.returnPolicies | ForEach-Object {
                Write-Host "  🔄 Return Policy: $($_.name) - ID: $($_.returnPolicyId)" -ForegroundColor Cyan
                Set-ApiCredential "EBAY_RETURN_POLICY_ID" $_.returnPolicyId
            }
        }
        
        if ($fulfillmentPolicies.fulfillmentPolicies) {
            $fulfillmentPolicies.fulfillmentPolicies | ForEach-Object {
                Write-Host "  📦 Fulfillment Policy: $($_.name) - ID: $($_.fulfillmentPolicyId)" -ForegroundColor Cyan
                Set-ApiCredential "EBAY_FULFILLMENT_POLICY_ID" $_.fulfillmentPolicyId
            }
        }
        
    } catch {
        Write-Host "❌ Failed to fetch eBay policies: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to create test listing
function New-TestListing {
    param($Marketplace)
    
    Write-Host "🧪 Creating test listing for $Marketplace..." -ForegroundColor Yellow
    
    $testData = @{
        title = "Test Vintage Item - Hidden Haven Threads"
        description = "This is a test listing created by the Desktop API Manager"
        price = 25.00
        images = @("https://via.placeholder.com/400x400.png?text=Test+Image")
        category = "11450"
        brand = "Vintage"
        material = "Cotton"
        estimatedYear = 1980
    }
    
    # Call your Azure Function
    $functionUrl = "https://your-function-app.azurewebsites.net/api/marketplaceClient"
    $body = @{
        marketplace = $Marketplace
        action = "createListing"
        data = $testData
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri $functionUrl -Method POST -Body $body -ContentType "application/json"
        Write-Host "✅ Test listing created successfully!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Test listing failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution logic
switch ($Action.ToLower()) {
    "setup" {
        Write-Host "🔧 Setting up API credentials..." -ForegroundColor Yellow
        
        # eBay Setup
        Write-Host "`n📱 eBay API Setup:" -ForegroundColor Magenta
        Write-Host "Choose eBay environment:" -ForegroundColor Yellow
        Write-Host "  1. Sandbox (for testing - recommended first)" -ForegroundColor Cyan
        Write-Host "  2. Production (for real listings)" -ForegroundColor Cyan
        
        do {
            $envChoice = Read-Host "Enter choice (1 or 2)"
        } while ($envChoice -notin @("1", "2"))
        
        $environment = if ($envChoice -eq "1") { "sandbox" } else { "production" }
        $apiUrl = if ($envChoice -eq "1") { "https://api.sandbox.ebay.com" } else { "https://api.ebay.com" }
        
        Write-Host "Selected: $environment environment ($apiUrl)" -ForegroundColor Green
        Set-ApiCredential "EBAY_ENVIRONMENT" $environment
        
        $ebayToken = Read-Host "Enter your eBay Access Token for $environment"
        Set-ApiCredential "EBAY_ACCESS_TOKEN" $ebayToken
        
        if (Test-ApiConnection "ebay" $ebayToken) {
            Get-EbayPolicyIds $ebayToken
        }
        
        # Facebook Setup
        Write-Host "`n📘 Facebook API Setup:" -ForegroundColor Magenta
        $facebookToken = Read-Host "Enter your Facebook Access Token"
        Set-ApiCredential "FACEBOOK_ACCESS_TOKEN" $facebookToken
        
        $pixelId = Read-Host "Enter your Facebook Pixel ID"
        Set-ApiCredential "FACEBOOK_PIXEL_ID" $pixelId
        
        $conversionToken = Read-Host "Enter your Facebook Conversion API Access Token"
        Set-ApiCredential "FACEBOOK_CONVERSION_API_TOKEN" $conversionToken
        
        Test-ApiConnection "facebook" $facebookToken
        
        # Etsy Setup
        Write-Host "`n🎨 Etsy API Setup:" -ForegroundColor Magenta
        $etsyToken = Read-Host "Enter your Etsy Access Token"
        Set-ApiCredential "ETSY_ACCESS_TOKEN" $etsyToken
        Test-ApiConnection "etsy" $etsyToken
        
        # OpenAI Setup
        Write-Host "`n🤖 OpenAI API Setup:" -ForegroundColor Magenta
        $openaiKey = Read-Host "Enter your OpenAI API Key"
        Set-ApiCredential "OPENAI_API_KEY" $openaiKey
        
        Write-Host "`n🎉 Setup complete! All credentials stored securely." -ForegroundColor Green
    }
    
    "test" {
        Write-Host "🧪 Testing API connections..." -ForegroundColor Yellow
        
        $marketplaces = if ($Marketplace -eq "all") { @("ebay", "facebook", "etsy") } else { @($Marketplace) }
        
        foreach ($mp in $marketplaces) {
            $token = Get-ApiCredential "$($mp.ToUpper())_ACCESS_TOKEN"
            if ($token) {
                Test-ApiConnection $mp $token
            } else {
                Write-Host "❌ No token found for $mp. Run setup first." -ForegroundColor Red
            }
        }
    }
    
    "create-test" {
        if ($Marketplace -eq "all") {
            @("ebay", "facebook", "etsy") | ForEach-Object { New-TestListing $_ }
        } else {
            New-TestListing $Marketplace
        }
    }
    
    "policies" {
        $ebayToken = Get-ApiCredential "EBAY_ACCESS_TOKEN"
        if ($ebayToken) {
            Get-EbayPolicyIds $ebayToken
        } else {
            Write-Host "❌ No eBay token found. Run setup first." -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "Usage: .\desktop-api-manager.ps1 -Action [setup|test|create-test|policies] -Marketplace [ebay|facebook|etsy|all]" -ForegroundColor Yellow
    }
}