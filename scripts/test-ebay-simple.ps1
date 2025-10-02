Write-Host "eBay Connection Test" -ForegroundColor Green

# Check stored environment
try {
    $envResult = cmdkey /list:"HiddenHavenThreads_EBAY_ENVIRONMENT" 2>$null
    if ($envResult -and ($envResult | Select-String "sandbox")) {
        $environment = "sandbox"
        $baseUrl = "https://api.sandbox.ebay.com"
        Write-Host "Environment: SANDBOX" -ForegroundColor Yellow
    } else {
        $environment = "production"
        $baseUrl = "https://api.ebay.com"
        Write-Host "Environment: PRODUCTION" -ForegroundColor Cyan
    }
} catch {
    $environment = "production"
    $baseUrl = "https://api.ebay.com"
    Write-Host "Environment: PRODUCTION (default)" -ForegroundColor Cyan
}

Write-Host "API URL: $baseUrl" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Paste your eBay User Token"

if ($token) {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
        "X-EBAY-C-MARKETPLACE-ID" = "EBAY_US"
    }
    
    Write-Host "Testing connection..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/sell/account/v1/privilege" -Headers $headers -Method GET
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host "Privileges: $($response.privileges -join ', ')" -ForegroundColor Cyan
        
        # Test policies
        try {
            $policies = Invoke-RestMethod -Uri "$baseUrl/sell/account/v1/payment_policy" -Headers $headers -Method GET
            Write-Host "Payment policies: $($policies.paymentPolicies.Count)" -ForegroundColor Cyan
        } catch {
            Write-Host "No payment policies found" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        if ($environment -eq "sandbox") {
            Write-Host "Make sure you're using a SANDBOX token" -ForegroundColor Yellow
        } else {
            Write-Host "Make sure you're using a PRODUCTION token" -ForegroundColor Yellow
        }
    }
}