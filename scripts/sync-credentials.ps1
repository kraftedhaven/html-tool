# Sync Desktop Credentials to Azure Key Vault
# Fast-track credential management

param(
    [Parameter(Mandatory=$true)]
    [string]$KeyVaultName,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "hidden-haven-rg"
)

Write-Host "🔄 Syncing credentials to Azure Key Vault: $KeyVaultName" -ForegroundColor Green

# Function to get stored credentials from Windows Credential Manager
function Get-LocalCredential {
    param($Name)
    
    try {
        # Use cmdkey to retrieve stored credentials
        $output = cmdkey /list:"HiddenHavenThreads_$Name" 2>$null
        if ($output -match "Target: HiddenHavenThreads_$Name") {
            # For security, we'll prompt for the value instead of extracting from cmdkey
            return Read-Host "Enter value for $Name (stored locally)" -AsSecureString
        }
    } catch {
        return $null
    }
}

# Function to set Azure Key Vault secret
function Set-KeyVaultSecret {
    param($Name, $Value)
    
    try {
        $secureValue = ConvertTo-SecureString $Value -AsPlainText -Force
        az keyvault secret set --vault-name $KeyVaultName --name $Name --value $Value --output none
        Write-Host "✅ Synced $Name to Key Vault" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to sync $Name: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check if Azure CLI is logged in
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "📋 Using Azure account: $($account.user.name)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Please login to Azure CLI first: az login" -ForegroundColor Red
    exit 1
}

# Credentials to sync
$credentials = @(
    "EBAY-ACCESS-TOKEN",
    "EBAY-ENVIRONMENT",
    "EBAY-DEV-ID", 
    "EBAY-APP-ID",
    "EBAY-CERT-ID",
    "EBAY-PAYMENT-POLICY-ID",
    "EBAY-RETURN-POLICY-ID",
    "EBAY-FULFILLMENT-POLICY-ID",
    "FACEBOOK-ACCESS-TOKEN",
    "FACEBOOK-PIXEL-ID",
    "FACEBOOK-CONVERSION-API-TOKEN",
    "ETSY-ACCESS-TOKEN",
    "OPENAI-API-KEY",
    "PAYPAL-EMAIL"
)

Write-Host "🔐 Syncing credentials to Azure Key Vault..." -ForegroundColor Yellow

foreach ($cred in $credentials) {
    Write-Host "`nProcessing $cred..." -ForegroundColor Cyan
    
    # Check if already exists in Key Vault
    $existing = az keyvault secret show --vault-name $KeyVaultName --name $cred --query "value" -o tsv 2>$null
    
    if ($existing) {
        $overwrite = Read-Host "Secret $cred already exists. Overwrite? (y/N)"
        if ($overwrite -ne "y") {
            Write-Host "⏭️ Skipping $cred" -ForegroundColor Yellow
            continue
        }
    }
    
    # Get value from user
    $value = Read-Host "Enter value for $cred" -AsSecureString
    $plainValue = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($value))
    
    if ($plainValue) {
        Set-KeyVaultSecret $cred $plainValue
    } else {
        Write-Host "⏭️ Skipping empty value for $cred" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Credential sync complete!" -ForegroundColor Green
Write-Host "Your Azure Functions can now access these secrets via Key Vault." -ForegroundColor Cyan