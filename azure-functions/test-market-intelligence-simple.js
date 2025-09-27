/**
 * Simple Market Intelligence Test (No API Keys Required)
 * Tests the core market intelligence functionality without external API calls
 */

import { marketIntelligenceWorkflows } from './src/utils/marketIntelligenceWorkflows.js';

async function testBusinessLeadDiscoverySimple() {
    console.log('🎯 Testing Business Lead Discovery (Simple)...\n');

    try {
        const inputData = {
            targetMarkets: ['vintage fashion', 'reselling', 'e-commerce'],
            leadSources: ['product-hunt', 'social-media', 'marketplaces'],
            qualificationCriteria: {
                minCompanySize: 'small',
                targetIndustries: ['fashion', 'retail'],
                geographicFocus: ['US', 'UK', 'CA']
            },
            maxLeads: 20
        };

        const results = await marketIntelligenceWorkflows.discoverBusinessLeads(inputData);

        console.log('✅ Business Lead Discovery Results:');
        console.log('  - Total Leads Found:', results.totalLeadsFound);
        console.log('  - Qualified Leads:', results.qualifiedLeads);
        console.log('  - Lead Quality Score:', results.leadQualityScore);
        console.log('  - Conversion Potential:', results.conversionPotential.conversionRate);

        return results;

    } catch (error) {
        console.error('❌ Business Lead Discovery failed:', error.message);
        throw error;
    }
}

async function testAutomatedTrendAnalysisSimple() {
    console.log('\n📈 Testing Automated Trend Analysis (Simple)...\n');

    try {
        const productData = [
            {
                id: 'prod1',
                productType: 'Vintage Jacket',
                category: 'Outerwear',
                price: 85,
                sales: 12,
                views: 245,
                brand: 'Vintage Co'
            },
            {
                id: 'prod2',
                productType: 'Vintage Dress',
                category: 'Dresses',
                price: 65,
                sales: 8,
                views: 189,
                brand: 'Retro Fashion'
            },
            {
                id: 'prod3',
                productType: 'Vintage Shoes',
                category: 'Footwear',
                price: 45,
                sales: 15,
                views: 312,
                brand: 'Classic Footwear'
            }
        ];

        const inputData = {
            productData,
            analysisTimeframe: '30days',
            trendCategories: ['pricing', 'demand', 'categories', 'seasonality'],
            benchmarkData: {
                industryAveragePrice: 60,
                marketGrowthRate: 0.15
            }
        };

        const results = await marketIntelligenceWorkflows.buildAutomatedTrendAnalysis(inputData);

        console.log('✅ Automated Trend Analysis Results:');
        console.log('  - Products Analyzed:', results.productsAnalyzed);
        console.log('  - Trend Score:', results.trendScore);
        console.log('  - Market Opportunities:', results.marketOpportunities?.length || 0);
        console.log('  - Recommendations:', results.recommendations?.length || 0);

        if (results.categoryTrends && results.categoryTrends.categoryPerformance) {
            console.log('  - Category Performance:');
            for (const [category, performance] of Object.entries(results.categoryTrends.categoryPerformance)) {
                console.log(`    ${category}: ${performance.productCount} products, ${performance.totalSales} sales, ${performance.conversionRate} conversion`);
            }
        }

        return results;

    } catch (error) {
        console.error('❌ Automated Trend Analysis failed:', error.message);
        throw error;
    }
}

async function testProductHuntTrackingSimple() {
    console.log('\n🚀 Testing Product Hunt Tracking (Simple - Mock Data)...\n');

    try {
        // Override the analyzeRelevantLaunches method to avoid API calls
        const originalMethod = marketIntelligenceWorkflows.analyzeRelevantLaunches;
        marketIntelligenceWorkflows.analyzeRelevantLaunches = async function(launches, analysisDepth) {
            // Return mock relevant launches without API calls
            return launches.slice(0, Math.floor(launches.length * 0.3)).map(launch => ({
                ...launch,
                relevanceAnalysis: {
                    relevanceScore: Math.random() * 0.5 + 0.3, // 0.3-0.8 range
                    implications: 'Mock business implications',
                    threats: 'Mock competitive threats',
                    opportunities: 'Mock opportunities'
                },
                businessImplications: 'Mock business implications',
                competitiveThreats: 'Mock competitive threats',
                opportunities: 'Mock opportunities'
            }));
        };

        const inputData = {
            categories: ['fashion', 'e-commerce', 'marketplace'],
            trackingPeriod: 'daily',
            analysisDepth: 'standard'
        };

        const results = await marketIntelligenceWorkflows.trackDailyProductHuntLaunches(inputData);

        console.log('✅ Product Hunt Tracking Results:');
        console.log('  - Total Launches:', results.totalLaunches);
        console.log('  - Relevant Launches:', results.relevantLaunches);
        console.log('  - Opportunity Score:', results.opportunityScore);
        console.log('  - Categories Tracked:', results.categories);

        // Restore original method
        marketIntelligenceWorkflows.analyzeRelevantLaunches = originalMethod;

        return results;

    } catch (error) {
        console.error('❌ Product Hunt Tracking failed:', error.message);
        throw error;
    }
}

async function runSimpleMarketIntelligenceTests() {
    console.log('🧪 Starting Simple Market Intelligence Tests (No API Keys Required)\n');
    console.log('=' .repeat(70));

    try {
        const leadResults = await testBusinessLeadDiscoverySimple();
        const trendResults = await testAutomatedTrendAnalysisSimple();
        const productHuntResults = await testProductHuntTrackingSimple();

        console.log('\n' + '='.repeat(70));
        console.log('🎯 All Simple Market Intelligence Tests Completed Successfully!');
        console.log('\n📊 Summary:');
        console.log('  - Business Lead Discovery: ✅ Working');
        console.log('  - Automated Trend Analysis: ✅ Working');
        console.log('  - Product Hunt Tracking (Mock): ✅ Working');

        console.log('\n📈 Key Results:');
        console.log(`  - Discovered ${leadResults.qualifiedLeads} qualified business leads`);
        console.log(`  - Analyzed ${trendResults.productsAnalyzed} products for trends`);
        console.log(`  - Tracked ${productHuntResults.totalLaunches} Product Hunt launches`);
        console.log(`  - Overall trend score: ${trendResults.trendScore}/100`);

        return {
            leadResults,
            trendResults,
            productHuntResults
        };

    } catch (error) {
        console.error('❌ Simple Market Intelligence Tests failed:', error);
        process.exit(1);
    }
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runSimpleMarketIntelligenceTests().catch(console.error);
}

export { runSimpleMarketIntelligenceTests };