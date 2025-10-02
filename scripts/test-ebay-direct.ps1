Write-Host "Direct eBay Connection Test" -ForegroundColor Green
Write-Host "This bypasses credential storage and asks for token directly" -ForegroundColor Cyan
Write-Host ""

Write-Host "Choose environment:" -ForegroundColor Yellow
Write-Host "1 = Production (api.ebay.com)" -ForegroundColor Cyan
Write-Host "2 = Sandbox (api.sandbox.ebay.com)" -ForegroundColor Yellow

$env = Read-Host "Enter 1 or 2"

if ($env -eq "2") {
    $baseUrl = "https://api.sandbox.ebay.com"
    Write-Host "Testing SANDBOX environment" -ForegroundColor Yellow
} else {
    $baseUrl = "https://api.ebay.com"
    Write-Host "Testing PRODUCTION environment" -ForegroundColor Cyan
}

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
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}