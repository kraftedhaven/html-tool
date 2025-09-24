# Azure Deployment Script for Neural Listing Engine
param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "neural-listing-$(Get-Random -Minimum 1000 -Maximum 9999)"
)

Write-Host "Starting Azure deployment for Neural Listing Engine..." -ForegroundColor Green

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Login to Azure (if not already logged in)
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
$loginStatus = az account show 2>$null
if (!$loginStatus) {
    Write-Host "Please login to Azure..." -ForegroundColor Yellow
    az login
}

# Create Resource Group
Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location

# Deploy Bicep template
Write-Host "Deploying Azure infrastructure..." -ForegroundColor Yellow
$deploymentResult = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "infrastructure/main.bicep" `
    --parameters appName=$AppName `
    --query "properties.outputs" `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy Azure infrastructure"
    exit 1
}

# Extract deployment outputs
$functionAppName = $deploymentResult.functionAppName.value
$keyVaultName = $deploymentResult.keyVaultName.value
$keyVaultUri = $deploymentResult.keyVaultUri.value
$staticWebAppName = $deploymentResult.staticWebAppName.value
$staticWebAppUrl = $deploymentResult.staticWebAppUrl.value
$cdnEndpointUrl = $deploymentResult.cdnEndpointUrl.value

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Function App: $functionAppName" -ForegroundColor Cyan
Write-Host "Key Vault: $keyVaultName" -ForegroundColor Cyan
Write-Host "Static Web App: $staticWebAppName" -ForegroundColor Cyan
Write-Host "Static Web App URL: $staticWebAppUrl" -ForegroundColor Cyan
Write-Host "CDN Endpoint URL: $cdnEndpointUrl" -ForegroundColor Cyan

# Store secrets in Key Vault (you'll need to update these with your actual values)
Write-Host "Setting up Key Vault secrets..." -ForegroundColor Yellow
Write-Host "Please add the following secrets to your Key Vault manually or update this script:" -ForegroundColor Red
Write-Host "- openai-api-key" -ForegroundColor Red
Write-Host "- ebay-client-id" -ForegroundColor Red
Write-Host "- ebay-client-secret" -ForegroundColor Red
Write-Host "- ebay-refresh-token" -ForegroundColor Red
Write-Host "- ebay-fulfillment-policy-id" -ForegroundColor Red
Write-Host "- ebay-payment-policy-id" -ForegroundColor Red
Write-Host "- ebay-return-policy-id" -ForegroundColor Red

# Get Static Web App deployment token for GitHub Actions
Write-Host "Getting Static Web App deployment token..." -ForegroundColor Yellow
$deploymentToken = az staticwebapp secrets list --name $staticWebAppName --query "properties.apiKey" --output tsv

Write-Host "GitHub Actions Setup:" -ForegroundColor Green
Write-Host "Add the following secrets to your GitHub repository:" -ForegroundColor Yellow
Write-Host "AZURE_STATIC_WEB_APPS_API_TOKEN: $deploymentToken" -ForegroundColor Cyan
Write-Host "AZURE_FUNCTIONAPP_NAME: $functionAppName" -ForegroundColor Cyan

# Get Function App publish profile
Write-Host "Getting Function App publish profile..." -ForegroundColor Yellow
$publishProfile = az functionapp deployment list-publishing-profiles --name $functionAppName --resource-group $ResourceGroupName --xml

Write-Host "AZURE_FUNCTIONAPP_PUBLISH_PROFILE: (XML content - copy from Azure portal)" -ForegroundColor Cyan

Write-Host "`nDeployment Summary:" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "Function App: $functionAppName" -ForegroundColor White
Write-Host "Key Vault: $keyVaultName ($keyVaultUri)" -ForegroundColor White
Write-Host "Static Web App: $staticWebAppName ($staticWebAppUrl)" -ForegroundColor White
Write-Host "CDN Endpoint: $cdnEndpointUrl" -ForegroundColor White
Write-Host "`nNext Steps:" -ForegroundColor Green
Write-Host "1. Add secrets to Key Vault" -ForegroundColor Yellow
Write-Host "2. Configure GitHub repository secrets" -ForegroundColor Yellow
Write-Host "3. Update repository URL in Static Web App" -ForegroundColor Yellow
Write-Host "4. Push code to trigger deployment" -ForegroundColor Yellow