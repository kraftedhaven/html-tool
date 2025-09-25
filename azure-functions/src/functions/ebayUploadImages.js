import { app } from '@azure/functions';
import axios from 'axios';
import FormData from 'form-data';
import { tokenManager } from '../utils/tokenManager.js';

// eBay API Configuration
const EBAY_ENV = process.env.EBAY_ENV || 'production';
const EBAY_BASE = EBAY_ENV === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';

app.http('ebayUploadImages', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
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
                    jsonBody: { error: 'No images provided for eBay upload.' }
                };
            }

            const token = await tokenManager.getEbayAccessToken();
            const uploadPromises = files.map(async (file) => {
                if (file.size > 4 * 1024 * 1024) {
                    throw new Error(`Image ${file.originalname} is too large. Each file must be under 4MB.`);
                }

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

            return {
                status: 200,
                jsonBody: { success: true, uploaded }
            };

        } catch (error) {
            console.error('eBay Image Upload Error:', error.response ? error.response.data : error.message);
            return {
                status: 500,
                jsonBody: { error: error.message || 'Failed to upload images to eBay.' }
            };
        }
    }
});