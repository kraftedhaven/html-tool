/**
 * Azure Function: Market Intelligence Automation Endpoints
 * Handles Product Hunt tracking, business lead discovery, and automated trend analysis
 * Requirement 9.4: Market intelligence automation workflows
 */

import { app } from '@azure/functions';
import { workflowEngine } from '../utils/workflowEngine.js';
import { marketIntelligenceWorkflows } from '../utils/marketIntelligenceWorkflows.js';
import { errorHandler } from '../utils/errorHandler.js';

// Track Daily Product Hunt Launches (Requirement 9.4)
app.http('trackProductHuntLaunches', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'market-intelligence/product-hunt-tracking',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { 
                categories = ['fashion', 'e-commerce', 'marketplace'], 
                trackingPeriod = 'daily',
                analysisDepth = 'standard'
            } = body;

            context.log('Executing Track Daily Product Hunt Launches workflow');

            const inputData = {
                categories,
                trackingPeriod,
                analysisDepth
            };

            const results = await workflowEngine.executeWorkflow('product-hunt-tracking', inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Track Daily Product Hunt Launches',
                    results,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Product Hunt tracking workflow failed:', error);
            
            const errorResponse = errorHandler.handleApiError(error, 'PRODUCT_HUNT_TRACKING_ERROR');
            
            return {
                status: errorResponse.status || 500,
                jsonBody: {
                    success: false,
                    error: errorResponse.message,
                    code: errorResponse.code
                }
            };
        }
    }
});

// Discover Business Leads (Requirement 9.4)
app.http('discoverBusinessLeads', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'market-intelligence/business-lead-discovery',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { 
                targetMarkets = ['vintage fashion', 'reselling', 'e-commerce'],
                leadSources = ['product-hunt', 'social-media', 'marketplaces'],
                qualificationCriteria = {},
                maxLeads = 50
            } = body;

            context.log('Executing Discover Business Leads automation');

            const inputData = {
                targetMarkets,
                leadSources,
                qualificationCriteria,
                maxLeads
            };

            const results = await workflowEngine.executeWorkflow('business-lead-discovery', inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Discover Business Leads with Market Intelligence',
                    results,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Business lead discovery workflow failed:', error);
            
            const errorResponse = errorHandler.handleApiError(error, 'BUSINESS_LEAD_DISCOVERY_ERROR');
            
            return {
                status: errorResponse.status || 500,
                jsonBody: {
                    success: false,
                    error: errorResponse.message,
                    code: errorResponse.code
                }
            };
        }
    }
});

// Build Automated Trend Analysis (Requirement 9.4)
app.http('automatedTrendAnalysis', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'market-intelligence/automated-trend-analysis',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { 
                productData = [],
                analysisTimeframe = '30days',
                trendCategories = ['pricing', 'demand', 'categories', 'seasonality'],
                benchmarkData = {}
            } = body;

            if (!Array.isArray(productData)) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Product data must be an array'
                    }
                };
            }

            context.log(`Executing Automated Trend Analysis for ${productData.length} products`);

            const inputData = {
                productData,
                analysisTimeframe,
                trendCategories,
                benchmarkData
            };

            const results = await workflowEngine.executeWorkflow('automated-trend-analysis', inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Automated Trend Analysis Using Product Data',
                    results,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Automated trend analysis workflow failed:', error);
            
            const errorResponse = errorHandler.handleApiError(error, 'AUTOMATED_TREND_ANALYSIS_ERROR');
            
            return {
                status: errorResponse.status || 500,
                jsonBody: {
                    success: false,
                    error: errorResponse.message,
                    code: errorResponse.code
                }
            };
        }
    }
});

// Get Market Intelligence Dashboard Data
app.http('getMarketIntelligenceDashboard', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'market-intelligence/dashboard',
    handler: async (request, context) => {
        try {
            const url = new URL(request.url);
            const timeframe = url.searchParams.get('timeframe') || '7days';
            const categories = url.searchParams.get('categories')?.split(',') || ['fashion', 'e-commerce'];

            context.log('Generating market intelligence dashboard data');

            // Get recent Product Hunt data
            const productHuntData = await marketIntelligenceWorkflows.trackDailyProductHuntLaunches({
                categories,
                trackingPeriod: timeframe,
                analysisDepth: 'standard'
            });

            // Get business leads summary
            const leadsData = await marketIntelligenceWorkflows.discoverBusinessLeads({
                targetMarkets: ['vintage fashion', 'reselling'],
                leadSources: ['product-hunt', 'social-media'],
                maxLeads: 20
            });

            // Compile dashboard data
            const dashboardData = {
                productHunt: {
                    totalLaunches: productHuntData.totalLaunches,
                    relevantLaunches: productHuntData.relevantLaunches,
                    opportunityScore: productHuntData.opportunityScore,
                    topTrends: productHuntData.marketInsights?.emergingTrends?.slice(0, 5) || []
                },
                businessLeads: {
                    totalLeads: leadsData.totalLeadsFound,
                    qualifiedLeads: leadsData.qualifiedLeads,
                    leadQualityScore: leadsData.leadQualityScore,
                    conversionPotential: leadsData.conversionPotential
                },
                marketInsights: {
                    emergingTrends: productHuntData.marketInsights?.emergingTrends || [],
                    competitiveThreats: productHuntData.competitiveIntelligence?.threatLevel || 'Low',
                    opportunities: productHuntData.competitiveIntelligence?.opportunityLevel || 'Medium'
                },
                lastUpdated: new Date().toISOString()
            };

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    dashboard: dashboardData,
                    timeframe,
                    categories
                }
            };

        } catch (error) {
            context.log.error('Market intelligence dashboard generation failed:', error);
            
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: 'Failed to generate market intelligence dashboard'
                }
            };
        }
    }
});

// Execute Combined Market Intelligence Analysis
app.http('executeMarketIntelligenceAnalysis', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'market-intelligence/comprehensive-analysis',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { 
                includeProductHunt = true,
                includeBusinessLeads = true,
                includeTrendAnalysis = true,
                productData = [],
                analysisConfig = {}
            } = body;

            context.log('Executing comprehensive market intelligence analysis');

            const results = {};

            // Execute Product Hunt tracking if requested
            if (includeProductHunt) {
                context.log('Running Product Hunt analysis...');
                results.productHuntAnalysis = await marketIntelligenceWorkflows.trackDailyProductHuntLaunches({
                    categories: analysisConfig.categories || ['fashion', 'e-commerce', 'marketplace'],
                    trackingPeriod: analysisConfig.trackingPeriod || 'daily',
                    analysisDepth: analysisConfig.analysisDepth || 'standard'
                });
            }

            // Execute business lead discovery if requested
            if (includeBusinessLeads) {
                context.log('Running business lead discovery...');
                results.businessLeadAnalysis = await marketIntelligenceWorkflows.discoverBusinessLeads({
                    targetMarkets: analysisConfig.targetMarkets || ['vintage fashion', 'reselling', 'e-commerce'],
                    leadSources: analysisConfig.leadSources || ['product-hunt', 'social-media', 'marketplaces'],
                    qualificationCriteria: analysisConfig.qualificationCriteria || {},
                    maxLeads: analysisConfig.maxLeads || 50
                });
            }

            // Execute trend analysis if requested and product data is available
            if (includeTrendAnalysis && productData.length > 0) {
                context.log('Running automated trend analysis...');
                results.trendAnalysis = await marketIntelligenceWorkflows.buildAutomatedTrendAnalysis({
                    productData,
                    analysisTimeframe: analysisConfig.analysisTimeframe || '30days',
                    trendCategories: analysisConfig.trendCategories || ['pricing', 'demand', 'categories', 'seasonality'],
                    benchmarkData: analysisConfig.benchmarkData || {}
                });
            }

            // Generate combined insights
            const combinedInsights = this.generateCombinedInsights(results);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    analysis: results,
                    combinedInsights,
                    executedAt: new Date().toISOString(),
                    analysisConfig
                }
            };

        } catch (error) {
            context.log.error('Comprehensive market intelligence analysis failed:', error);
            
            const errorResponse = errorHandler.handleApiError(error, 'COMPREHENSIVE_MARKET_INTELLIGENCE_ERROR');
            
            return {
                status: errorResponse.status || 500,
                jsonBody: {
                    success: false,
                    error: errorResponse.message,
                    code: errorResponse.code
                }
            };
        }
    }
});

// Get Market Intelligence Workflow Status
app.http('getMarketIntelligenceStatus', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'market-intelligence/status',
    handler: async (request, context) => {
        try {
            const workflowHistory = workflowEngine.getExecutionHistory(20);
            const marketIntelligenceExecutions = workflowHistory.filter(exec => 
                exec.workflowName.includes('product-hunt') || 
                exec.workflowName.includes('business-lead') || 
                exec.workflowName.includes('trend-analysis')
            );

            const status = {
                totalExecutions: marketIntelligenceExecutions.length,
                recentExecutions: marketIntelligenceExecutions.slice(0, 10),
                successRate: marketIntelligenceExecutions.length > 0 ? 
                    (marketIntelligenceExecutions.filter(e => e.status === 'completed').length / marketIntelligenceExecutions.length * 100).toFixed(1) + '%' : 
                    '0%',
                lastExecution: marketIntelligenceExecutions[0]?.endTime || null,
                availableWorkflows: [
                    'product-hunt-tracking',
                    'business-lead-discovery', 
                    'automated-trend-analysis'
                ]
            };

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    status,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Failed to get market intelligence status:', error);
            
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: 'Failed to retrieve market intelligence status'
                }
            };
        }
    }
});

// Helper function to generate combined insights
function generateCombinedInsights(results) {
    const insights = {
        keyFindings: [],
        actionableRecommendations: [],
        riskAssessment: {},
        opportunityMatrix: {},
        priorityActions: []
    };

    // Analyze Product Hunt data
    if (results.productHuntAnalysis) {
        const phData = results.productHuntAnalysis;
        insights.keyFindings.push(`Found ${phData.relevantLaunches} relevant Product Hunt launches out of ${phData.totalLaunches} total`);
        insights.keyFindings.push(`Market opportunity score: ${phData.opportunityScore}/100`);
        
        if (phData.recommendations) {
            insights.actionableRecommendations.push(...phData.recommendations);
        }
    }

    // Analyze business leads data
    if (results.businessLeadAnalysis) {
        const leadData = results.businessLeadAnalysis;
        insights.keyFindings.push(`Discovered ${leadData.qualifiedLeads} qualified leads from ${leadData.totalLeadsFound} prospects`);
        insights.keyFindings.push(`Lead quality score: ${leadData.leadQualityScore}/100`);
        
        if (leadData.conversionPotential) {
            insights.keyFindings.push(`Estimated conversion potential: ${leadData.conversionPotential.conversionRate}`);
        }
    }

    // Analyze trend data
    if (results.trendAnalysis) {
        const trendData = results.trendAnalysis;
        insights.keyFindings.push(`Analyzed ${trendData.productsAnalyzed} products for trend patterns`);
        insights.keyFindings.push(`Overall trend score: ${trendData.trendScore}/100`);
        
        if (trendData.recommendations) {
            insights.actionableRecommendations.push(...trendData.recommendations);
        }
    }

    // Generate priority actions
    insights.priorityActions = [
        'Monitor top competitive threats from Product Hunt launches',
        'Reach out to high-priority qualified business leads',
        'Implement trending product categories in inventory',
        'Optimize pricing based on market trend analysis',
        'Develop partnerships with emerging market players'
    ];

    return insights;
}

export default app;