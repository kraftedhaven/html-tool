# Azure Key Vault Secrets Configuration

This document outlines all the secrets that need to be configured in Azure Key Vault for the Neural Listing Engine to function properly.

## Required Secrets

### OpenAI Configuration
- `openai-api-key`: Your OpenAI API key for image analysis

### eBay API Configuration
- `ebay-client-id`: KorinnCl-lumora-PRD-3d47d6511-00772b32
- `ebay-client-secret`: PRD-d47d65116e36-5d1c-46fb-8f55-e744
- `ebay-refresh-token`: v^1.1#i^1#f^0#r^0#p^3#I^3#t^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
- `ebay-fulfillment-policy-id`: https://www.hiddenhaventhreads.com/privacy
- `ebay-payment-policy-id`: eBay payment policy ID
- `ebay-return-policy-id`: eBay return policy ID

### Facebook Marketplace API Configuration
- `facebook-app-id`: Facebook app ID
- `facebook-app-secret`: Facebook app secret
- `facebook-access-token`: Facebook long-lived access token
- `facebook-refresh-token`: Facebook refresh token (if available)

### Etsy API Configuration
- `etsy-client-id`: Etsy application client ID (keystring)
- `etsy-client-secret`: gqjdo5obmz
- `etsy-access-token`: Etsy OAuth access token
- `etsy-refresh-token`: Etsy OAuth refresh token

### Azure Configuration
- `azure-redis-connection-string`: Azure Redis Cache connection string (optional)
- `applicationinsights-connection-string`: Application Insights connection string (optional)

## Environment Variables

The following environment variables should be set in your Azure Functions configuration:

```bash
# Azure Key Vault
AZURE_KEY_VAULT_URL=https://your-keyvault.vault.azure.net/

# Azure Redis Cache (optional)
AZURE_REDIS_CONNECTION_STRING=your-redis-connection-string

# Application Insights (optional)
APPLICATIONINSIGHTS_CONNECTION_STRING=your-app-insights-connection-string

# eBay Environment
EBAY_ENV=production  # or 'sandbox' for testing
```

## Setting Up Secrets

### Using Azure CLI

```bash
# Set OpenAI secret
az keyvault secret set --vault-name "your-keyvault" --name "openai-api-key" --value "your-openai-key"

# Set eBay secrets
az keyvault secret set --vault-name "your-keyvault" --name "ebay-client-id" --value "your-ebay-client-id"
az keyvault secret set --vault-name "your-keyvault" --name "ebay-client-secret" --value "your-ebay-client-secret"
az keyvault secret set --vault-name "your-keyvault" --name "ebay-refresh-token" --value "your-ebay-refresh-token"

# Set Facebook secrets
az keyvault secret set --vault-name "your-keyvault" --name "facebook-app-id" --value "your-facebook-app-id"
az keyvault secret set --vault-name "your-keyvault" --name "facebook-app-secret" --value "your-facebook-app-secret"
az keyvault secret set --vault-name "your-keyvault" --name "facebook-access-token" --value "your-facebook-token"

# Set Etsy secrets
az keyvault secret set --vault-name "your-keyvault" --name "etsy-client-id" --value "your-etsy-client-id"
az keyvault secret set --vault-name "your-keyvault" --name "etsy-client-secret" --value "your-etsy-client-secret"
az keyvault secret set --vault-name "your-keyvault" --name "etsy-access-token" --value "your-etsy-access-token"
az keyvault secret set --vault-name "your-keyvault" --name "etsy-refresh-token" --value "your-etsy-refresh-token"
```

### Using Azure Portal

1. Navigate to your Key Vault in the Azure Portal
2. Go to "Secrets" in the left menu
3. Click "Generate/Import"
4. Set the name and value for each secret listed above

## Security Best Practices

1. **Access Policies**: Ensure your Azure Functions have the minimum required permissions (Get, List for secrets)
2. **Managed Identity**: Use Azure Managed Identity for authentication instead of connection strings when possible
3. **Secret Rotation**: Implement regular secret rotation for long-lived tokens
4. **Monitoring**: Enable Key Vault logging and monitoring
5. **Network Security**: Restrict Key Vault access to specific networks if possible

## Token Refresh Mechanism

The system automatically handles token refresh for:
- eBay access tokens (using refresh token)
- Facebook access tokens (using token exchange)
- Etsy access tokens (using refresh token)

Tokens are cached in Azure Redis (if configured) or in-memory to minimize Key Vault calls and improve performance.

## Troubleshooting

### Common Issues

1. **Key Vault Access Denied**: Ensure the Azure Functions Managed Identity has proper access policies
2. **Secret Not Found**: Verify secret names match exactly (case-sensitive)
3. **Token Refresh Failures**: Check that refresh tokens are valid and not expired
4. **Redis Connection Issues**: Verify Redis connection string and network access

### Fallback Behavior

If Key Vault is unavailable, the system will:
1. Fall back to environment variables (for development)
2. Use cached tokens if available
3. Log warnings and continue with limited functionality

This ensures the system remains operational even during Key Vault maintenance or connectivity issues.