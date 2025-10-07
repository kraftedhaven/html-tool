import { useState, useEffect } from 'react';

interface MarketplacePerformance {
  revenue: number;
  listings: number;
  conversion: number;
}

interface Performance {
  ebay: MarketplacePerformance;
  facebook: MarketplacePerformance;
  etsy: MarketplacePerformance;
}

interface Revenue {
  totalRevenue: number;
  profitMargin: number;
}

interface Listings {
  views: number;
  watchers: number;
  conversionRates: number;
}

interface AnalyticsData {
  performance: Performance;
  revenue: Revenue;
  listings: Listings;
}

interface CompetitiveData {
  competitorPrices: string[];
  pricingRecommendations: string[];
  marketTrends: string[];
}

interface SeoData {
  keywordRankings: Record<string, number>;
  contentOptimizationSuggestions: string[];
}

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [competitiveData, setCompetitiveData] = useState<CompetitiveData | null>(null);
  const [seoData, setSeoData] = useState<SeoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analyticsResponse = await fetch('/api/getAnalytics');
        const analyticsData = await analyticsResponse.json();
        setAnalyticsData(analyticsData);

        const competitiveResponse = await fetch('/api/getCompetitiveIntelligence');
        const competitiveData = await competitiveResponse.json();
        setCompetitiveData(competitiveData);

        const seoResponse = await fetch('/api/getSeoAndContentOptimization');
        const seoData = await seoResponse.json();
        setSeoData(seoData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!analyticsData || !competitiveData || !seoData) {
    return <div>Error loading analytics data.</div>;
  }

  const { performance, revenue, listings } = analyticsData;

  return (
    <div>
      <h2>Analytics Dashboard</h2>
      <div className="grid">
        <div className="card">
          <h3>Marketplace Performance</h3>
          <p>eBay: Revenue: ${performance.ebay.revenue}, Listings: {performance.ebay.listings}, Conversion: {performance.ebay.conversion * 100}%</p>
          <p>Facebook: Revenue: ${performance.facebook.revenue}, Listings: {performance.facebook.listings}, Conversion: {performance.facebook.conversion * 100}%</p>
          <p>Etsy: Revenue: ${performance.etsy.revenue}, Listings: {performance.etsy.listings}, Conversion: {performance.etsy.conversion * 100}%</p>
        </div>
        <div className="card">
          <h3>Revenue Tracking</h3>
          <p>Total Revenue: ${revenue.totalRevenue}</p>
          <p>Profit Margin: {revenue.profitMargin * 100}%</p>
        </div>
        <div className="card">
          <h3>Listing Performance</h3>
          <p>Views: {listings.views}</p>
          <p>Watchers: {listings.watchers}</p>
          <p>Conversion Rates: {listings.conversionRates * 100}%</p>
        </div>
        <div className="card">
          <h3>Competitive Intelligence</h3>
          <p>Competitor Prices: {competitiveData.competitorPrices.join(', ')}</p>
          <p>Pricing Recommendations: {competitiveData.pricingRecommendations.join(', ')}</p>
          <p>Market Trends: {competitiveData.marketTrends.join(', ')}</p>
        </div>
        <div className="card">
          <h3>SEO & Content Optimization</h3>
          <p>Keyword Rankings: {Object.entries(seoData.keywordRankings).map(([keyword, rank]) => `${keyword}: ${rank}`).join(', ')}</p>
          <p>Content Optimization Suggestions: {seoData.contentOptimizationSuggestions.join(', ')}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
