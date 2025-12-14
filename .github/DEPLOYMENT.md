# Deployment Configuration

This document describes the deployment workflows and required secrets for this repository.

## Workflows

### Frontend Build (`frontend-ci.yml`)
**Status:** ✅ Active

This workflow builds and tests the frontend application on every push to main and pull requests.

**Requirements:**
- No secrets required
- Automatically runs on all branches

**What it does:**
- Installs dependencies
- Builds the frontend application
- Uploads the build artifacts

---

### Azure Functions Deployment (`azure-functions.yml`)
**Status:** ⚠️  Requires Configuration

This workflow deploys Azure Functions when changes are pushed to the `azure-functions/` directory.

**Required Secrets:**
To enable this workflow, configure these repository secrets in Settings → Secrets and variables → Actions:

- `AZURE_FUNCTIONAPP_NAME` - The name of your Azure Function App
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` - The publish profile from your Azure Function App

**How to get the publish profile:**
1. Go to your Azure Function App in the Azure Portal
2. Click "Get publish profile" in the Overview section
3. Copy the entire XML content
4. Add it as the `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` secret

**Workflow behavior:**
- If secrets are not configured: Build succeeds, deployment is skipped with a notice
- If secrets are configured: Build and deploy to Azure Functions

---

### Azure Static Web Apps CI/CD (`azure-static-web-apps.yml`)
**Status:** ⚠️  Requires Configuration

This workflow builds and deploys the full application (frontend + backend) to Azure Static Web Apps.

**Required Secrets:**
To enable this workflow, configure these repository secrets in Settings → Secrets and variables → Actions:

- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Deployment token from Azure Static Web Apps
- `VITE_API_BASE_URL` (optional) - Base URL for the API

**How to get the API token:**
1. Go to your Azure Static Web App in the Azure Portal
2. Navigate to "Manage deployment token"
3. Copy the deployment token
4. Add it as the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret

**Workflow behavior:**
- If secrets are not configured: Build succeeds, deployment is skipped with a notice
- If secrets are configured: Build and deploy to Azure Static Web Apps

---

## Setting Up Secrets

To configure repository secrets:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

## Local Development

For local development, you don't need any of these secrets. The frontend build workflow will run successfully without them, and you can develop and test locally using:

```bash
# Frontend development
cd frontend
npm install
npm run dev

# Azure Functions development
cd azure-functions
npm install
npm run start
```

## Questions?

If you have questions about deployment configuration, please check the Azure documentation or contact the repository maintainers.
