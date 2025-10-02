# Set Active eBay Environment
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("production", "sandbox")]
    [string]$Environment
)

Write-Host "🔄 Setting active eBay environment to: $Environment" -ForegroundColor Green

# Function to copy credentials
function Copy-Credential {
    param($Name, $FromEnv, $ToActive)
    
    $sourceKey = "HiddenHavenThreads_${FromEnv}_$Name"
    $targetKey = "HiddenHavenThreads_$Name"
    
    # This is a simplified approach - in practice you'd need to extract and re-store
    Write-Host "📋 Setting $Name for $Environment environment" -ForegroundColor Yellow
    
    # For now, just set the environment marker
    cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"$Environment" | Out-Null
}

if ($Environment -eq "production") {
    $envKey = "PROD"
    Write-Host "🏭 Activating Production credentials..." -ForegroundColor Cyan
} else {
    $envKey = "SANDBOX"
    Write-Host "🧪 Activating Sandbox credentials..." -ForegroundColor Cyan
}

# Set environment marker
cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"$Environment" | Out-Null

Write-Host "✅ Environment set to: $Environment" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️ Important: You'll need to manually enter the credentials when prompted" -ForegroundColor Yellow
Write-Host "The system will now use $Environment endpoints automatically" -ForegroundColor Cyan

Write-Host ""
Write-Host "Test the connection:" -ForegroundColor Cyan
Write-Host ".\scripts\test-ebay-connection.ps1" -ForegroundColor Gray