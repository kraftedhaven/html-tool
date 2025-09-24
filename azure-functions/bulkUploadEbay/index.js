const axios = require('axios');
const { getEbayAccessToken } = require('../shared/ebayAuth');

const EBAY_BASE = (process.env.EBAY_ENV || 'production') === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';
const { EBAY_FULFILLMENT_POLICY_ID, EBAY_PAYMENT_POLICY_ID, EBAY_RETURN_POLICY_ID } = process.env;

module.exports = async function (context, req) {
    context.log('Bulk Upload eBay function processing a request.');

    const { listings } = req.body;
    if (!listings || !Array.isArray(listings) || listings.length === 0) {
        context.res = { status: 400, body: { error: 'No listings provided.' } };
        return;
    }

    try {
        const token = await getEbayAccessToken();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        };

        const inventoryRequests = listings.map(item => ({
            sku: item.sku,
            product: {
                title: item.title,
                description: item.description,
                imageUrls: item.imageUrls,
                aspects: { Brand: [item.brand], Size: [item.size], Color: [item.color], },
            },
            condition: item.condition || 'USED_EXCELLENT',
            availability: { shipToLocationAvailability: { quantity: 1 } }
        }));
        await axios.post(`${EBAY_BASE}/sell/inventory/v1/bulk_create_or_replace_inventory_item`, { requests: inventoryRequests }, { headers });

        const offerRequests = listings.map(item => ({
            sku: item.sku, marketplaceId: 'EBAY_US', format: 'FIXED_PRICE',
            listingDescription: item.description, availableQuantity: 1, categoryId: item.categoryId,
            listingPolicies: {
                fulfillmentPolicyId: EBAY_FULFILLMENT_POLICY_ID,
                paymentPolicyId: EBAY_PAYMENT_POLICY_ID,
                returnPolicyId: EBAY_RETURN_POLICY_ID,
            },
            pricingSummary: { price: { value: item.price, currency: 'USD' } },
        }));
        const offerResponse = await axios.post(`${EBAY_BASE}/sell/inventory/v1/bulk_create_offer`, { requests: offerRequests }, { headers });
        const offerIds = offerResponse.data.responses.filter(r => r.offerId).map(r => r.offerId);

        const publishRequests = offerIds.map(offerId => ({ offerId }));
        const publishResponse = await axios.post(`${EBAY_BASE}/sell/inventory/v1/bulk_publish_offer`, { requests: publishRequests }, { headers });

        context.res = { status: 200, body: { success: true, data: publishResponse.data } };

    } catch (error) {
        context.log.error('eBay Bulk Upload Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        context.res = { status: 500, body: { error: 'Failed during eBay bulk upload process.', details: error.response?.data } };
    }
};
