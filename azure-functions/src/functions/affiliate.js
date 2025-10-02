const { app } = require('@azure/functions');
const databaseService = require('../services/databaseService');

app.http('getAffiliateData', {
    methods: ['GET'],
    authLevel: 'function',
    handler: async (request, context) => {
        try {
            const affiliateData = await databaseService.getAffiliateData();

            return {
                body: JSON.stringify(affiliateData)
            };
        } catch (error) {
            context.log.error(error);
            return {
                status: 500,
                body: 'Error fetching affiliate data'
            };
        }
    }
});
