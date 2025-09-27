/**
 * Azure Functions: Content Generation Endpoints
 * Handles SEO blog content generation, FAQ enrichment, and intelligent web queries
 */

import { app } from '@azure/functions';
import { contentGenerationWorkflows } from '../utils/contentGenerationWorkflows.js';
import { errorHandler } from '../utils/errorHandler.js';

// Generate SEO-optimized blog content
app.http('generateSEOBlogContent', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'content/blog/seo',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { topic, targetKeywords, productContext, contentLength } = body;

            if (!topic) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Topic is required for blog content generation'
                    }
                };
            }

            context.log(`Generating SEO blog content for topic: ${topic}`);

            const inputData = {
                topic,
                targetKeywords: targetKeywords || [],
                productContext: productContext || {},
                contentLength: contentLength || 'medium'
            };

            const results = await contentGenerationWorkflows.generateSEOBlogContent(inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Generate SEO-optimized blog content',
                    results,
                    generatedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('SEO blog content generation failed:', error);
            
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

// Enrich FAQ sections for product listings
app.http('enrichFAQSections', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'content/faq/enrich',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { productData, existingFAQs, customerQuestions, competitorFAQs } = body;

            if (!productData) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Product data is required for FAQ enrichment'
                    }
                };
            }

            context.log(`Enriching FAQ sections for product: ${productData.productType || 'Unknown'}`);

            const inputData = {
                productData,
                existingFAQs: existingFAQs || [],
                customerQuestions: customerQuestions || [],
                competitorFAQs: competitorFAQs || []
            };

            const results = await contentGenerationWorkflows.enrichFAQSections(inputData);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Enrich FAQ sections automation',
                    results,
                    enrichedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('FAQ enrichment failed:', error);
            
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

// Intelligent Web Query and Semantic Re-Ranking
app.http('intelligentWebQuery', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'intelligence/web-query',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { query, sources, relevanceCriteria, maxResults, semanticFilters } = body;

            if (!query) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Search query is required'
                    }
                };
            }

            context.log(`Executing intelligent web query: ${query}`);

            const inputData = {
                query,
                sources: sources || ['google', 'bing', 'duckduckgo'],
                relevanceCriteria: relevanceCriteria || 'competitive intelligence',
                maxResults: maxResults || 20,
                semanticFilters: semanticFilters || []
            };

            const results = await contentGenerationWorkflows.intelligentWebQueryAndRanking(inputData);

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
            context.log.error('Intelligent web query failed:', error);
            
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

// Batch content generation for multiple products
app.http('batchContentGeneration', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'content/batch',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { products, contentTypes, options } = body;

            if (!products || !Array.isArray(products) || products.length === 0) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Products array is required for batch content generation'
                    }
                };
            }

            context.log(`Batch content generation for ${products.length} products`);

            const results = [];
            const supportedTypes = contentTypes || ['blog', 'faq'];

            for (const product of products) {
                const productResults = {
                    productId: product.id || product.sku,
                    productType: product.productType,
                    content: {}
                };

                try {
                    // Generate blog content if requested
                    if (supportedTypes.includes('blog')) {
                        const blogTopic = `${product.productType} ${product.brand} Guide`;
                        const blogContent = await contentGenerationWorkflows.generateSEOBlogContent({
                            topic: blogTopic,
                            targetKeywords: [product.productType, product.brand].filter(Boolean),
                            productContext: product,
                            contentLength: options?.contentLength || 'medium'
                        });
                        productResults.content.blog = blogContent;
                    }

                    // Generate FAQ content if requested
                    if (supportedTypes.includes('faq')) {
                        const faqContent = await contentGenerationWorkflows.enrichFAQSections({
                            productData: product,
                            existingFAQs: product.existingFAQs || [],
                            customerQuestions: product.customerQuestions || []
                        });
                        productResults.content.faq = faqContent;
                    }

                    productResults.status = 'success';

                } catch (productError) {
                    context.log.error(`Content generation failed for product ${product.id}:`, productError);
                    productResults.status = 'error';
                    productResults.error = productError.message;
                }

                results.push(productResults);
            }

            const successCount = results.filter(r => r.status === 'success').length;
            const errorCount = results.filter(r => r.status === 'error').length;

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workflow: 'Batch Content Generation',
                    results,
                    summary: {
                        total: products.length,
                        successful: successCount,
                        failed: errorCount,
                        contentTypes: supportedTypes
                    },
                    executedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Batch content generation failed:', error);
            
            const errorResponse = errorHandler.handleError(error, 'BATCH_CONTENT_GENERATION_ERROR');
            
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

// Content optimization and analysis
app.http('analyzeContentSEO', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'content/analyze/seo',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { content, targetKeywords, contentType } = body;

            if (!content) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'Content is required for SEO analysis'
                    }
                };
            }

            context.log(`Analyzing SEO for ${contentType || 'content'}`);

            // Perform SEO analysis
            const analysis = {
                wordCount: content.split(' ').length,
                readingTime: Math.ceil(content.split(' ').length / 200),
                keywordDensity: this.calculateKeywordDensity(content, targetKeywords || []),
                seoScore: this.calculateSEOScore(content, targetKeywords || []),
                recommendations: this.generateSEORecommendations(content, targetKeywords || []),
                structure: this.analyzeContentStructure(content),
                readability: this.calculateReadabilityScore(content)
            };

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    analysis,
                    analyzedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            context.log.error('Content SEO analysis failed:', error);
            
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: 'Content SEO analysis failed'
                }
            };
        }
    }
});

export default app;