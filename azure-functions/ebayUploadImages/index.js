const axios = require('axios');
const FormData = require('form-data');
const { getEbayAccessToken } = require('../shared/ebayAuth');

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
    context.log('eBay Upload Images function processing a request.');

    try {
        const files = parseMultipart(req.body, req.headers['content-type']);

        if (!files || files.length === 0) {
            context.res = { status: 400, body: { error: 'No images provided for eBay upload.' } };
            return;
        }

        const token = await getEbayAccessToken();
        const uploadPromises = files.map(async (file) => {
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
        context.res = { status: 200, body: { success: true, uploaded } };

    } catch (error) {
        context.log.error('eBay Image Upload Error:', error.response ? error.response.data : error.message);
        context.res = { status: 500, body: { error: 'Failed to upload images to eBay.' } };
    }
};
