# Webhook Setup Quick Guide

## Finding Your Webhook URL

Your webhook URL depends on where your application is deployed. Use this guide to find the correct URL.

### For Azure Function App Deployment

Your webhook URL format is:
```
https://YOUR-FUNCTION-APP-NAME.azurewebsites.net/api/webhooks/stripe
```

**Steps to find YOUR-FUNCTION-APP-NAME:**

1. **Via Azure Portal:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Click "Function App" in the left menu (or search for it)
   - Find your function app in the list
   - The name is shown in the "Overview" section
   - Example: If the name is `neural-listing-prod`, your webhook URL is:
     ```
     https://neural-listing-prod.azurewebsites.net/api/webhooks/stripe
     ```

2. **Via Azure CLI:**
   ```bash
   # List all function apps in your subscription
   az functionapp list --query "[].{name:name, resourceGroup:resourceGroup}" -o table
   
   # Get the default hostname for a specific function app
   az functionapp show --name YOUR-FUNCTION-APP-NAME --resource-group YOUR-RESOURCE-GROUP --query "defaultHostName" -o tsv
   ```

3. **From Deployment Output:**
   - Check your GitHub Actions deployment logs
   - Look for the Function App URL in the deployment summary
   - The webhook endpoint will be at `/api/webhooks/stripe`

### For Azure Static Web Apps (with managed functions)

Your webhook URL format is:
```
https://YOUR-STATIC-WEB-APP.azurestaticapps.net/api/webhooks/stripe
```

Find your Static Web App URL:
- Azure Portal → Static Web Apps → Your resource → "URL" field

### For Local Development

For testing webhooks locally:
```
http://localhost:7071/api/webhooks/stripe
```

**Use Stripe CLI for local webhook testing:**
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward webhooks to your local endpoint
stripe listen --forward-to localhost:7071/api/webhooks/stripe

# This will output a webhook signing secret (whsec_...) - use this in your local .env file
```

## Configuring Webhooks in Stripe

Once you have your webhook URL:

### Step 1: Add Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**
3. Click **"Add endpoint"** button
4. Enter your webhook URL (from above)
5. Click **"Select events"**

### Step 2: Select Events

Select these events for the subscription system to work properly:

- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### Step 3: Save and Get Signing Secret

1. Click **"Add endpoint"**
2. On the webhook details page, find the **"Signing secret"** section
3. Click **"Reveal"** to see the signing secret
4. Copy the secret (it starts with `whsec_...`)

### Step 4: Configure Signing Secret

Add the signing secret to your application:

**For Azure Function App:**
```bash
# Via Azure Portal
Azure Portal → Function App → Configuration → Application Settings
Add new setting: STRIPE_WEBHOOK_SECRET = whsec_your_signing_secret

# Via Azure CLI
az functionapp config appsettings set \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group YOUR-RESOURCE-GROUP \
  --settings STRIPE_WEBHOOK_SECRET="whsec_your_signing_secret"
```

**For Local Development:**
Add to your `azure-functions/.env` file:
```
STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret
```

## Testing Your Webhook

### Test in Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select an event (e.g., `customer.subscription.updated`)
5. Click **"Send test webhook"**
6. Check the response - it should show a 200 OK status

### Test with Stripe CLI

```bash
# Trigger a test event
stripe trigger customer.subscription.created

# Trigger a payment success event
stripe trigger invoice.payment_succeeded
```

### Verify in Application Logs

**Azure Function App:**
```bash
# Via Azure CLI
az webapp log tail \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group YOUR-RESOURCE-GROUP

# Or via Azure Portal
Azure Portal → Function App → Monitoring → Log stream
```

**Local Development:**
Check the terminal where you ran `func start` or `npm start`

## Troubleshooting

### ❌ "Unable to connect to webhook endpoint"

**Problem:** Stripe cannot reach your webhook URL

**Solutions:**
- Verify the URL is correct and accessible
- Test by visiting the URL in a browser (you should see a response, not a 404)
- Ensure your Function App is running and deployed
- Check that HTTPS is enabled (Azure Functions use HTTPS by default)

### ❌ "Webhook signature verification failed"

**Problem:** The signing secret doesn't match

**Solutions:**
- Verify `STRIPE_WEBHOOK_SECRET` in your Function App configuration
- Ensure you copied the full secret including the `whsec_` prefix
- Check there are no extra spaces or characters
- If you recently changed the secret, restart your Function App

### ❌ "Can't find my Function App name"

**Problem:** You don't know where your application is deployed

**Solutions:**
- Check your GitHub repository settings for deployment secrets
- Look for `AZURE_FUNCTIONAPP_NAME` in your GitHub Secrets
- Check your deployment scripts or Bicep templates
- Ask your team or check deployment documentation

### ❌ "Webhook works in test mode but not live mode"

**Problem:** Different webhook secrets for test and live mode

**Solutions:**
- Stripe has separate webhooks for test and live mode
- You need to configure webhooks separately for each mode
- Test mode: Use test signing secret (whsec_test_...)
- Live mode: Use live signing secret (whsec_...)
- Update your environment variables accordingly

## Security Best Practices

1. **Always verify webhook signatures** - The application does this automatically
2. **Use HTTPS only** - Azure Functions enforce this by default
3. **Keep signing secrets secure** - Store in Azure Key Vault or Function App settings
4. **Monitor webhook failures** - Set up alerts for failed webhook deliveries
5. **Rotate secrets periodically** - Update signing secrets every 6-12 months

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Subscription System Setup Guide](azure-functions/docs/subscription-system-setup.md)

## Need More Help?

If you're still having trouble:

1. Check the [Subscription System Setup Guide](azure-functions/docs/subscription-system-setup.md) for detailed setup instructions
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment configuration
3. Check Azure Function logs for error messages
4. Verify all environment variables are set correctly
5. Test with Stripe CLI locally first before deploying
