import functions from 'firebase-functions';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { getEbayAccessToken } from './helpers/ebayAuth.js';

const EBAY_BASE = (functions.config().ebay?.env || 'production') === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit
});

const corsHandler = cors({ origin: true });

export const ebayUploadImages = functions.https.onRequest((req, res) => {
    corsHandler(req, res, () => {
        upload.array('images')(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({ error: `Image too large. Each file must be under 4MB.` });
                }
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
                res.json({ success: true, uploaded });
            } catch (error) {
                console.error('eBay Image Upload Error:', error.response ? error.response.data : error.message);
                res.status(500).json({ error: 'Failed to upload images to eBay.' });
            }
        });
    });
});
