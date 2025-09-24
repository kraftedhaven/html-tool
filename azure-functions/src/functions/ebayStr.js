import { app } from '@azure/functions';
import axios from 'axios';
import { keyVault } from '../utils/keyVault.js';

const EBAY_FINDING_API_URL = `https://svcs.ebay.com/services/search/FindingService/v1`;

app.http('ebayStr', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { query, categoryId } = await request.json();
            
            if (!query) {
                return {
                    status: 400,
                    jsonBody: { error: 'A search query is required.' }
                };
            }

            // Get eBay client ID from Key Vault
            const ebayClientId = await keyVault.getSecret('ebay-client-id');

            const params = new URLSearchParams({
                'OPERATION-NAME': 'findCompletedItems',
                'SERVICE-VERSION': '1.13.0',
                'SECURITY-APPNAME': ebayClientId,
                'RESPONSE-DATA-FORMAT': 'JSON',
                'REST-PAYLOAD': true,
                'keywords': query,
                'itemFilter(0).name': 'SoldItemsOnly',
                'itemFilter(0).value': 'true',
                'paginationInput.entriesPerPage': '1'
            });
            
            if (categoryId) {
                params.append('categoryId', categoryId);
            }

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

            return {
                status: 200,
                jsonBody: { 
                    success: true, 
                    soldCount, 
                    activeCount, 
                    str: str.toFixed(2) 
                }
            };

        } catch (error) {
            console.error('eBay STR Error:', error.response ? error.response.data : error.message);
            return {
                status: 500,
                jsonBody: { error: 'Failed to calculate STR from eBay.' }
            };
        }
    }
});