const functions = require("firebase-functions");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const { OpenAI } = require("openai");

admin.initializeApp();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 },
});

const getCfg = () => ({
    VERIFY_TOKEN: process.env.VERIFY_TOKEN,
    EBAY_ENV: process.env.EBAY_ENV || "production",
    EBAY_CLIENT_ID: process.env.EBAY_CLIENT_ID,
    EBAY_CLIENT_SECRET: process.env.EBAY_CLIENT_SECRET,
    EBAY_REFRESH_TOKEN: process.env.EBAY_REFRESH_TOKEN,
    EBAY_FULFILLMENT_POLICY_ID: process.env.EBAY_FULFILLMENT_POLICY_ID,
    EBAY_PAYMENT_POLICY_ID: process.env.EBAY_PAYMENT_POLICY_ID,
    EBAY_RETURN_POLICY_ID: process.env.EBAY_RETURN_POLICY_ID,
});

const EBAY_BASE = getCfg().EBAY_ENV === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';
const EBAY_OAUTH_TOKEN_URL = `${EBAY_BASE}/identity/v1/oauth2/token`;
const EBAY_FINDING_API_URL = `https://svcs.ebay.com/services/search/FindingService/v1`;

let ebayTokenCache = { token: null, expiresAt: 0 };

function guard(req, res) {
    const cfg = getCfg();
    const header = req.get("x-hht-key");
    if (!cfg.VERIFY_TOKEN || !header || header !== cfg.VERIFY_TOKEN) {
        res.status(401).json({ error: "unauthorized" });
        return true;
    }
    return false;
}

async function getEbayAccessToken() {
    if (ebayTokenCache.token && Date.now() < ebayTokenCache.expiresAt) {
        return ebayTokenCache.token;
    }
    const cfg = getCfg();
    const credentials = Buffer.from(`${cfg.EBAY_CLIENT_ID}:${cfg.EBAY_CLIENT_SECRET}`).toString('base64');
    try {
        logger.info('Refreshing eBay access token...');
        const data = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: cfg.EBAY_REFRESH_TOKEN,
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
        const buffer = 5 * 60 * 1000;
        ebayTokenCache.token = access_token;
        ebayTokenCache.expiresAt = Date.now() + (expires_in * 1000) - buffer;
        return access_token;
    } catch (error) {
        logger.error('Error refreshing eBay token:', error.response ? error.response.data : error.message);
        throw new Error('Could not refresh eBay access token.');
    }
}

exports.neuralSuggest = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        upload.array('images')(req, res, async (err) => {
            if (guard(req, res)) return;

            if (err) {
                logger.error("Multer error", err);
                return res.status(400).json({ error: `File upload error: ${err.message}` });
            }
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No images uploaded.' });
            }

            try {
                const results = [];
                for (const file of req.files) {
                    const b64 = file.buffer.toString('base64');
                    const openaiResp = await openai.chat.completions.create({
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
                                image_url: { url: `data:${file.mimetype};base64,${b64}`, detail: 'low' }
                            }]
                        }],
                        max_tokens: 1000,
                        temperature: 0.1,
                    });

                    let raw = openaiResp?.choices?.[0]?.message?.content || '{}';
                    raw = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
                    const parsed = JSON.parse(raw);

                    let best = {};
                    try {
                        const token = await getEbayAccessToken();
                        const q = encodeURIComponent(parsed.productType || parsed.title || 'general');
                        const url = `${EBAY_BASE}/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${q}`;
                        const { data: cat } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
                        best = cat?.categorySuggestions?.[0]?.category || {};
                    } catch (catError) {
                        logger.warn("Could not fetch eBay category", catError.message);
                    }

                    results.push({ ...parsed, categoryId: best.categoryId, categoryName: best.categoryName });
                }
                return res.json({ success: true, data: results });
            } catch (error) {
                logger.error("neuralSuggest failed", error);
                return res.status(500).json({ error: 'Failed to analyze images.' });
            }
        });
    });
});

exports.ebayComps = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (guard(req, res)) return;

        try {
            const { query, categoryId } = req.body;
            if (!query) {
                return res.status(400).json({ error: 'A search query is required.' });
            }

            const cfg = getCfg();
            const params = new URLSearchParams({
                'OPERATION-NAME': 'findCompletedItems',
                'SERVICE-VERSION': '1.13.0',
                'SECURITY-APPNAME': cfg.EBAY_CLIENT_ID,
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

            const [soldResponse, activeResponse] = await Promise.all([
                axios.get(`${EBAY_FINDING_API_URL}?${params.toString()}`, { timeout: 15000 }),
                axios.get(`${EBAY_FINDING_API_URL}?${activeParams.toString()}`, { timeout: 15000 })
            ]);

            const soldCount = soldResponse.data.findCompletedItemsResponse[0].paginationOutput[0].totalEntries[0] || '0';
            const activeCount = activeResponse.data.findItemsAdvancedResponse[0].paginationOutput[0].totalEntries[0] || '0';

            const total = parseInt(soldCount) + parseInt(activeCount);
            const str = total > 0 ? (parseInt(soldCount) / total) * 100 : 0;

            return res.json({ success: true, soldCount, activeCount, str: str.toFixed(2) });
        } catch (error) {
            logger.error('eBay STR Error:', error.response ? error.response.data : error.message);
            return res.status(500).json({ error: 'Failed to calculate STR from eBay.' });
        }
    });
});

exports.uploadEbayImage = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        upload.array('images')(req, res, async (err) => {
            if (guard(req, res)) return;

            if (err) {
                logger.error("Multer error", err);
                return res.status(400).json({ error: `File upload error: ${err.message}` });
            }
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No images provided for eBay upload.' });
            }

            try {
                const token = await getEbayAccessToken();
                const uploadPromises = req.files.map(async (file) => {
                    const form = new FormData();
                    form.append('image', file.buffer, {
                        filename: 'image.jpg',
                        contentType: file.mimetype,
                    });

                    const response = await axios.post(`${EBAY_BASE}/sell/inventory/v1/image`, form, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            ...form.getHeaders(),
                        }
                    });
                    const imageUrl = response.headers.location;
                    if (imageUrl) {
                        return { originalFilename: file.originalname, epsImageUrl: imageUrl };
                    }
                    throw new Error(`Failed to get image URL for ${file.originalname}`);
                });

                const uploaded = await Promise.all(uploadPromises);
                return res.json({ success: true, uploaded });
            } catch (error) {
                logger.error('eBay Image Upload Error:', error.response ? error.response.data : error.message);
                return res.status(500).json({ error: 'Failed to upload images to eBay.' });
            }
        });
    });
});

exports.createListing = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (guard(req, res)) return;

        try {
            const { listings } = req.body;
            if (!listings || !Array.isArray(listings) || listings.length === 0) {
                return res.status(400).json({ error: 'No listings provided.' });
            }

            const cfg = getCfg();
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
                    fulfillmentPolicyId: cfg.EBAY_FULFILLMENT_POLICY_ID,
                    paymentPolicyId: cfg.EBAY_PAYMENT_POLICY_ID,
                    returnPolicyId: cfg.EBAY_RETURN_POLICY_ID,
                },
                pricingSummary: { price: { value: item.price, currency: 'USD' } },
            }));
            const offerResponse = await axios.post(`${EBAY_BASE}/sell/inventory/v1/bulk_create_offer`, { requests: offerRequests }, { headers });
            const offerIds = offerResponse.data.responses.filter(r => r.offerId).map(r => r.offerId);

            if (offerIds.length === 0) {
                logger.error("No offers were created, cannot publish.", offerResponse.data);
                throw new Error("Offer creation failed for all items.");
            }

            const publishRequests = offerIds.map(offerId => ({ offerId }));
            const publishResponse = await axios.post(`${EBAY_BASE}/sell/inventory/v1/bulk_publish_offer`, { requests: publishRequests }, { headers });

            return res.json({ success: true, data: publishResponse.data });

        } catch (error) {
            logger.error('eBay Bulk Upload Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            return res.status(500).json({ error: 'Failed during eBay bulk upload process.', details: error.response?.data });
        }
    });
});
