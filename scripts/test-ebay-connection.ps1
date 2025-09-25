# Quick eBay Connection Test
Write-Host "Testing eBay Connection" -ForegroundColor Green

# Get stored eBay token
try {
    $tokenOutput = cmdkey /list:"HHT_EBAY_ACCESS_TOKEN" 2>$null
    if ($tokenOutput) {
        Write-Host "Found stored eBay token" -ForegroundColor Green
        
        # Extract token (this is a simplified approach)
        Write-Host "Testing connection to eBay Production API..." -ForegroundColor Yellow
        
        # You'll need to manually get the token for testing
        $token = Read-Host "Paste your eBay User Token to test"
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
            "X-EBAY-C-MARKETPLACE-ID" = "EBAY_US"
        }
        
        try {
            # Try a simpler endpoint first
            $response = Invoke-RestMethod -Uri "https://api.ebay.com/sell/account/v1/privilege" -Headers $headers -Method GET
            Write-Host "✅ eBay connection successful!" -ForegroundColor Green
            Write-Host "User privileges: $($response.privileges -join ', ')" -ForegroundColor Cyan
        } catch {
            Write-Host "❌ eBay connection failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "This usually means:" -ForegroundColor Yellow
            Write-Host "  1. Token is expired" -ForegroundColor Gray
            Write-Host "  2. Wrong token format" -ForegroundColor Gray
            Write-Host "  3. Sandbox token used for production" -ForegroundColor Gray
        }
    } else {
        Write-Host "No eBay token found in storage" -ForegroundColor Red
    }
} catch {
    Write-Host "Error checking stored credentials: $($_.Exception.Message)" -ForegroundColor Red
}