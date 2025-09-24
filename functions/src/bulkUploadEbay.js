import functions from 'firebase-functions';
import cors from 'cors';
import axios from 'axios';
import { getEbayAccessToken } from './helpers/ebayAuth.js';

const EBAY_BASE = (functions.config().ebay?.env || 'production') === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';
const { fulfillment_policy_id, payment_policy_id, return_policy_id } = functions.config().ebay;

const corsHandler = cors({ origin: true });

export const bulkUploadEbay = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { listings } = req.body;
        if (!listings || !Array.isArray(listings) || listings.length === 0) {
            return res.status(400).json({ error: 'No listings provided.' });
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
                    fulfillmentPolicyId: fulfillment_policy_id,
                    paymentPolicyId: payment_policy_id,
                    returnPolicyId: return_policy_id,
                },
                pricingSummary: { price: { value: item.price, currency: 'USD' } },
            }));
            const offerResponse = await axios.post(`${EBAY_BASE}/sell/inventory/v1/bulk_create_offer`, { requests: offerRequests }, { headers });
            const offerIds = offerResponse.data.responses.filter(r => r.offerId).map(r => r.offerId);

            const publishRequests = offerIds.map(offerId => ({ offerId }));
            const publishResponse = await axios.post(`${EBAY_BASE}/sell/inventory/v1/bulk_publish_offer`, { requests: publishRequests }, { headers });

            res.json({ success: true, data: publishResponse.data });

        } catch (error) {
            console.error('eBay Bulk Upload Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            res.status(500).json({ error: 'Failed during eBay bulk upload process.', details: error.response?.data });
        }
    });
});
