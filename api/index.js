import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import axios from 'axios';
import { Multer } from 'multer';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // No change needed here

// eBay API Configuration
const EBAY_ENV = process.env.EBAY_ENV || 'production';
const EBAY_BASE = EBAY_ENV === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';
const EBAY_OAUTH_TOKEN_URL = `${EBAY_BASE}/identity/v1/oauth2/token`;
const EBAY_FINDING_API_URL = `https://svcs.ebay.com/services/search/FindingService/v1`;

// Multer setup for file uploads in a serverless environment
const upload = new Multer({ storage: Multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- Helper Functions ---
async function getEbayAccessToken() {
    const { EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_REFRESH_TOKEN } = process.env;
    const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');

    try {
        const response = await axios.post(EBAY_OAUTH_TOKEN_URL, new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: EBAY_REFRESH_TOKEN,
            scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/commerce.taxonomy.readonly'
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            }
        }, { timeout: 10000 }); // 10-second timeout
        return response.data.access_token;
    } catch (error) {
        console.error('Error refreshing eBay token:', error.response ? error.response.data : error.message);
        throw new Error('Could not refresh eBay access token.');
    }
}

// --- API Endpoints ---

// Analyze Images with OpenAI Vision
app.post('/api/analyze-images', upload.array('images'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded.' });
    }

    try {
        const analysisPromises = req.files.map(async (file) => {
            const imageAsBase64 = file.buffer.toString('base64');
            const dataUrl = `data:${file.mimetype};base64,${imageAsBase64}`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" },
                messages: [{
                    role: 'system',
                    content: 'You are an expert e-commerce lister. Analyze the product image and return a structured JSON object. Be accurate and concise.'
                }, {
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: `Analyze the product in the image for an e-commerce listing. Generate a compelling SEO-friendly title. Identify brand, product type, size, colors, condition, key features, estimated manufacture year, country of manufacture, material, fabric type, and theme. Suggest a market price based on the item's attributes. Return ONLY a valid JSON object with this schema: {"seoTitle": string, "brand": string, "productType": string, "size": string, "color": {"primary": string, "secondary": string}, "condition": string, "keyFeatures": string, "estimatedYear": number | "", "countryOfManufacture": string, "material": string, "fabricType": string, "theme": string, "suggestedPrice": number, "confidence": number}`
                    }, {
                        type: 'image_url',
                        image_url: { url: dataUrl, detail: 'low' }
                    }]
                }],
                max_tokens: 1000,
                temperature: 0.1,
            });

            let parsedJson = JSON.parse(completion.choices[0].message.content);

            // Fetch eBay category suggestion
            let categoryInfo = {};
            try {
                const token = await getEbayAccessToken();
                const query = encodeURIComponent(parsedJson.productType || parsedJson.title || 'item');
                const categoryResponse = await axios.get(
                    `${EBAY_BASE}/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${query}`, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 10000 // 10-second timeout
                    },
                );
                const suggestion = categoryResponse.data.categorySuggestions?.[0]?.category;
                if (suggestion) {
                    categoryInfo = { categoryId: suggestion.categoryId, categoryName: suggestion.categoryName };
                }
            } catch (catError) {
                console.error("Could not fetch eBay category:", catError.message);
            }

            return { ...parsedJson, ...categoryInfo };
        });

        const results = await Promise.all(analysisPromises);
        res.json({ success: true, data: results });

    } catch (error) {
        console.error('Error in /api/analyze-images:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload Images to eBay EPS (Note: This uses a legacy API. Modern solutions use different flows)
app.post('/api/ebay/upload-images', upload.array('images'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images provided for eBay upload.' });
    }

    try {
        const token = await getEbayAccessToken();
        const uploadPromises = req.files.map(async (file) => {
            const fileBuffer = file.buffer;
            const boundary = `----WebKitFormBoundary${Math.random().toString(16).substr(2)}`;
            
            const postData = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="image"; filename="image.jpg"',
                'Content-Type: image/jpeg',
                '',
                fileBuffer,
                `--${boundary}--`,
                ''
            ].join('\r\n');

            const response = await axios.post(`${EBAY_BASE}/sell/inventory/v1/image`, postData, {
                 headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                 }
            });
            // The new image URL is in the Location header
            const imageUrl = response.headers.location;
            if (imageUrl) {
                 return { originalFilename: file.originalname, epsImageUrl: imageUrl };
            }
            throw new Error(`Failed to get image URL for ${file.originalname}`);
        });

        const uploaded = await Promise.all(uploadPromises);
        res.json({ success: true, uploaded });
    } catch (error) {
        console.error('eBay Image Upload Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to upload images to eBay.' });
    }
});


// Bulk Create and Publish eBay Listings
app.post('/api/bulk-upload-ebay', async (req, res) => {
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

        // Step 1: Bulk Create/Update Inventory Items
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

        // Step 2: Bulk Create Offers
        const offerRequests = listings.map(item => ({
            sku: item.sku, marketplaceId: 'EBAY_US', format: 'FIXED_PRICE',
            listingDescription: item.description, availableQuantity: 1, categoryId: item.categoryId,
            listingPolicies: {
                fulfillmentPolicyId: process.env.EBAY_FULFILLMENT_POLICY_ID,
                paymentPolicyId: process.env.EBAY_PAYMENT_POLICY_ID,
                returnPolicyId: process.env.EBAY_RETURN_POLICY_ID,
            },
            pricingSummary: { price: { value: item.price, currency: 'USD' } },
        }));
        const offerResponse = await axios.post(`${EBAY_BASE}/sell/inventory/v1/bulk_create_offer`, { requests: offerRequests }, { headers });
        const offerIds = offerResponse.data.responses.filter(r => r.offerId).map(r => r.offerId);

        // Step 3: Bulk Publish Offers
        const publishRequests = offerIds.map(offerId => ({ offerId }));
        const publishResponse = await axios.post(`${EBAY_BASE}/sell/inventory/v1/bulk_publish_offer`, { requests: publishRequests }, { headers });

        res.json({ success: true, data: publishResponse.data });

    } catch (error) {
        console.error('eBay Bulk Upload Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        res.status(500).json({ error: 'Failed during eBay bulk upload process.', details: error.response?.data });
    }
});

// Calculate Sold-Through Rate from eBay
app.post('/api/ebay/str', async (req, res) => {
    const { query, categoryId } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'A search query is required.' });
    }

    const params = new URLSearchParams({
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': process.env.EBAY_CLIENT_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        'keywords': query,
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true',
        'paginationInput.entriesPerPage': '1'
    });
    if (categoryId) params.append('categoryId', categoryId);

    const activeParams = new URLSearchParams(params);
    activeParams.set('OPERATION-NAME', 'findItemsAdvanced');
    activeParams.delete('itemFilter(0).name');
    activeParams.delete('itemFilter(0).value');

    try {
        const [soldResponse, activeResponse] = await Promise.all([
            axios.get(`${EBAY_FINDING_API_URL}?${params.toString()}`, { timeout: 15000 }),
            axios.get(`${EBAY_FINDING_API_URL}?${activeParams.toString()}`, { timeout: 15000 })
        ]);

        const soldCount = soldResponse.data.findCompletedItemsResponse[0].paginationOutput[0].totalEntries[0] || '0';
        const activeCount = activeResponse.data.findItemsAdvancedResponse[0].paginationOutput[0].totalEntries[0] || '0';
        
        const total = parseInt(soldCount) + parseInt(activeCount);
        const str = total > 0 ? (parseInt(soldCount) / total) * 100 : 0;

        res.json({ success: true, soldCount, activeCount, str: str.toFixed(2) });
    } catch (error) {
        console.error('eBay STR Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to calculate STR from eBay.' });
    }
});

// Export the app for Vercel
export default app;