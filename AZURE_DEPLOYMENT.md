# Azure Deployment Guide for Neural Listing Engine

This guide walks you through deploying the Neural Listing Engine to Azure using Azure Static Web Apps, Azure Functions, and Azure Key Vault.

## Prerequisites

1. **Azure Account** with available credits
2. **Azure CLI** installed and configured
3. **GitHub Account** for CI/CD integration
4. **Node.js 18+** installed locally
5. **PowerShell** (for Windows) or **Bash** (for Linux/Mac)

## Quick Start Deployment

### 1. Clone and Prepare Repository

```bash
git clone https://github.com/kraftedhaven/html-tool
cd neural-listing-engine
```

### 2. Run Azure Deployment Script

**Windows (PowerShell):**
```powershell
.\scripts\deploy-azure.ps1 -ResourceGroupName "neural-listing-rg" -Location "East US"
```

**Linux/Mac (Bash):**
```bash
# Convert PowerShell script to bash or use Azure CLI directly
az group create --name neural-listing-rg --location "East US"
az deployment group create --resource-group neural-listing-rg --template-file infrastructure/main.bicep
```

### 3. Configure Secrets

After deployment, add the following secrets to your Azure Key Vault:

```bash
# Replace <key-vault-name> with your actual Key Vault name
az keyvault secret set --vault-name <key-vault-name> --name "openai-api-key" --value "your-openai-key"
az keyvault secret set --vault-name <key-vault-name> --name "ebay-client-id" --value "your-ebay-client-id"
az keyvault secret set --vault-name <key-vault-name> --name "ebay-client-secret" --value "your-ebay-client-secret"
az keyvault secret set --vault-name <key-vault-name> --name "ebay-refresh-token" --value "your-ebay-refresh-token"
az keyvault secret set --vault-name <key-vault-name> --name "ebay-fulfillment-policy-id" --value "your-policy-id"
az keyvault secret set --vault-name <key-vault-name> --name "ebay-payment-policy-id" --value "your-policy-id"
az keyvault secret set --vault-name <key-vault-name> --name "ebay-return-policy-id" --value "your-policy-id"
```

### 4. Configure GitHub Actions

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):

- `AZURE_STATIC_WEB_APPS_API_TOKEN`: From deployment output
- `AZURE_FUNCTIONAPP_NAME`: Your Function App name
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`: Download from Azure portal
- `VITE_API_BASE_URL`: Your Function App URL (e.g., `https://your-app.azurewebsites.net/api`)

### 5. Update Repository Configuration

1. Update the repository URL in `infrastructure/main.bicep`:
   ```bicep
   repositoryUrl: 'https://github.com/YOUR_USERNAME/YOUR_REPO_NAME'
   ```

2. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Add Azure deployment configuration"
   git push origin main
   ```

## Architecture Overview

### Components Deployed

1. **Azure Static Web Apps**: Hosts the React frontend
2. **Azure Functions**: Serverless API endpoints
3. **Azure Key Vault**: Secure secret management
4. **Azure CDN**: Global content delivery
5. **Application Insights**: Monitoring and logging
6. **Storage Account**: Function app storage

### API Endpoints

After deployment, your API will be available at:
- `https://your-app.azurewebsites.net/api/analyzeImages`
- `https://your-app.azurewebsites.net/api/bulkUploadEbay`
- Additional endpoints as you add them

### Security Features

- **Managed Identity**: Function App uses system-assigned identity
- **Key Vault Integration**: All secrets stored securely
- **HTTPS Only**: All traffic encrypted
- **CORS Configuration**: Proper cross-origin setup

## Local Development

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Azure Functions
cd ../azure-functions
npm install
```

### 2. Configure Environment

```bash
# Copy environment templates
cp frontend/.env.example frontend/.env.local
cp azure-functions/.env.example azure-functions/.env

# Update with your local values
```

### 3. Run Locally

```bash
# Terminal 1: Start Azure Functions
cd azure-functions
npm start

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

## Monitoring and Troubleshooting

### Application Insights

Monitor your application at:
- Azure Portal > Application Insights > your-app-insights

### Function App Logs

View logs in real-time:
```bash
az webapp log tail --name <function-app-name> --resource-group <resource-group>
```

### Common Issues

1. **Key Vault Access**: Ensure Function App has proper permissions
2. **CORS Errors**: Check Static Web App configuration
3. **Build Failures**: Verify Node.js versions match
4. **API Timeouts**: Check Function App timeout settings

## Cost Optimization

### Free Tier Usage

- **Static Web Apps**: 100GB bandwidth/month free
- **Functions**: 1M requests + 400,000 GB-s free
- **Key Vault**: 10,000 operations free
- **Application Insights**: 5GB data/month free

### Monitoring Costs

```bash
# Check current costs
az consumption usage list --start-date 2024-01-01 --end-date 2024-01-31
```

## Scaling Considerations

### Auto-scaling

Azure Functions automatically scale based on demand:
- **Consumption Plan**: Pay per execution
- **Premium Plan**: Pre-warmed instances for better performance

### Performance Optimization

1. **CDN Configuration**: Cache static assets
2. **Function Optimization**: Minimize cold starts
3. **Database Optimization**: Use connection pooling

## Security Best Practices

1. **Regular Key Rotation**: Update API keys quarterly
2. **Access Reviews**: Review Key Vault access policies
3. **Monitoring**: Set up alerts for unusual activity
4. **Backup**: Regular backup of configurations

## Next Steps

After successful deployment:

1. **Custom Domain**: Configure custom domain for Static Web App
2. **SSL Certificate**: Set up custom SSL if using custom domain
3. **Monitoring**: Configure additional Application Insights alerts
4. **Backup Strategy**: Set up automated backups
5. **CI/CD Enhancement**: Add testing and staging environments

## Support

For issues with this deployment:

1. Check Azure Portal for error messages
2. Review Application Insights logs
3. Verify GitHub Actions workflow status
4. Check Key Vault access permissions

## Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [GitHub Actions for Azure](https://docs.microsoft.com/en-us/azure/developer/github/)