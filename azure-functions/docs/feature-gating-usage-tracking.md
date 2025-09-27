# Feature Gating and Usage Tracking System

## Overview

This document describes the comprehensive feature gating and usage tracking system implemented for the SaaS platform. The system enforces subscription-based access controls and tracks usage across all platform features.

## Architecture

### Core Components

1. **Usage Tracking Middleware** (`src/middleware/usageTracking.js`)
   - Tracks API calls, listings created, and AI analyses
   - Enforces subscription limits
   - Provides feature access control

2. **Database Service** (`src/services/databaseService.js`)
   - Manages usage data persistence
   - Provides analytics and reporting functions

3. **Admin Dashboard** (`src/functions/adminDashboard.js`)
   - Subscription and user management
   - System-wide usage analytics
   - Feature usage reporting

4. **Subscription Models** (`src/models/subscriptionModels.js`)
   - Defines plan features and limits
   - Subscription status management

## Feature Gating

### Plan-Based Features

#### Basic Plan ($29/month)
- 100 listings/month
- 50 AI analyses/month
- eBay marketplace only
- No bulk upload
- No advanced analytics

#### Pro Plan ($67/month)
- 500 listings/month
- 250 AI analyses/month
- eBay + Facebook marketplaces
- Bulk upload enabled
- Advanced analytics enabled

#### Enterprise Plan ($97/month)
- Unlimited listings
- Unlimited AI analyses
- All marketplaces (eBay, Facebook, Etsy)
- Bulk upload enabled
- Advanced analytics enabled
- Priority support

### Implementation

#### Feature Access Middleware

```javascript
import { withFeatureAccess } from '../middleware/usageTracking.js';

// Protect endpoint with feature requirement
app.http('bulkUploadEbay', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: withFeatureAccess('bulkUploadEnabled')(async (request, context) => {
        // Endpoint logic here
    })
});
```

#### Marketplace Access Control

```javascript
import { checkMarketplaceAccess } from '../middleware/usageTracking.js';

// Protect marketplace-specific endpoints
app.http('facebookMarketplaceWorkflow', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: checkMarketplaceAccess('facebook')(async (request, context) => {
        // Facebook marketplace logic here
    })
});
```

## Usage Tracking

### Tracked Metrics

1. **Listings Created**
   - Tracked per listing creation
   - Enforces monthly limits based on plan
   - Includes bulk uploads

2. **AI Analyses**
   - Tracked per image analysis request
   - Enforces monthly limits based on plan
   - Includes batch processing

3. **API Calls**
   - Tracked for monitoring purposes
   - No limits enforced (unlimited for all plans)

### Implementation

#### Usage Tracking Middleware

```javascript
import { withUsageTracking } from '../middleware/usageTracking.js';

// Track usage for specific operations
app.http('analyzeImages', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: withUsageTracking('aiAnalysis', 1)(async (request, context) => {
        // AI analysis logic here
    })
});
```

#### Detailed Usage Tracking

```javascript
import { trackDetailedUsage } from '../middleware/usageTracking.js';

// Track with metadata for analytics
app.http('createListing', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: trackDetailedUsage('listings', { marketplace: 'ebay' })(async (request, context) => {
        // Listing creation logic here
    })
});
```

## Admin Dashboard

### User Management

#### Get All Users
```
GET /api/admin/users?limit=50&offset=0
Authorization: Bearer <admin_token>
```

#### Get User Details
```
GET /api/admin/users/{userId}
Authorization: Bearer <admin_token>
```

#### Update User Status
```
PUT /api/admin/users/{userId}/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isEmailVerified": true,
  "status": "active"
}
```

### Subscription Management

#### Get All Subscriptions
```
GET /api/admin/subscriptions?limit=50&offset=0
Authorization: Bearer <admin_token>
```

#### Update User Subscription
```
PUT /api/admin/users/{userId}/subscription
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "plan": "pro",
  "status": "active"
}
```

#### Get Subscription Statistics
```
GET /api/admin/subscription-stats
Authorization: Bearer <admin_token>
```

### Usage Analytics

#### Get System Usage Analytics
```
GET /api/admin/usage-analytics?days=30
Authorization: Bearer <admin_token>
```

#### Get Feature Usage Report
```
GET /api/admin/feature-usage-report?days=30
Authorization: Bearer <admin_token>
```

## Database Schema

### Usage Tracking Table
```sql
{
  "id": "string",
  "userId": "string",
  "subscriptionId": "string",
  "listingsCreated": "number",
  "aiAnalysesUsed": "number",
  "apiCallsMade": "number",
  "periodStart": "datetime",
  "periodEnd": "datetime",
  "createdAt": "datetime"
}
```

### Detailed Usage Table
```sql
{
  "id": "string",
  "userId": "string",
  "type": "string", // 'listings', 'aiAnalysis', 'apiCalls'
  "metadata": "object",
  "timestamp": "datetime",
  "subscriptionPlan": "string",
  "createdAt": "datetime"
}
```

## Error Responses

### Feature Not Available
```json
{
  "error": "Feature not available in current plan",
  "feature": "bulkUploadEnabled",
  "currentPlan": "basic",
  "upgradeRequired": true
}
```

### Usage Limit Exceeded
```json
{
  "error": "Usage limit exceeded",
  "limit": 100,
  "current": 100,
  "plan": "basic",
  "upgradeRequired": true
}
```

### Marketplace Access Denied
```json
{
  "error": "Facebook marketplace not available in basic plan",
  "marketplace": "facebook",
  "currentPlan": "basic",
  "requiredPlan": "pro",
  "upgradeRequired": true
}
```

## Testing

### Test Suite
Run the comprehensive test suite:
```bash
node azure-functions/test-feature-gating-usage-tracking.js
```

### Test Coverage
- ✅ Feature access control
- ✅ Usage tracking and limits
- ✅ Marketplace access control
- ✅ Admin dashboard functionality
- ✅ Plan upgrades and feature unlocking

## Configuration

### Environment Variables
```env
# Admin user IDs (comma-separated)
ADMIN_USER_IDS=user1,user2,user3

# Cosmos DB configuration
COSMOS_DB_ENDPOINT=https://your-cosmos-db.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmos-db-key

# Stripe configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Plan-specific Stripe IDs
STRIPE_BASIC_PRODUCT_ID=prod_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRODUCT_ID=prod_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRODUCT_ID=prod_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### Key Vault Secrets
- `JWT_SECRET`: JWT signing secret
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

## Monitoring and Analytics

### Key Metrics
1. **Usage by Plan**: Track feature usage across different subscription plans
2. **Limit Violations**: Monitor users hitting usage limits
3. **Feature Adoption**: Track which features are most used
4. **Upgrade Triggers**: Identify when users upgrade due to limits

### Dashboards
- Admin dashboard provides real-time usage analytics
- System health monitoring
- Revenue tracking by plan
- User engagement metrics

## Security Considerations

1. **JWT Authentication**: All endpoints require valid JWT tokens
2. **Admin Access Control**: Admin endpoints restricted to authorized users
3. **Rate Limiting**: Usage limits prevent abuse
4. **Data Privacy**: User data properly anonymized in analytics

## Future Enhancements

1. **Real-time Usage Alerts**: Notify users approaching limits
2. **Usage Predictions**: ML-based usage forecasting
3. **Custom Plans**: Allow custom subscription plans
4. **API Rate Limiting**: Implement API-level rate limiting
5. **Usage Optimization**: Suggest plan changes based on usage patterns