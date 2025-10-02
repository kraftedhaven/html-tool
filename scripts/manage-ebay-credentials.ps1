# eBay Credential Manager - Store both Production and Sandbox
Write-Host "🔧 eBay Credential Manager" -ForegroundColor Green

# Function to securely store credentials
function Set-ApiCredential {
    param($Name, $Value, $Environment = "")
    $keyName = if ($Environment) { "HiddenHavenThreads_${Environment}_$Name" } else { "HiddenHavenThreads_$Name" }
    cmdkey /generic:"$keyName" /user:"api" /pass:"$Value" | Out-Null
    Write-Host "✅ Stored $Name ($Environment)" -ForegroundColor Green
}

# Function to get stored credentials
function Get-ApiCredential {
    param($Name, $Environment = "")
    $keyName = if ($Environment) { "HiddenHavenThreads_${Environment}_$Name" } else { "HiddenHavenThreads_$Name" }
    try {
        $result = cmdkey /list:"$keyName" 2>$null
        return $result -ne $null
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Cyan
Write-Host "1. Add/Update Production Credentials" -ForegroundColor Yellow
Write-Host "2. Add/Update Sandbox Credentials" -ForegroundColor Yellow
Write-Host "3. Switch to Production" -ForegroundColor Yellow
Write-Host "4. Switch to Sandbox" -ForegroundColor Yellow
Write-Host "5. View Current Environment" -ForegroundColor Yellow

$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📱 PRODUCTION CREDENTIALS" -ForegroundColor Magenta
        Write-Host "Get from: https://developer.ebay.com/ → Production Keys" -ForegroundColor Yellow
        Write-Host ""
        
        $appId = Read-Host "App ID (Client ID)"
        if ($appId) { Set-ApiCredential "EBAY_APP_ID" $appId "PROD" }
        
        $devId = Read-Host "Dev ID"
        if ($devId) { Set-ApiCredential "EBAY_DEV_ID" $devId "PROD" }
        
        $certId = Read-Host "Cert ID (Client Secret)"
        if ($certId) { Set-ApiCredential "EBAY_CERT_ID" $certId "PROD" }
        
        $token = Read-Host "User Token"
        if ($token) { Set-ApiCredential "EBAY_ACCESS_TOKEN" $token "PROD" }
        
        Write-Host "✅ Production credentials stored!" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "🧪 SANDBOX CREDENTIALS" -ForegroundColor Magenta
        Write-Host "Get from: https://developer.ebay.com/ → Sandbox Keys" -ForegroundColor Yellow
        Write-Host ""
        
        $appId = Read-Host "Sandbox App ID (Client ID)"
        if ($appId) { Set-ApiCredential "EBAY_APP_ID" $appId "SANDBOX" }
        
        $devId = Read-Host "Sandbox Dev ID"
        if ($devId) { Set-ApiCredential "EBAY_DEV_ID" $devId "SANDBOX" }
        
        $certId = Read-Host "Sandbox Cert ID (Client Secret)"
        if ($certId) { Set-ApiCredential "EBAY_CERT_ID" $certId "SANDBOX" }
        
        $token = Read-Host "Sandbox User Token"
        if ($token) { Set-ApiCredential "EBAY_ACCESS_TOKEN" $token "SANDBOX" }
        
        Write-Host "✅ Sandbox credentials stored!" -ForegroundColor Green
    }
    
    "3" {
        Write-Host ""
        Write-Host "🔄 Switching to Production..." -ForegroundColor Yellow
        
        # Copy production credentials to active slots
        if (Get-ApiCredential "EBAY_APP_ID" "PROD") {
            # Get the actual values and copy them (simplified approach)
            Set-ApiCredential "EBAY_ENVIRONMENT" "production"
            Write-Host "✅ Switched to Production environment" -ForegroundColor Green
            Write-Host "Note: You may need to manually copy credential values" -ForegroundColor Yellow
        } else {
            Write-Host "❌ No production credentials found. Add them first." -ForegroundColor Red
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "🔄 Switching to Sandbox..." -ForegroundColor Yellow
        
        # Copy sandbox credentials to active slots
        if (Get-ApiCredential "EBAY_APP_ID" "SANDBOX") {
            Set-ApiCredential "EBAY_ENVIRONMENT" "sandbox"
            Write-Host "✅ Switched to Sandbox environment" -ForegroundColor Green
            Write-Host "Note: You may need to manually copy credential values" -ForegroundColor Yellow
        } else {
            Write-Host "❌ No sandbox credentials found. Add them first." -ForegroundColor Red
        }
    }
    
    "5" {
        Write-Host ""
        Write-Host "📊 CURRENT ENVIRONMENT STATUS" -ForegroundColor Magenta
        
        # Check current environment
        if (Get-ApiCredential "EBAY_ENVIRONMENT") {
            Write-Host "Current: Stored environment setting found" -ForegroundColor Green
        } else {
            Write-Host "Current: No environment set (defaults to production)" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "Available Credentials:" -ForegroundColor Cyan
        
        if (Get-ApiCredential "EBAY_APP_ID" "PROD") {
            Write-Host "✅ Production credentials available" -ForegroundColor Green
        } else {
            Write-Host "❌ Production credentials missing" -ForegroundColor Red
        }
        
        if (Get-ApiCredential "EBAY_APP_ID" "SANDBOX") {
            Write-Host "✅ Sandbox credentials available" -ForegroundColor Green
        } else {
            Write-Host "❌ Sandbox credentials missing" -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "- Test connection: .\scripts\test-ebay-connection.ps1" -ForegroundColor Gray
Write-Host "- Switch environments anytime with this script" -ForegroundColor Gray