const { expect } = require('chai');
const sinon = require('sinon');
const { getAnalytics, getCompetitiveIntelligence, getSeoAndContentOptimization } = require('./analytics');
const databaseService = require('../services/databaseService');

describe('Analytics Endpoints', () => {
  let context;

  beforeEach(() => {
    context = { log: { error: sinon.spy() } };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      const mockData = {
        performance: { ebay: {}, facebook: {}, etsy: {} },
        revenue: {},
        listings: {},
      };
      sinon.stub(databaseService, 'getMarketplacePerformance').resolves(mockData.performance);
      sinon.stub(databaseService, 'getRevenue').resolves(mockData.revenue);
      sinon.stub(databaseService, 'getListingPerformance').resolves(mockData.listings);

      const request = {};

      const response = await getAnalytics(request, context);
      const body = JSON.parse(response.body);

      expect(body).to.deep.equal(mockData);
    });

    it('should return 500 on error', async () => {
      sinon.stub(databaseService, 'getMarketplacePerformance').throws(new Error('DB error'));

      const request = {};

      const response = await getAnalytics(request, context);

      expect(response.status).to.equal(500);
      expect(response.body).to.equal('Error fetching analytics data');
      expect(context.log.error.calledOnce).to.be.true;
    });
  });

  describe('getCompetitiveIntelligence', () => {
    it('should return competitive intelligence data', async () => {
      const mockData = {
        competitorPrices: [],
        pricingRecommendations: [],
        marketTrends: [],
      };
      sinon.stub(databaseService, 'getCompetitiveIntelligence').resolves(mockData);

      const request = {};

      const response = await getCompetitiveIntelligence(request, context);
      const body = JSON.parse(response.body);

      expect(body).to.deep.equal(mockData);
    });

    it('should return 500 on error', async () => {
      sinon.stub(databaseService, 'getCompetitiveIntelligence').throws(new Error('DB error'));

      const request = {};

      const response = await getCompetitiveIntelligence(request, context);

      expect(response.status).to.equal(500);
      expect(response.body).to.equal('Error fetching competitive intelligence data');
      expect(context.log.error.calledOnce).to.be.true;
    });
  });

  describe('getSeoAndContentOptimization', () => {
    it('should return SEO and content optimization data', async () => {
      const mockData = {
        keywordRankings: {},
        contentOptimizationSuggestions: [],
      };
      sinon.stub(databaseService, 'getSeoAndContentOptimization').resolves(mockData);

      const request = {};

      const response = await getSeoAndContentOptimization(request, context);
      const body = JSON.parse(response.body);

      expect(body).to.deep.equal(mockData);
    });

    it('should return 500 on error', async () => {
      sinon.stub(databaseService, 'getSeoAndContentOptimization').throws(new Error('DB error'));

      const request = {};

      const response = await getSeoAndContentOptimization(request, context);

      expect(response.status).to.equal(500);
      expect(response.body).to.equal('Error fetching SEO and content optimization data');
      expect(context.log.error.calledOnce).to.be.true;
    });
  });
});
