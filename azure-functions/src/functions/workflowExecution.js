/**
 * Azure Function: AI Workflow Execution
 * Handles execution of AI automation workflows for product research, SEO content, and competitive intelligence
 */

import { app } from '@azure/functions';
import { workflowEngine } from '../utils/workflowEngine.js';
import { errorHandler } from '../utils/errorHandler.js';

// Execute AI Workflow
app.http('executeWorkflow', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'workflow/execute',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { workflowName, inputData, options } = body;

            if (!workflowName) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Workflow name is required'
                    }
                };
            }

            context.log(`Executing workflow: ${workflowName}`);

            const results = await workflowEngine.executeWorkflow(workflowName, inputData || {}, options || {});

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflowName,
                    results,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Workflow execution failed:', error);
            
            const errorResponse = errorHandler.handleError(error, 'WORKFLOW_EXECUTION_ERROR');
            
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

// Get Available Workflows
app.http('getWorkflows', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'workflow/list',
    handler: async (request, context) => {
        try {
            await workflowEngine.initialize();
            
            const workflows = workflowEngine.getWorkflowList();
            const workflowDetails = {};
            
            for (const workflowName of workflows) {
                workflowDetails[workflowName] = workflowEngine.getWorkflowDetails(workflowName);
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflows: workflowDetails
                }
            };

        } catch (error) {
            context.log.error('Failed to get workflows:', error);
            
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: 'Failed to retrieve workflows'
                }
            };
        }
    }
});

// Get Workflow Execution History
app.http('getWorkflowHistory', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'workflow/history',
    handler: async (request, context) => {
        try {
            const url = new URL(request.url);
            const limit = parseInt(url.searchParams.get('limit')) || 10;
            
            const history = workflowEngine.getExecutionHistory(limit);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    history,
                    count: history.length
                }
            };

        } catch (error) {
            context.log.error('Failed to get workflow history:', error);
            
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: 'Failed to retrieve workflow history'
                }
            };
        }
    }
});

// Execute Product Research SEO Workflow (Specific endpoint for requirement 9.1)
app.http('executeProductResearchSEO', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'workflow/product-research-seo',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { productImages, productDescription, additionalData } = body;

            if (!productImages && !productDescription) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Either product images or description is required'
                    }
                };
            }

            context.log('Executing AI-Powered Product Research SEO Content Automation workflow');

            const inputData = {
                productImages,
                productDescription,
                ...additionalData
            };

            const results = await workflowEngine.executeWorkflow('product-research-seo', inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'AI-Powered Product Research SEO Content Automation',
                    results,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Product Research SEO workflow failed:', error);
            
            const errorResponse = errorHandler.handleError(error, 'PRODUCT_RESEARCH_SEO_ERROR');
            
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

// Execute Competitor Monitoring Workflow (Specific endpoint for requirement 9.2)
app.http('executeCompetitorMonitoring', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'workflow/competitor-monitoring',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { productKeywords, marketplaces, productData } = body;

            if (!productKeywords || !Array.isArray(productKeywords)) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Product keywords array is required'
                    }
                };
            }

            context.log('Executing Competitor Price Monitoring with Web Scraping workflow');

            const inputData = {
                productKeywords,
                marketplaces: marketplaces || ['ebay', 'facebook', 'etsy'],
                productData
            };

            const results = await workflowEngine.executeWorkflow('competitor-monitoring', inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Competitor Price Monitoring with Web Scraping',
                    results,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Competitor monitoring workflow failed:', error);
            
            const errorResponse = errorHandler.handleError(error, 'COMPETITOR_MONITORING_ERROR');
            
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

// Execute SEO Blog Content Generation Workflow (Specific endpoint for requirement 9.3)
app.http('executeSEOBlogContent', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'workflow/seo-blog-content',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { topic, targetAudience, productData } = body;

            if (!topic) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Topic is required for blog content generation'
                    }
                };
            }

            context.log('Executing Generate SEO-optimized blog content workflow');

            const inputData = {
                topic,
                targetAudience: targetAudience || 'vintage fashion enthusiasts and resellers',
                productData
            };

            const results = await workflowEngine.executeWorkflow('seo-blog-content', inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Generate SEO-optimized blog content',
                    results,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('SEO blog content generation workflow failed:', error);
            
            const errorResponse = errorHandler.handleError(error, 'SEO_BLOG_CONTENT_ERROR');
            
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

// Execute FAQ Enrichment Workflow (Specific endpoint for requirement 9.3)
app.http('executeFAQEnrichment', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'workflow/faq-enrichment',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { productData, existingFAQs, customerQuestions, marketplaceType } = body;

            if (!productData) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Product data is required for FAQ enrichment'
                    }
                };
            }

            context.log('Executing Enrich FAQ sections automation for product listings');

            const inputData = {
                productData,
                existingFAQs,
                customerQuestions,
                marketplaceType: marketplaceType || 'general'
            };

            const results = await workflowEngine.executeWorkflow('faq-enrichment', inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Enrich FAQ sections automation for product listings',
                    results,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('FAQ enrichment workflow failed:', error);
            
            const errorResponse = errorHandler.handleError(error, 'FAQ_ENRICHMENT_ERROR');
            
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

// Execute Intelligent Web Query and Semantic Re-Ranking Workflow (Specific endpoint for requirement 9.5)
app.http('executeIntelligentWebQuery', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'workflow/intelligent-web-query',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { searchQuery, sources, relevanceCriteria } = body;

            if (!searchQuery) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Search query is required for intelligent web query'
                    }
                };
            }

            context.log('Executing Intelligent Web Query and Semantic Re-Ranking for competitive intelligence');

            const inputData = {
                searchQuery,
                sources: sources || ['google', 'bing', 'duckduckgo'],
                relevanceCriteria: relevanceCriteria || 'vintage reselling competitive intelligence'
            };

            const results = await workflowEngine.executeWorkflow('market-intelligence', inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Intelligent Web Query and Semantic Re-Ranking',
                    results,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Intelligent web query workflow failed:', error);
            
            const errorResponse = errorHandler.handleError(error, 'INTELLIGENT_WEB_QUERY_ERROR');
            
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

// Execute Marketplace Content Optimization Workflow
app.http('executeMarketplaceContentOptimization', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'workflow/marketplace-content-optimization',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { productData, targetMarketplace, seoKeywords } = body;

            if (!productData || !targetMarketplace) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Product data and target marketplace are required'
                    }
                };
            }

            context.log(`Executing Marketplace Content Optimization for ${targetMarketplace}`);

            const inputData = {
                productData,
                targetMarketplace,
                seoKeywords
            };

            const results = await workflowEngine.executeWorkflow('marketplace-content-optimization', inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Marketplace-specific content optimization',
                    results,
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Marketplace content optimization workflow failed:', error);
            
            const errorResponse = errorHandler.handleError(error, 'MARKETPLACE_CONTENT_OPTIMIZATION_ERROR');
            
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

export default app;