const { app } = require('@azure/functions');
const databaseService = require('../services/databaseService');

async function getAnalytics(request, context) {
    try {
        const performance = await databaseService.getMarketplacePerformance();
        const revenue = await databaseService.getRevenue();
        const listings = await databaseService.getListingPerformance();

        return {
            body: JSON.stringify({
                performance,
                revenue,
                listings
            })
        };
    } catch (error) {
        context.log.error(error);
        return {
            status: 500,
            body: 'Error fetching analytics data'
        };
    }
}

async function getCompetitiveIntelligence(request, context) {
    try {
        const competitiveIntelligence = await databaseService.getCompetitiveIntelligence();

        return {
            body: JSON.stringify(competitiveIntelligence)
        };
    } catch (error) {
        context.log.error(error);
        return {
            status: 500,
            body: 'Error fetching competitive intelligence data'
        };
    }
}

async function getSeoAndContentOptimization(request, context) {
    try {
        const seoAndContentOptimization = await databaseService.getSeoAndContentOptimization();

        return {
            body: JSON.stringify(seoAndContentOptimization)
        };
    } catch (error) {
        context.log.error(error);
        return {
            status: 500,
            body: 'Error fetching SEO and content optimization data'
        };
    }
}

app.http('getAnalytics', {
    methods: ['GET'],
    authLevel: 'function',
    handler: getAnalytics
});

app.http('getCompetitiveIntelligence', {
    methods: ['GET'],
    authLevel: 'function',
    handler: getCompetitiveIntelligence
});

app.http('getSeoAndContentOptimization', {
    methods: ['GET'],
    authLevel: 'function',
    handler: getSeoAndContentOptimization
});

module.exports = {
    getAnalytics,
    getCompetitiveIntelligence,
    getSeoAndContentOptimization
};
