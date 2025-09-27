import { app } from '@azure/functions';
import { EBayMCPServer } from '../mcp/mcpServer.js';
import { errorHandler } from '../utils/errorHandler.js';

// Initialize MCP Server instance
const mcpServer = new EBayMCPServer();

/**
 * Generate Optimized Listing Draft Endpoint
 * Creates AI-optimized eBay listing drafts using Neural Listing Engine integration
 */
app.http('generateOptimizedListingDraft', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'ai-workflows/generate-listing-draft',
  handler: async (request, context) => {
    try {
      const { productAnalysis, marketData, additionalOptions } = await request.json();

      if (!productAnalysis) {
        return {
          status: 400,
          jsonBody: {
            error: 'Product analysis is required',
            example: {
              productAnalysis: {
                seoTitle: 'Vintage Nike Air Jordan Sneakers',
                brand: 'Nike',
                productType: 'Sneakers',
                size: '10',
                color: { primary: 'Black', secondary: 'Red' },
                condition: 'USED_EXCELLENT',
                keyFeatures: 'Classic design with original box',
                estimatedYear: 1995,
                material: 'Leather',
                suggestedPrice: 299.99,
                imageUrls: ['https://example.com/image1.jpg']
              },
              marketData: { optional: true },
              additionalOptions: { optional: true }
            }
          }
        };
      }

      // Execute AI workflow
      const result = await mcpServer.executeOperation('generateOptimizedListingDraft', {
        productAnalysis,
        marketData: marketData || {},
        ...additionalOptions
      });

      return {
        status: 200,
        jsonBody: {
          success: true,
          result,
          workflow: 'generateOptimizedListingDraft',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Generate Optimized Listing Error:', error);
      
      const errorResponse = errorHandler.handleError(error, 'AI_LISTING_GENERATION');
      
      return {
        status: errorResponse.status || 500,
        jsonBody: {
          success: false,
          error: errorResponse.message,
          workflow: 'generateOptimizedListingDraft',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});

/**
 * Search and Analyze Products Endpoint
 * AI-powered product search with market analysis and competitive intelligence
 */
app.http('searchAndAnalyzeProducts', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'ai-workflows/search-analyze-products',
  handler: async (request, context) => {
    try {
      const { query, options } = await request.json();

      if (!query) {
        return {
          status: 400,
          jsonBody: {
            error: 'Search query is required',
            example: {
              query: 'vintage nike sneakers',
              options: {
                categoryId: '15709',
                condition: 'all',
                priceRange: { min: 50, max: 500 },
                sortOrder: 'BestMatch',
                maxResults: 50
              }
            }
          }
        };
      }

      // Execute AI workflow
      const result = await mcpServer.executeOperation('searchAndAnalyzeProducts', {
        query,
        options: options || {}
      });

      return {
        status: 200,
        jsonBody: {
          success: true,
          result,
          workflow: 'searchAndAnalyzeProducts',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Search and Analyze Products Error:', error);
      
      const errorResponse = errorHandler.handleError(error, 'AI_PRODUCT_SEARCH');
      
      return {
        status: errorResponse.status || 500,
        jsonBody: {
          success: false,
          error: errorResponse.message,
          workflow: 'searchAndAnalyzeProducts',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});

/**
 * Enhanced Product Metadata Endpoint
 * Retrieves and enhances product metadata with AI analysis
 */
app.http('getEnhancedProductMetadata', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'ai-workflows/enhanced-metadata',
  handler: async (request, context) => {
    try {
      const { productIdentifier, identifierType } = await request.json();

      if (!productIdentifier) {
        return {
          status: 400,
          jsonBody: {
            error: 'Product identifier is required',
            example: {
              productIdentifier: 'SKU-12345',
              identifierType: 'sku' // or 'itemId', 'offerId'
            }
          }
        };
      }

      // Execute AI workflow
      const result = await mcpServer.executeOperation('getEnhancedProductMetadata', {
        productIdentifier,
        identifierType: identifierType || 'sku'
      });

      return {
        status: 200,
        jsonBody: {
          success: true,
          result,
          workflow: 'getEnhancedProductMetadata',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Enhanced Metadata Error:', error);
      
      const errorResponse = errorHandler.handleError(error, 'AI_METADATA_ENHANCEMENT');
      
      return {
        status: errorResponse.status || 500,
        jsonBody: {
          success: false,
          error: errorResponse.message,
          workflow: 'getEnhancedProductMetadata',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});

/**
 * Optimize Listing Decisions Endpoint
 * AI-powered listing optimization with performance analysis
 */
app.http('optimizeListingDecisions', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'ai-workflows/optimize-listing',
  handler: async (request, context) => {
    try {
      const { listingData, performanceData } = await request.json();

      if (!listingData) {
        return {
          status: 400,
          jsonBody: {
            error: 'Listing data is required',
            example: {
              listingData: {
                listingId: 'listing-123',
                sku: 'SKU-12345',
                title: 'Vintage Nike Air Jordan Sneakers',
                price: 299.99,
                categoryId: '15709',
                description: 'Classic sneakers in excellent condition'
              },
              performanceData: {
                views: 150,
                watchers: 12,
                conversionRate: 0.08,
                searchRanking: 15
              }
            }
          }
        };
      }

      // Execute AI workflow
      const result = await mcpServer.executeOperation('optimizeListingDecisions', {
        listingData,
        performanceData: performanceData || {}
      });

      return {
        status: 200,
        jsonBody: {
          success: true,
          result,
          workflow: 'optimizeListingDecisions',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Optimize Listing Decisions Error:', error);
      
      const errorResponse = errorHandler.handleError(error, 'AI_LISTING_OPTIMIZATION');
      
      return {
        status: errorResponse.status || 500,
        jsonBody: {
          success: false,
          error: errorResponse.message,
          workflow: 'optimizeListingDecisions',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});

/**
 * Complete AI Workflow Pipeline Endpoint
 * Combines multiple AI workflows for end-to-end listing optimization
 */
app.http('completeAIWorkflowPipeline', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'ai-workflows/complete-pipeline',
  handler: async (request, context) => {
    try {
      const { imageUrls, additionalData, workflowOptions } = await request.json();

      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return {
          status: 400,
          jsonBody: {
            error: 'Image URLs array is required',
            example: {
              imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
              additionalData: {
                price: 299.99,
                quantity: 1,
                condition: 'USED_EXCELLENT'
              },
              workflowOptions: {
                includeMarketAnalysis: true,
                optimizePricing: true,
                generateKeywords: true
              }
            }
          }
        };
      }

      const pipeline = [];
      const results = {};

      try {
        // Step 1: Analyze images with Neural Listing Engine
        pipeline.push('Image Analysis');
        const analysisResult = await mcpServer.analyzeImagesWithNeuralEngine(imageUrls);
        results.imageAnalysis = analysisResult;

        if (!analysisResult.success) {
          throw new Error('Image analysis failed');
        }

        // Step 2: Generate optimized listing draft
        pipeline.push('Listing Optimization');
        const listingResult = await mcpServer.executeOperation('generateOptimizedListingDraft', {
          productAnalysis: {
            ...analysisResult.analysis,
            imageUrls,
            ...additionalData
          }
        });
        results.optimizedListing = listingResult;

        // Step 3: Search and analyze similar products (if requested)
        if (workflowOptions?.includeMarketAnalysis) {
          pipeline.push('Market Analysis');
          const searchQuery = `${analysisResult.analysis.brand} ${analysisResult.analysis.productType}`.trim();
          const marketAnalysis = await mcpServer.executeOperation('searchAndAnalyzeProducts', {
            query: searchQuery,
            options: {
              categoryId: analysisResult.analysis.categoryId,
              maxResults: 25
            }
          });
          results.marketAnalysis = marketAnalysis;
        }

        // Step 4: Create final listing with MCP server
        pipeline.push('Listing Creation');
        const sku = `AI-PIPELINE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const finalListing = await mcpServer.createListingDraft({
          productAnalysis: {
            ...analysisResult.analysis,
            ...listingResult.result.listingDraft,
            imageUrls
          },
          sku,
          price: additionalData?.price || listingResult.result.listingDraft.price,
          quantity: additionalData?.quantity || 1
        });
        results.finalListing = finalListing;

        return {
          status: 200,
          jsonBody: {
            success: true,
            pipeline: pipeline,
            results: results,
            summary: {
              sku: sku,
              title: listingResult.result.listingDraft.title,
              price: listingResult.result.listingDraft.price,
              optimizationScore: listingResult.result.listingDraft.aiOptimizations?.titleScore || 0,
              marketInsights: results.marketAnalysis?.result?.marketInsights || null,
              listingId: finalListing.offerId
            },
            workflow: 'completeAIWorkflowPipeline',
            timestamp: new Date().toISOString()
          }
        };

      } catch (pipelineError) {
        return {
          status: 500,
          jsonBody: {
            success: false,
            error: `Pipeline failed at step: ${pipeline[pipeline.length - 1]}`,
            details: pipelineError.message,
            completedSteps: pipeline,
            partialResults: results,
            workflow: 'completeAIWorkflowPipeline',
            timestamp: new Date().toISOString()
          }
        };
      }

    } catch (error) {
      console.error('Complete AI Workflow Pipeline Error:', error);
      
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: error.message,
          workflow: 'completeAIWorkflowPipeline',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});

/**
 * AI Workflow Health Check
 */
app.http('aiWorkflowHealth', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'ai-workflows/health',
  handler: async (request, context) => {
    try {
      const availableWorkflows = [
        'generateOptimizedListingDraft',
        'searchAndAnalyzeProducts', 
        'getEnhancedProductMetadata',
        'optimizeListingDecisions',
        'completeAIWorkflowPipeline'
      ];

      return {
        status: 200,
        jsonBody: {
          status: 'healthy',
          service: 'eBay AI Workflows',
          availableWorkflows: availableWorkflows,
          endpoints: {
            generateListing: '/api/ai-workflows/generate-listing-draft',
            searchAnalyze: '/api/ai-workflows/search-analyze-products',
            enhancedMetadata: '/api/ai-workflows/enhanced-metadata',
            optimizeListing: '/api/ai-workflows/optimize-listing',
            completePipeline: '/api/ai-workflows/complete-pipeline'
          },
          integrations: {
            neuralListingEngine: 'active',
            openaiGPT: 'active',
            ebayAPI: 'active',
            mcpServer: 'active'
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 500,
        jsonBody: {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});