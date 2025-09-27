# Subscription Management System Setup Guide

## Overview

This guide walks you through setting up the complete SaaS subscription management system for Hidden Haven Threads Neural Listing Engine.

## Prerequisites

1. **Stripe Account**: Create a Stripe account at https://stripe.com
2. **Azure Cosmos DB**: Set up a Cosmos DB instance
3. **Azure Key Vault**: Configure Key Vault for secure secrets management

## 1. Stripe Configuration

### Create Products and Prices

1. **Login to Stripe Dashboard**
2. **Create Products**:

   **Basic Plan**:
   - Name: "Neural Listing Engine - Basic"
   - Description: "100 listings/month, 50 AI analyses, eBay integration"
   - Price: $29.00/month

   **Pro Plan**:
   - Name: "Neural Listing Engine - Pro" 
   - Description: "500 listings/month, 250 AI analyses, eBay + Facebook integration"
   - Price: $67.00/month

   **Enterprise Plan**:
   - Name: "Neural Listing Engine - Enterprise"
   - Description: "Unlimited listings, unlimited AI analyses, all marketplaces"
   - Price: $97.00/month

3. **Configure Webhooks**:
   - Endpoint: `https://your-function-app.azurewebsites.net/api/webhooks/stripe`
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### Get Required Keys

From your Stripe Dashboard, collect:
- Secret Key (sk_live_... or sk_test_...)
- Publishable Key (pk_live_... or pk_test_...)
- Webhook Secret (whsec_...)
- Product IDs for each plan
- Price IDs for each plan

## 2. Environment Variables Configuration

### Azure Functions (.env)

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_BASIC_PRODUCT_ID=prod_basic_product_id
STRIPE_BASIC_PRICE_ID=price_basic_price_id
STRIPE_PRO_PRODUCT_ID=prod_pro_product_id
STRIPE_PRO_PRICE_ID=price_pro_price_id
STRIPE_ENTERPRISE_PRODUCT_ID=prod_enterprise_product_id
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_price_id

# Database Configuration
COSMOS_DB_ENDPOINT=https://your-cosmosdb.documents.azure.com:443/
COSMOS_DB_KEY=your_cosmos_db_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_minimum_32_characters

# Azure Key Vault (for production)
AZURE_KEY_VAULT_URL=https://your-keyvault.vault.azure.net/
```

### Frontend (.env)

```bash
# API Configuration
VITE_API_BASE_URL=https://your-function-app.azurewebsites.net/api

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## 3. Azure Key Vault Setup (Production)

Store these secrets in Azure Key Vault:
- `STRIPE-SECRET-KEY`
- `STRIPE-WEBHOOK-SECRET`
- `JWT-SECRET`
- `COSMOS-DB-KEY`
- `OPENAI-API-KEY`
- `EBAY-CLIENT-SECRET`

## 4. Database Schema

The system automatically creates these Cosmos DB containers:
- `users` - User accounts and authentication
- `subscriptions` - Subscription plans and billing status
- `usageTracking` - Monthly usage statistics

## 5. Testing the System

### Local Development

1. **Start Azure Functions**:
   ```bash
   cd azure-functions
   npm install
   func start
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Test Registration Flow**:
   - Navigate to http://localhost:5173
   - Click "Sign Up"
   - Fill out registration form
   - Select a plan
   - Complete registration

### API Endpoints

The system provides these endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/subscription/plans` - Get available plans
- `POST /api/subscription/update-plan` - Change subscription plan
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/user/profile` - Get user profile and subscription
- `GET /api/user/usage` - Get usage statistics
- `POST /api/subscription/billing-portal` - Create Stripe billing portal
- `POST /api/webhooks/stripe` - Stripe webhook handler

## 6. Deployment

### Azure Functions Deployment

1. **Deploy via Azure CLI**:
   ```bash
   az functionapp deployment source config-zip \
     --resource-group your-resource-group \
     --name your-function-app \
     --src azure-functions.zip
   ```

2. **Configure Application Settings**:
   ```bash
   az functionapp config appsettings set \
     --resource-group your-resource-group \
     --name your-function-app \
     --settings STRIPE_SECRET_KEY=your_key
   ```

### Frontend Deployment

Deploy to Azure Static Web Apps:
```bash
az staticwebapp create \
  --name your-static-web-app \
  --resource-group your-resource-group \
  --source https://github.com/your-repo \
  --location "Central US" \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist"
```

## 7. Monitoring and Analytics

### Stripe Dashboard
- Monitor subscription metrics
- Track revenue and churn
- Manage customer billing issues

### Azure Monitor
- Function execution logs
- Performance metrics
- Error tracking

### Usage Analytics
- Track API usage per user
- Monitor feature adoption
- Identify upgrade opportunities

## 8. Security Considerations

1. **API Authentication**: All protected endpoints require JWT tokens
2. **Webhook Verification**: Stripe webhooks are verified using signatures
3. **Key Vault Integration**: Production secrets stored securely
4. **HTTPS Only**: All communication encrypted
5. **Input Validation**: All user inputs validated and sanitized

## 9. Troubleshooting

### Common Issues

1. **Stripe Webhook Failures**:
   - Check webhook endpoint URL
   - Verify webhook secret
   - Check Azure Function logs

2. **Database Connection Issues**:
   - Verify Cosmos DB endpoint and key
   - Check network connectivity
   - Review firewall settings

3. **Authentication Problems**:
   - Verify JWT secret configuration
   - Check token expiration
   - Review CORS settings

### Debug Commands

```bash
# Test subscription system
node test-subscription-system.js

# Check Azure Function logs
az functionapp log tail --name your-function-app --resource-group your-resource-group

# Test Stripe webhook locally
stripe listen --forward-to localhost:7071/api/webhooks/stripe
```

## 10. Next Steps

After completing the subscription system setup:

1. **Implement Usage Tracking** (Task 7.2)
2. **Build SaaS Frontend Interface** (Task 7.3)
3. **Add Feature Gating** to existing API endpoints
4. **Set up Admin Dashboard** for subscription management
5. **Configure Monitoring and Alerts**

## Support

For issues with the subscription system:
1. Check Azure Function logs
2. Review Stripe webhook events
3. Verify environment variable configuration
4. Test with Stripe test mode first