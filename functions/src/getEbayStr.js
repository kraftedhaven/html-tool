import functions from 'firebase-functions';
import cors from 'cors';
import axios from 'axios';

const EBAY_FINDING_API_URL = `https://svcs.ebay.com/services/search/FindingService/v1`;
const { client_id } = functions.config().ebay;

const corsHandler = cors({ origin: true });

export const getEbayStr = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { query, categoryId } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'A search query is required.' });
        }

        const params = new URLSearchParams({
            'OPERATION-NAME': 'findCompletedItems',
            'SERVICE-VERSION': '1.13.0',
            'SECURITY-APPNAME': client_id,
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
});
