# Quick eBay Connection Test
Write-Host "Testing eBay Connection" -ForegroundColor Green

# Check environment setting
try {
    $envOutput = cmdkey /list:"HiddenHavenThreads_EBAY_ENVIRONMENT" 2>$null
    $environment = "production"  # default
    
    if ($envOutput -and $envOutput -match "sandbox") {
        $environment = "sandbox"
        Write-Host "Environment: SANDBOX" -ForegroundColor Yellow
    } else {
        Write-Host "Environment: PRODUCTION" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Environment: PRODUCTION (default)" -ForegroundColor Cyan
    $environment = "production"
}

# Get stored eBay token
try {
    $tokenOutput = cmdkey /list:"HiddenHavenThreads_EBAY_ACCESS_TOKEN" 2>$null
    if ($tokenOutput) {
        Write-Host "Found stored eBay token" -ForegroundColor Green
        
        # You'll need to manually get the token for testing
        $token = Read-Host "Paste your eBay User Token to test"
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
            "X-EBAY-C-MARKETPLACE-ID" = "EBAY_US"
        }
        
        # Set API URL based on environment
        if ($environment -eq "sandbox") {
            $baseUrl = "https://api.sandbox.ebay.com"
            Write-Host "Testing connection to eBay Sandbox API..." -ForegroundColor Yellow
        } else {
            $baseUrl = "https://api.ebay.com"
            Write-Host "Testing connection to eBay Production API..." -ForegroundColor Yellow
        }
        
        try {
            # Try a simpler endpoint first
            $response = Invoke-RestMethod -Uri "$baseUrl/sell/account/v1/privilege" -Headers $headers -Method GET
            Write-Host "✅ eBay connection successful!" -ForegroundColor Green
            Write-Host "User privileges: $($response.privileges -join ', ')" -ForegroundColor Cyan
            
            # Test listing a sample item
            Write-Host "`n🧪 Testing item listing capability..." -ForegroundColor Yellow
            
            # Get policies
            try {
                $policies = Invoke-RestMethod -Uri "$baseUrl/sell/account/v1/payment_policy" -Headers $headers -Method GET
                if ($policies.paymentPolicies -and $policies.paymentPolicies.Count -gt 0) {
                    Write-Host "✅ Payment policies available: $($policies.paymentPolicies.Count)" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ No payment policies found" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️ Could not fetch policies: $($_.Exception.Message)" -ForegroundColor Yellow
            }
            
        } catch {
            Write-Host "❌ eBay connection failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "This usually means:" -ForegroundColor Yellow
            Write-Host "  1. Token is expired" -ForegroundColor Gray
            Write-Host "  2. Wrong token format" -ForegroundColor Gray
            if ($environment -eq "sandbox") {
                Write-Host "  3. Production token used for sandbox" -ForegroundColor Gray
            } else {
                Write-Host "  3. Sandbox token used for production" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "No eBay token found in storage" -ForegroundColor Red
        Write-Host "Run one of these scripts first:" -ForegroundColor Yellow
        Write-Host "  - For sandbox: .\scripts\update-ebay-sandbox.ps1" -ForegroundColor Gray
        Write-Host "  - For production: .\scripts\collect-credentials.ps1" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error checking stored credentials: $($_.Exception.Message)" -ForegroundColor Red
}