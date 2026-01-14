# Deployment Guide

This document provides instructions for deploying the HTML Tool application to Azure.

## Prerequisites

Before deploying, ensure you have:

1. An Azure account with an active subscription
2. GitHub repository secrets configured (see below)
3. Azure Static Web Apps resource created
4. Azure Functions resource created

## Required GitHub Secrets

Configure the following secrets in your GitHub repository (Settings → Secrets and variables → Actions):

### Azure Static Web Apps Deployment
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: Deployment token from your Azure Static Web Apps resource
  - Find this in Azure Portal → Your Static Web App → Overview → Manage deployment token

### Azure Functions Deployment
- `AZURE_FUNCTIONAPP_NAME`: Name of your Azure Functions app
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`: Publish profile for your Azure Functions app
  - Download from Azure Portal → Your Function App → Overview → Get publish profile

### Optional Environment Variables
- `VITE_API_BASE_URL`: Base URL for API calls (used during frontend build)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for payment processing

## Deployment Workflows

### Automatic Deployment

The application uses GitHub Actions for automated deployment:

1. **Azure Static Web Apps CI/CD** (`.github/workflows/azure-static-web-apps.yml`)
   - Triggers on: Push to `main` branch, Pull Requests
   - Deploys: Frontend application and Azure Functions API
   - Status: [![Deploy Status](https://github.com/kraftedhaven/html-tool/workflows/Azure%20Static%20Web%20Apps%20CI/CD/badge.svg)](https://github.com/kraftedhaven/html-tool/actions/workflows/azure-static-web-apps.yml)

2. **Deploy Azure Functions** (`.github/workflows/azure-functions.yml`)
   - Triggers on: Push to `main` branch (when azure-functions/** files change), Manual workflow dispatch
   - Deploys: Azure Functions backend
   - Status: [![Deploy Status](https://github.com/kraftedhaven/html-tool/workflows/Deploy%20Azure%20Functions/badge.svg)](https://github.com/kraftedhaven/html-tool/actions/workflows/azure-functions.yml)

### Manual Deployment

To manually trigger a deployment:

1. Go to GitHub Actions tab in your repository
2. Select "Deploy Azure Functions" workflow
3. Click "Run workflow"
4. Choose the branch and click "Run workflow"

## Build Process

### Frontend
```bash
cd frontend
npm ci
npm run build
```

The frontend is built using Vite and creates a production bundle in `frontend/dist/`.

### Azure Functions
```bash
cd azure-functions
npm ci
```

Azure Functions are deployed as-is (no build step required).

## Environment Variables

### Frontend (Vite)
Environment variables for the frontend should be prefixed with `VITE_`:
- `VITE_API_BASE_URL`: API endpoint URL
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe public key

### Azure Functions
Configure these in your Azure Functions App Settings:
- `OPENAI_API_KEY`: OpenAI API key for neural suggestions
- `EBAY_APP_ID`: eBay application ID
- `EBAY_CERT_ID`: eBay certificate ID
- `EBAY_DEV_ID`: eBay developer ID
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret (whsec_...)
- Additional secrets as needed

## Webhook Configuration

### Finding Your Webhook URL

After deploying your Azure Function App, you'll need to configure webhooks in Stripe. Your webhook URL will be:

```
https://YOUR-FUNCTION-APP-NAME.azurewebsites.net/api/webhooks/stripe
```

**To find your Function App name:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Function App"
3. Find your function app in the list
4. The name is shown in the "Overview" section
5. Your webhook URL will be: `https://[NAME].azurewebsites.net/api/webhooks/stripe`

**To configure in Stripe:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL
4. Select events: `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`
5. Save and copy the signing secret (starts with `whsec_...`)
6. Add the signing secret to your Azure Function App settings as `STRIPE_WEBHOOK_SECRET`

For detailed webhook setup instructions, see [Subscription System Setup Guide](azure-functions/docs/subscription-system-setup.md).

## Troubleshooting

### Deployment Fails with "Missing Secrets"
- Verify all required secrets are configured in GitHub repository settings
- Check secret names match exactly (case-sensitive)

### Build Errors
- Ensure all dependencies are properly installed
- Check Node.js version compatibility (v18.x recommended)
- Review error logs in GitHub Actions

### Linting Warnings
- The codebase currently has some ESLint warnings/errors that are non-blocking
- These are logged during deployment but do not prevent deployment
- It's recommended to fix these incrementally to improve code quality

### Function App Issues
- Verify publish profile is current
- Check function app configuration in Azure Portal
- Review Application Insights logs for runtime errors

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
