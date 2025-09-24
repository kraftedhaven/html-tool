import functions from 'firebase-functions';
import cors from 'cors';
import { OpenAI } from 'openai';
import multer from 'multer';
import axios from 'axios';
import { getEbayAccessToken } from './helpers/ebayAuth.js';

const openai = new OpenAI({ apiKey: functions.config().openai.key });
const EBAY_BASE = (functions.config().ebay?.env || 'production') === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit
});

const corsHandler = cors({ origin: true });

export const analyzeImages = functions.https.onRequest((req, res) => {
    corsHandler(req, res, () => {
        upload.array('images')(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({ error: `Image too large. Each file must be under 4MB.` });
                }
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
                                text: `Analyze the product in the image for an e-commerce listing. Generate a compelling SEO-friendly title. Identify brand, product type, size, colors, condition, key features, estimated manufacture year, country of manufacture, material, fabric type, and theme. Suggest a market price based on the item\'s attributes. Return ONLY a valid JSON object with this schema: {"seoTitle": string, "brand": string, "productType": string, "size": string, "color": {"primary": string, "secondary": string}, "condition": string, "keyFeatures": string, "estimatedYear": number | "", "countryOfManufacture": string, "material": string, "fabricType": string, "theme": string, "suggestedPrice": number, "confidence": number}`
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
                    let parsed = JSON.parse(raw);

                    let best = {};
                    try {
                        const token = await getEbayAccessToken();
                        const q = encodeURIComponent(parsed.productType || parsed.title || 'general');
                        const url = `${EBAY_BASE}/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${q}`;
                        const config = {
                            headers: { Authorization: `Bearer ${token}` },
                            timeout: 10000
                        };
                        const { data: cat } = await axios.get(url, config);
                        best = cat?.categorySuggestions?.[0]?.category || {};
                    } catch (e) {
                        console.warn('Could not fetch eBay category suggestions:', e.message);
                    }

                    results.push({ ...parsed, categoryId: best.categoryId, categoryName: best.categoryName });
                }
                res.json({ success: true, data: results });
            } catch (error) {
                console.error('An unexpected error occurred:', error);
                res.status(500).json({ error: error.message || 'An internal server error occurred.' });
            }
        });
    });
});
