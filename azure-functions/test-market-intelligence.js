/**
 * Test Market Intelligence Workflows
 * Tests Product Hunt tracking, business lead discovery, and automated trend analysis
 */

import { marketIntelligenceWorkflows } from './src/utils/marketIntelligenceWorkflows.js';
import { workflowEngine } from './src/utils/workflowEngine.js';

async function testProductHuntTracking() {
    console.log('🚀 Testing Product Hunt Tracking...\n');

    try {
        const inputData = {
            categories: ['fashion', 'e-commerce', 'marketplace'],
            trackingPeriod: 'daily',
            analysisDepth: 'standard'
        };

        console.log('Input Data:', JSON.stringify(inputData, null, 2));

        const results = await marketIntelligenceWorkflows.trackDailyProductHuntLaunches(inputData);

        console.log('✅ Product Hunt Tracking Results:');
        console.log('  - Tracking Date:', results.trackingDate);
        console.log('  - Total Launches:', results.totalLaunches);
        console.log('  - Relevant Launches:', results.relevantLaunches);
        console.log('  - Categories Tracked:', results.categories);
        console.log('  - Opportunity Score:', results.opportunityScore);
        console.log('  - Market Trends:', results.trendAnalysis?.topCategories ? Object.keys(results.trendAnalysis.topCategories) : 'None');
        
        if (results.launches && results.launches.length > 0) {
            console.log('  - Sample Launch:');
            const sample = results.launches[0];
            console.log('    Name:', sample.name);
            console.log('    Category:', sample.category);
            console.log('    Votes:', sample.votesCount);
            console.log('    Relevance Score:', sample.relevanceAnalysis?.relevanceScore || 'N/A');
        }

        console.log('  - Competitive Intelligence:');
        console.log('    Direct Competitors:', results.competitiveIntelligence?.directCompetitors?.length || 0);
        console.log('    Indirect Competitors:', results.competitiveIntelligence?.indirectCompetitors?.length || 0);
        console.log('    Threat Level:', results.competitiveIntelligence?.threatLevel || 'Unknown');

        return results;

    } catch (error) {
        console.error('❌ Product Hunt Tracking failed:', error);
        throw error;
    }
}

async function testBusinessLeadDiscovery() {
    console.log('\n🎯 Testing Business Lead Discovery...\n');

    try {
        const inputData = {
            targetMarkets: ['vintage fashion', 'reselling', 'e-commerce'],
            leadSources: ['product-hunt', 'social-media', 'marketplaces'],
            qualificationCriteria: {
                minCompanySize: 'small',
                targetIndustries: ['fashion', 'retail'],
                geographicFocus: ['US', 'UK', 'CA']
            },
            maxLeads: 30
        };

        console.log('Input Data:', JSON.stringify(inputData, null, 2));

        const results = await marketIntelligenceWorkflows.discoverBusinessLeads(inputData);

        console.log('✅ Business Lead Discovery Results:');
        console.log('  - Discovery Date:', results.discoveryDate);
        console.log('  - Total Leads Found:', results.totalLeadsFound);
        console.log('  - Qualified Leads:', results.qualifiedLeads);
        console.log('  - Target Markets:', results.targetMarkets);
        console.log('  - Lead Sources:', results.leadSources);
        console.log('  - Lead Quality Score:', results.leadQualityScore);
        console.log('  - Conversion Potential:', results.conversionPotential);

        if (results.leads && Object.keys(results.leads).length > 0) {
            console.log('  - Lead Categories:');
            for (const [category, categoryLeads] of Object.entries(results.leads)) {
                console.log(`    ${category}: ${categoryLeads.length} leads`);
                
                if (categoryLeads.length > 0) {
                    const sample = categoryLeads[0];
                    console.log(`      Sample: ${sample.name} (${sample.company}) - Score: ${sample.qualificationScore?.toFixed(2) || 'N/A'}`);
                }
            }
        }

        console.log('  - Outreach Strategies:');
        if (results.outreachStrategies) {
            for (const [strategy, description] of Object.entries(results.outreachStrategies)) {
                console.log(`    ${strategy}: ${description}`);
            }
        }

        return results;

    } catch (error) {
        console.error('❌ Business Lead Discovery failed:', error);
        throw error;
    }
}

async function testAutomatedTrendAnalysis() {
    console.log('\n📈 Testing Automated Trend Analysis...\n');

    try {
        // Mock product data for trend analysis
        const productData = [
            {
                id: 'prod1',
                productType: 'Vintage Jacket',
                category: 'Outerwear',
                price: 85,
                suggestedPrice: 90,
                sales: 12,
                views: 245,
                brand: 'Vintage Co',
                createdAt: '2024-01-15',
                soldAt: '2024-02-01'
            },
            {
                id: 'prod2',
                productType: 'Vintage Dress',
                category: 'Dresses',
                price: 65,
                suggestedPrice: 70,
                sales: 8,
                views: 189,
                brand: 'Retro Fashion',
                createdAt: '2024-01-20',
                soldAt: '2024-02-05'
            },
            {
                id: 'prod3',
                productType: 'Vintage Shoes',
                category: 'Footwear',
                price: 45,
                suggestedPrice: 50,
                sales: 15,
                views: 312,
                brand: 'Classic Footwear',
                createdAt: '2024-01-25',
                soldAt: '2024-02-10'
            },
            {
                id: 'prod4',
                productType: 'Vintage Bag',
                category: 'Accessories',
                price: 35,
                suggestedPrice: 40,
                sales: 6,
                views: 156,
                brand: 'Vintage Accessories',
                createdAt: '2024-02-01',
                soldAt: '2024-02-15'
            },
            {
                id: 'prod5',
                productType: 'Vintage Jacket',
                category: 'Outerwear',
                price: 95,
                suggestedPrice: 100,
                sales: 10,
                views: 278,
                brand: 'Premium Vintage',
                createdAt: '2024-02-05',
                soldAt: '2024-02-20'
            }
        ];

        const inputData = {
            productData,
            analysisTimeframe: '30days',
            trendCategories: ['pricing', 'demand', 'categories', 'seasonality'],
            benchmarkData: {
                industryAveragePrice: 60,
                marketGrowthRate: 0.15,
                seasonalFactors: {
                    'Q1': 0.9,
                    'Q2': 1.1,
                    'Q3': 0.8,
                    'Q4': 1.3
                }
            }
        };

        console.log('Input Data:');
        console.log('  - Products Analyzed:', productData.length);
        console.log('  - Analysis Timeframe:', inputData.analysisTimeframe);
        console.log('  - Trend Categories:', inputData.trendCategories);

        const results = await marketIntelligenceWorkflows.buildAutomatedTrendAnalysis(inputData);

        console.log('✅ Automated Trend Analysis Results:');
        console.log('  - Analysis Date:', results.analysisDate);
        console.log('  - Timeframe:', results.timeframe);
        console.log('  - Products Analyzed:', results.productsAnalyzed);
        console.log('  - Trend Score:', results.trendScore);

        console.log('  - Performance Trends:');
        if (results.performanceTrends) {
            console.log('    Sales Growth:', results.performanceTrends.salesTrends?.growth || 'N/A', '%');
            console.log('    Seasonality Detected:', results.performanceTrends.salesTrends?.seasonality?.seasonal || false);
            console.log('    Forecast Next Month:', results.performanceTrends.salesTrends?.forecast?.nextMonth || 'N/A');
        }

        console.log('  - Pricing Trends:');
        if (results.pricingTrends && results.pricingTrends.averagePrices) {
            for (const [category, priceData] of Object.entries(results.pricingTrends.averagePrices)) {
                console.log(`    ${category}: Avg $${priceData.average?.toFixed(2) || 'N/A'} (Range: $${priceData.min || 'N/A'} - $${priceData.max || 'N/A'})`);
            }
        }

        console.log('  - Market Opportunities:');
        if (results.marketOpportunities && results.marketOpportunities.length > 0) {
            results.marketOpportunities.forEach((opportunity, index) => {
                console.log(`    ${index + 1}. ${opportunity}`);
            });
        }

        console.log('  - Recommendations:');
        if (results.recommendations && results.recommendations.length > 0) {
            results.recommendations.forEach((recommendation, index) => {
                console.log(`    ${index + 1}. ${recommendation}`);
            });
        }

        return results;

    } catch (error) {
        console.error('❌ Automated Trend Analysis failed:', error);
        throw error;
    }
}

async function testWorkflowEngineIntegration() {
    console.log('\n🔧 Testing Workflow Engine Integration...\n');

    try {
        await workflowEngine.initialize();

        // Test Product Hunt tracking through workflow engine
        console.log('Testing Product Hunt tracking through workflow engine...');
        const productHuntResults = await workflowEngine.executeWorkflow('market-intelligence', {
            searchQuery: 'vintage fashion marketplace trends',
            sources: ['product-hunt', 'social-media'],
            relevanceCriteria: 'vintage fashion and reselling market analysis',
            maxResults: 15
        });

        console.log('✅ Workflow Engine Product Hunt Results:');
        console.log('  - Raw Results:', productHuntResults.rawResults?.length || 0);
        console.log('  - Semantic Analysis:', productHuntResults.semanticAnalysis ? 'Generated' : 'Not generated');
        console.log('  - Competitive Insights:', productHuntResults.competitiveInsights ? 'Generated' : 'Not generated');

        return { productHuntResults };

    } catch (error) {
        console.error('❌ Workflow Engine Integration failed:', error);
        throw error;
    }
}

async function testMarketIntelligenceDashboard() {
    console.log('\n📊 Testing Market Intelligence Dashboard Integration...\n');

    try {
        // Simulate dashboard data aggregation
        const dashboardData = {
            generatedAt: new Date().toISOString(),
            sections: {}
        };

        // Get Product Hunt data
        console.log('Gathering Product Hunt data...');
        const productHuntData = await marketIntelligenceWorkflows.trackDailyProductHuntLaunches({
            categories: ['fashion', 'e-commerce'],
            trackingPeriod: 'daily',
            analysisDepth: 'standard'
        });
        dashboardData.sections.productHunt = {
            totalLaunches: productHuntData.totalLaunches,
            relevantLaunches: productHuntData.relevantLaunches,
            opportunityScore: productHuntData.opportunityScore,
            topTrends: productHuntData.trendAnalysis?.emergingTrends?.slice(0, 3) || []
        };

        // Get Business Leads data
        console.log('Gathering Business Leads data...');
        const leadsData = await marketIntelligenceWorkflows.discoverBusinessLeads({
            targetMarkets: ['vintage fashion', 'reselling'],
            leadSources: ['product-hunt', 'social-media'],
            maxLeads: 20
        });
        dashboardData.sections.businessLeads = {
            totalLeads: leadsData.totalLeadsFound,
            qualifiedLeads: leadsData.qualifiedLeads,
            qualityScore: leadsData.leadQualityScore,
            conversionPotential: leadsData.conversionPotential
        };

        // Get Trend Analysis data
        console.log('Gathering Trend Analysis data...');
        const mockProductData = [
            { category: 'Outerwear', price: 85, sales: 12 },
            { category: 'Dresses', price: 65, sales: 8 },
            { category: 'Footwear', price: 45, sales: 15 }
        ];
        
        const trendData = await marketIntelligenceWorkflows.buildAutomatedTrendAnalysis({
            productData: mockProductData,
            analysisTimeframe: '30days',
            trendCategories: ['pricing', 'demand']
        });
        dashboardData.sections.trendAnalysis = {
            productsAnalyzed: trendData.productsAnalyzed,
            trendScore: trendData.trendScore,
            topOpportunities: trendData.marketOpportunities?.slice(0, 3) || [],
            keyRecommendations: trendData.recommendations?.slice(0, 3) || []
        };

        // Generate dashboard summary
        dashboardData.summary = {
            overallScore: Math.round((
                (dashboardData.sections.productHunt.opportunityScore || 0) +
                (dashboardData.sections.businessLeads.qualityScore || 0) +
                (dashboardData.sections.trendAnalysis.trendScore || 0)
            ) / 3),
            keyInsights: [
                `${dashboardData.sections.productHunt.relevantLaunches} relevant Product Hunt launches tracked`,
                `${dashboardData.sections.businessLeads.qualifiedLeads} qualified business leads discovered`,
                `${dashboardData.sections.trendAnalysis.productsAnalyzed} products analyzed for trends`
            ],
            actionItems: [
                'Monitor top trending categories for new opportunities',
                'Follow up with high-priority business leads',
                'Adjust pricing strategy based on trend analysis'
            ]
        };

        console.log('✅ Market Intelligence Dashboard Results:');
        console.log('  - Generated At:', dashboardData.generatedAt);
        console.log('  - Overall Score:', dashboardData.summary.overallScore);
        console.log('  - Sections Included:', Object.keys(dashboardData.sections));
        
        console.log('  - Key Insights:');
        dashboardData.summary.keyInsights.forEach((insight, index) => {
            console.log(`    ${index + 1}. ${insight}`);
        });

        console.log('  - Action Items:');
        dashboardData.summary.actionItems.forEach((item, index) => {
            console.log(`    ${index + 1}. ${item}`);
        });

        return dashboardData;

    } catch (error) {
        console.error('❌ Market Intelligence Dashboard failed:', error);
        throw error;
    }
}

// Run all tests
async function runAllMarketIntelligenceTests() {
    console.log('🧪 Starting Market Intelligence Workflow Tests\n');
    console.log('=' .repeat(60));

    try {
        const productHuntResults = await testProductHuntTracking();
        const leadDiscoveryResults = await testBusinessLeadDiscovery();
        const trendAnalysisResults = await testAutomatedTrendAnalysis();
        const engineResults = await testWorkflowEngineIntegration();
        const dashboardResults = await testMarketIntelligenceDashboard();

        console.log('\n' + '='.repeat(60));
        console.log('🎯 All Market Intelligence Tests Completed Successfully!');
        console.log('\n📊 Summary:');
        console.log('  - Product Hunt Tracking: ✅ Working');
        console.log('  - Business Lead Discovery: ✅ Working');
        console.log('  - Automated Trend Analysis: ✅ Working');
        console.log('  - Workflow Engine Integration: ✅ Working');
        console.log('  - Dashboard Integration: ✅ Working');

        return {
            productHuntResults,
            leadDiscoveryResults,
            trendAnalysisResults,
            engineResults,
            dashboardResults
        };

    } catch (error) {
        console.error('❌ Market Intelligence Tests failed:', error);
        process.exit(1);
    }
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllMarketIntelligenceTests().catch(console.error);
}

export { 
    testProductHuntTracking,
    testBusinessLeadDiscovery,
    testAutomatedTrendAnalysis,
    testWorkflowEngineIntegration,
    testMarketIntelligenceDashboard,
    runAllMarketIntelligenceTests
};