const axios = require('axios');

const EBAY_FINDING_API_URL = `https://svcs.ebay.com/services/search/FindingService/v1`;
const { EBAY_CLIENT_ID } = process.env;

module.exports = async function (context, req) {
    context.log('Get eBay STR function processing a request.');

    const { query, categoryId } = req.body;
    if (!query) {
        context.res = { status: 400, body: { error: 'A search query is required.' } };
        return;
    }

    const params = new URLSearchParams({
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': EBAY_CLIENT_ID,
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

        context.res = { status: 200, body: { success: true, soldCount, activeCount, str: str.toFixed(2) } };
    } catch (error) {
        context.log.error('eBay STR Error:', error.response ? error.response.data : error.message);
        context.res = { status: 500, body: { error: 'Failed to calculate STR from eBay.' } };
    }
};
