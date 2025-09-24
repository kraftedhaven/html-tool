const { OpenAI } = require('openai');
const axios = require('axios');
const { getEbayAccessToken } = require('../shared/ebayAuth');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EBAY_BASE = (process.env.EBAY_ENV || 'production') === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';

// Helper to parse multipart/form-data
function parseMultipart(body, contentType) {
    const boundary = contentType.split('boundary=')[1];
    const parts = body.toString().split(`--${boundary}`).slice(1, -1);
    const files = [];

    for (let part of parts) {
        const headers = part.substring(0, part.indexOf('\r\n\r\n')).trim();
        const content = part.substring(part.indexOf('\r\n\r\n') + 4, part.length - 2);

        let filename = null;
        let name = null;
        let type = 'application/octet-stream';

        if (headers.includes('Content-Disposition')) {
            const dispositionMatch = headers.match(/Content-Disposition: form-data; name=\"(.*?)\"(; filename=\"(.*?)\")?/);
            if (dispositionMatch) {
                name = dispositionMatch[1];
                filename = dispositionMatch[3];
            }
        }

        if (headers.includes('Content-Type')) {
            const typeMatch = headers.match(/Content-Type: (.*)/);
            if (typeMatch) {
                type = typeMatch[1];
            }
        }

        if (name === 'images') {
            files.push({
                buffer: Buffer.from(content, 'binary'),
                mimetype: type,
                originalname: filename
            });
        }
    }
    return files;
}

module.exports = async function (context, req) {
    context.log('Analyze Images function processing a request.');

    try {
        const files = parseMultipart(req.body, req.headers['content-type']);

        if (!files || files.length === 0) {
            context.res = { status: 400, body: { error: 'No images uploaded.' } };
            return;
        }

        const results = [];
        for (const file of files) {
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
                const config = { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 };
                const { data: cat } = await axios.get(url, config);
                best = cat?.categorySuggestions?.[0]?.category || {};
            } catch (e) {
                context.log.warn('Could not fetch eBay category suggestions:', e.message);
            }

            results.push({ ...parsed, categoryId: best.categoryId, categoryName: best.categoryName });
        }
        context.res = { status: 200, body: { success: true, data: results } };

    } catch (error) {
        context.log.error('An unexpected error occurred:', error);
        context.res = { status: 500, body: { error: error.message || 'An internal server error occurred.' } };
    }
};
