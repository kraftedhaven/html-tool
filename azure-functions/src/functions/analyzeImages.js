import { app } from '@azure/functions';
import { OpenAI } from 'openai';
import axios from 'axios';
import { keyVault } from '../utils/keyVault.js';
import { tokenManager } from '../utils/tokenManager.js';
import { errorHandler } from '../utils/errorHandler.js';

// eBay API Configuration
const EBAY_ENV = process.env.EBAY_ENV || 'production';
const EBAY_BASE = EBAY_ENV === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';

app.http('analyzeImages', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        return await errorHandler.withErrorHandling('analyzeImages', async () => {
            const formData = await request.formData();
            const files = [];
            
            // Extract files from form data
            for (const [key, value] of formData.entries()) {
                if (key === 'images' && value instanceof File) {
                    const buffer = Buffer.from(await value.arrayBuffer());
                    files.push({
                        buffer,
                        originalname: value.name,
                        mimetype: value.type,
                        size: buffer.length
                    });
                }
            }

            if (files.length === 0) {
                return {
                    status: 400,
                    jsonBody: { error: 'No images uploaded.' }
                };
            }

            // Get OpenAI API key from Key Vault
            const openaiApiKey = await keyVault.getSecret('openai-api-key');
            const openai = new OpenAI({ apiKey: openaiApiKey });

            const results = [];
            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) {
                    return {
                        status: 413,
                        jsonBody: { error: `Image ${file.originalname} is too large.` }
                    };
                }

                const b64 = file.buffer.toString('base64');

                let openaiResp;
                try {
                    openaiResp = await openai.chat.completions.create({
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
                } catch (err) {
                    const msg = err?.response?.data?.error?.message || err.message || 'OpenAI request failed';
                    return {
                        status: err?.response?.status || 502,
                        jsonBody: { error: msg }
                    };
                }

                let raw = openaiResp?.choices?.[0]?.message?.content || '{}';
                raw = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
                let parsed;
                try {
                    parsed = JSON.parse(raw);
                } catch {
                    return {
                        status: 502,
                        jsonBody: { error: 'Model did not return valid JSON.', payload: raw.slice(0, 200) }
                    };
                }

                let best = {};
                try {
                    const token = await tokenManager.getEbayAccessToken();
                    const q = encodeURIComponent(parsed.productType || parsed.title || 'general');
                    const url = `${EBAY_BASE}/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${q}`;
                    const config = {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 10000
                    };
                    const { data: cat } = await axios.get(url, config);
                    best = cat?.categorySuggestions?.[0]?.category || {};
                } catch (error) {
                    console.warn('Failed to get eBay category suggestions:', error.message);
                }

                results.push({ ...parsed, categoryId: best.categoryId, categoryName: best.categoryName });
            }

            return errorHandler.createSuccessResponse(results, 'analyzeImages', {
                imageCount: files.length,
                processingTime: Date.now()
            });
        }, { imageCount: files?.length || 0 });
    }
});