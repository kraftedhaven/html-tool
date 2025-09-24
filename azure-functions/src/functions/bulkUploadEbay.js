import { app } from '@azure/functions';
import axios from 'axios';
import { keyVault } from '../utils/keyVault.js';

// eBay API Configuration
const EBAY_ENV = process.env.EBAY_ENV || 'production';
const EBAY_BASE = EBAY_ENV === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';
const EBAY_OAUTH_TOKEN_URL = `${EBAY_BASE}/identity/v1/oauth2/token`;

// In-memory cache for eBay token
let ebayTokenCache = {
    token: null,
    expiresAt: 0,
};

async function getEbayAccessToken() {
    // Return cached token if it's still valid
    if (ebayTokenCache.token && Date.now() < ebayTokenCache.expiresAt) {
        return ebayTokenCache.token;
    }

    const secrets = await keyVault.getSecrets([
        'ebay-client-id',
        'ebay-client-secret', 
        'ebay-refresh-token'
    ]);

    const credentials = Buffer.from(`${secrets['ebay-client-id']}:${secrets['ebay-client-secret']}`).toString('base64');

    try {
        console.log('Refreshing eBay access token...');
        const data = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: secrets['ebay-refresh-token'],
            scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/commerce.taxonomy.readonly'
        });
        
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            timeout: 10000
        };

        const response = await axios.post(EBAY_OAUTH_TOKEN_URL, data, config);
        const { access_token, expires_in } = response.data;

        // Set the expiration time to be 5 minutes before the actual expiration
        const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
        ebayTokenCache.token = access_token;
        ebayTokenCache.expiresAt = Date.now() + (expires_in * 1000) - buffer;

        return access_token;
    } catch (error) {
        console.error('Error refreshing eBay token:', error.response ? error.response.data : error.message);
        throw new Error('Could not refresh eBay access token.');
    }
}

app.http('bulkUploadEbay', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { listings } = await request.json();
            
            if (!listings || !Array.isArray(listings) || listings.length === 0) {
                return {
                    status: 400,
                    jsonBody: { error: 'No listings provided.' }
                };
            }

            const token = await getEbayAccessToken();
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
            };

            // Get eBay policy IDs from Key Vault
            const policySecrets = await keyVault.getSecrets([
                'ebay-fulfillment-policy-id',
                'ebay-payment-policy-id',
                'ebay-return-policy-id'
            ]);

            // Step 1: Bulk Create/Update Inventory Items
            const inventoryRequests = listings.map(item => ({
                sku: item.sku,
                product: {
                    title: item.title,
                    description: item.description,
                    imageUrls: item.imageUrls,
                    aspects: { 
                        Brand: [item.brand], 
                        Size: [item.size], 
                        Color: [item.color] 
                    },
                },
                condition: item.condition || 'USED_EXCELLENT',
                availability: { 
                    shipToLocationAvailability: { quantity: 1 } 
                }
            }));

            await axios.post(
                `${EBAY_BASE}/sell/inventory/v1/bulk_create_or_replace_inventory_item`, 
                { requests: inventoryRequests }, 
                { headers }
            );

            // Step 2: Bulk Create Offers
            const offerRequests = listings.map(item => ({
                sku: item.sku, 
                marketplaceId: 'EBAY_US', 
                format: 'FIXED_PRICE',
                listingDescription: item.description, 
                availableQuantity: 1, 
                categoryId: item.categoryId,
                listingPolicies: {
                    fulfillmentPolicyId: policySecrets['ebay-fulfillment-policy-id'],
                    paymentPolicyId: policySecrets['ebay-payment-policy-id'],
                    returnPolicyId: policySecrets['ebay-return-policy-id'],
                },
                pricingSummary: { 
                    price: { value: item.price, currency: 'USD' } 
                },
            }));

            const offerResponse = await axios.post(
                `${EBAY_BASE}/sell/inventory/v1/bulk_create_offer`, 
                { requests: offerRequests }, 
                { headers }
            );

            const offerIds = offerResponse.data.responses
                .filter(r => r.offerId)
                .map(r => r.offerId);

            // Step 3: Bulk Publish Offers
            const publishRequests = offerIds.map(offerId => ({ offerId }));
            const publishResponse = await axios.post(
                `${EBAY_BASE}/sell/inventory/v1/bulk_publish_offer`, 
                { requests: publishRequests }, 
                { headers }
            );

            return {
                status: 200,
                jsonBody: { success: true, data: publishResponse.data }
            };

        } catch (error) {
            console.error('eBay Bulk Upload Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            return {
                status: 500,
                jsonBody: { 
                    error: 'Failed during eBay bulk upload process.', 
                    details: error.response?.data 
                }
            };
        }
    }
});