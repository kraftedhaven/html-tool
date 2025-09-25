# Quick Test - Validate entire marketplace integration
# Fast-track testing for all marketplaces

param(
    [Parameter(Mandatory=$false)]
    [string]$FunctionAppUrl = "https://your-function-app.azurewebsites.net",
    
    [Parameter(Mandatory=$false)]
    [string]$TestMode = "all"
)

Write-Host "🚀 Quick Test - Marketplace Integration Validation" -ForegroundColor Green

# Test data for quick validation
$testProduct = @{
    title = "Vintage 1980s Band T-Shirt - Test Listing"
    description = "Authentic vintage band t-shirt from the 1980s. Great condition with minimal wear. Perfect for collectors and vintage fashion enthusiasts."
    price = 35.00
    images = @(
        "https://via.placeholder.com/400x400.png?text=Vintage+Tshirt+Front",
        "https://via.placeholder.com/400x400.png?text=Vintage+Tshirt+Back"
    )
    category = "11450"
    brand = "Vintage"
    material = "Cotton"
    theme = "Band Merchandise"
    estimatedYear = 1985
    condition = "used"
}

# Function to test marketplace endpoint
function Test-MarketplaceEndpoint {
    param($Marketplace, $Action = "createListing")
    
    Write-Host "`n🧪 Testing $Marketplace marketplace..." -ForegroundColor Yellow
    
    $body = @{
        marketplace = $Marketplace
        action = $Action
        data = $testProduct
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$FunctionAppUrl/api/marketplaceClient" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        
        if ($response.success) {
            Write-Host "✅ $Marketplace test successful!" -ForegroundColor Green
            Write-Host "   Response: $($response.data | ConvertTo-Json -Compress)" -ForegroundColor Cyan
            return $true
        } else {
            Write-Host "❌ $Marketplace test failed: $($response.error)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $Marketplace test error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorDetails = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorDetails)
            $errorBody = $reader.ReadToEnd()
            Write-Host "   Error details: $errorBody" -ForegroundColor Red
        }
        return $false
    }
}

# Function to test AI analysis endpoint
function Test-AIAnalysis {
    Write-Host "`n🤖 Testing AI image analysis..." -ForegroundColor Yellow
    
    $analysisData = @{
        images = $testProduct.images
        includeEbayCategories = $true
        includePricing = $true
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$FunctionAppUrl/api/analyzeImages" -Method POST -Body $analysisData -ContentType "application/json" -TimeoutSec 60
        
        Write-Host "✅ AI Analysis successful!" -ForegroundColor Green
        Write-Host "   Categories: $($response.suggestedCategories -join ', ')" -ForegroundColor Cyan
        Write-Host "   Estimated Price: $($response.estimatedPrice)" -ForegroundColor Cyan
        return $true
    } catch {
        Write-Host "❌ AI Analysis failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test bulk operations
function Test-BulkOperations {
    Write-Host "`n📦 Testing bulk operations..." -ForegroundColor Yellow
    
    $bulkData = @{
        marketplace = "ebay"
        action = "bulkCreate"
        data = @{
            listings = @($testProduct, $testProduct)
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$FunctionAppUrl/api/marketplaceClient" -Method POST -Body $bulkData -ContentType "application/json" -TimeoutSec 120
        
        Write-Host "✅ Bulk operations test successful!" -ForegroundColor Green
        Write-Host "   Processed: $($response.data.Count) listings" -ForegroundColor Cyan
        return $true
    } catch {
        Write-Host "❌ Bulk operations failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test health check
function Test-HealthCheck {
    Write-Host "`n❤️ Testing health check..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$FunctionAppUrl/api/healthCheck" -Method GET -TimeoutSec 10
        
        Write-Host "✅ Health check passed!" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
        Write-Host "   Services: $($response.services | ConvertTo-Json -Compress)" -ForegroundColor Cyan
        return $true
    } catch {
        Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main test execution
Write-Host "🎯 Starting comprehensive marketplace tests..." -ForegroundColor Cyan
Write-Host "Function App URL: $FunctionAppUrl" -ForegroundColor Gray

$results = @{}

# Health check first
$results.HealthCheck = Test-HealthCheck

# AI Analysis test
$results.AIAnalysis = Test-AIAnalysis

# Marketplace tests
switch ($TestMode.ToLower()) {
    "all" {
        $results.eBay = Test-MarketplaceEndpoint "ebay"
        $results.Facebook = Test-MarketplaceEndpoint "facebook"
        $results.Etsy = Test-MarketplaceEndpoint "etsy"
        $results.BulkOperations = Test-BulkOperations
    }
    "ebay" {
        $results.eBay = Test-MarketplaceEndpoint "ebay"
    }
    "facebook" {
        $results.Facebook = Test-MarketplaceEndpoint "facebook"
    }
    "etsy" {
        $results.Etsy = Test-MarketplaceEndpoint "etsy"
    }
    "bulk" {
        $results.BulkOperations = Test-BulkOperations
    }
}

# Summary
Write-Host "`n📊 Test Results Summary:" -ForegroundColor Magenta
$passed = 0
$total = 0

foreach ($test in $results.GetEnumerator()) {
    $total++
    $status = if ($test.Value) { "✅ PASS"; $passed++ } else { "❌ FAIL" }
    Write-Host "   $($test.Key): $status" -ForegroundColor $(if ($test.Value) { "Green" } else { "Red" })
}

$successRate = [math]::Round(($passed / $total) * 100, 1)
Write-Host "`n🎯 Overall Success Rate: $successRate% ($passed/$total)" -ForegroundColor $(if ($successRate -ge 80) { "Green" } else { "Yellow" })

if ($successRate -eq 100) {
    Write-Host "🎉 All tests passed! Your marketplace integration is ready!" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "⚠️ Most tests passed. Check failed tests above." -ForegroundColor Yellow
} else {
    Write-Host "❌ Multiple tests failed. Check configuration and credentials." -ForegroundColor Red
}

Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Fix any failed tests" -ForegroundColor Gray
Write-Host "   2. Run production deployment" -ForegroundColor Gray
Write-Host "   3. Start creating real listings!" -ForegroundColor Gray