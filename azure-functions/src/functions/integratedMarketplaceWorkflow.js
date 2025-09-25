import { app } from '@azure/functions';
import { OpenAI } from 'openai';
import { keyVault } from '../utils/keyVault.js';
import { tokenManager } from '../utils/tokenManager.js';
import { errorHandler } from '../utils/errorHandler.js';
import { FacebookMarketplaceWorkflow } from './facebookMarketplaceWorkflow.js';
import axios from 'axios';

class IntegratedMarketplaceWorkflow {
    constructor() {
        this.openai = null;
        this.facebookWorkflow = new FacebookMarketplaceWorkflow();
        this.initialized = false;
        
        // eBay API Configuration
        this.ebayEnv = process.env.EBAY_ENV || 'production';
        this.ebayBase = this.ebayEnv === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const openaiApiKey = await keyVault.getSecret('openai-api-key');
            this.openai = new OpenAI({ apiKey: openaiApiKey });
            this.initialized = true;
            
            errorHandler.logEvent('IntegratedWorkflowInitialized');
        } catch (error) {
            errorHandler.logError(error, { operation: 'IntegratedWorkflowInitialize' });
            throw error;
        }
    }

    async analyzeImages(imageFiles) {
        await this.initialize();

        const analyses = [];
        
        for (const file of imageFiles) {
            try {
                // Validate file size
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error(`Image ${file.originalname} is too large (max 5MB)`);
                }

                const b64 = file.buffer.toString('base64');

                // OpenAI Vision analysis
                const openaiResp = await this.openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    response_format: { type: "json_object" },
                    messages: [{
                        role: 'system',
                        content: 'You are an expert e-commerce lister specializing in vintage items. Analyze the product image and return a structured JSON object optimized for marketplace listings. Be accurate and detailed.'
                    }, {
                        role: 'user',
                        content: [{
                            type: 'text',
                            text: `Analyze this vintage/thrift product for marketplace listing. Generate an SEO-friendly title that includes key details. Identify all relevant attributes for reselling. Return ONLY a valid JSON object with this schema: {"seoTitle": string, "brand": string, "productType": string, "size": string, "color": {"primary": string, "secondary": string}, "condition": string, "keyFeatures": string, "estimatedYear": number | "", "countryOfManufacture": string, "material": string, "fabricType": string, "theme": string, "suggestedPrice": number, "confidence": number}`
                        }, {
                            type: 'image_url',
                            image_url: { 
                                url: `data:${file.mimetype};base64,${b64}`, 
                                detail: 'high' // Use high detail for better analysis
                            }
                        }]
                    }],
                    max_tokens: 1500,
                    temperature: 0.1,
                });

                let raw = openaiResp?.choices?.[0]?.message?.content || '{}';
                raw = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
                
                let parsed;
                try {
                    parsed = JSON.parse(raw);
                } catch {
                    throw new Error('AI analysis returned invalid JSON format');
                }

                // Get eBay category suggestions
                let categoryInfo = {};
                try {
                    const token = await tokenManager.getEbayAccessToken();
                    const query = encodeURIComponent(parsed.productType || parsed.seoTitle || 'general');
                    const url = `${this.ebayBase}/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${query}`;
                    
                    const response = await axios.get(url, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 10000
                    });
                    
                    categoryInfo = response.data?.categorySuggestions?.[0]?.category || {};
                } catch (error) {
                    errorHandler.logError(error, { 
                        operation: 'EbayCategorySuggestion',
                        query: parsed.productType 
                    });
                }

                // Enhance analysis with category information
                const enhancedAnalysis = {
                    ...parsed,
                    categoryId: categoryInfo.categoryId,
                    categoryName: categoryInfo.categoryName,
                    fileName: file.originalname,
                    analysisTimestamp: new Date().toISOString()
                };

                analyses.push(enhancedAnalysis);

                errorHandler.logEvent('ImageAnalysisCompleted', {
                    fileName: file.originalname,
                    productType: parsed.productType,
                    confidence: parsed.confidence
                });

            } catch (error) {
                errorHandler.logError(error, { 
                    operation: 'ImageAnalysis',
                    fileName: file.originalname 
                });
                
                // Add error result to maintain array consistency
                analyses.push({
                    error: error.message,
                    fileName: file.originalname,
                    analysisTimestamp: new Date().toISOString()
                });
            }
        }

        return analyses;
    }

    async processImagesAndCreateFacebookListings(imageFiles, imageUrls) {
        await this.initialize();

        try {
            // Step 1: Analyze all images
            errorHandler.logEvent('IntegratedWorkflowStarted', { 
                imageCount: imageFiles.length,
                workflow: 'facebook' 
            });

            const analyses = await this.analyzeImages(imageFiles);
            
            // Filter out failed analyses
            const validAnalyses = analyses.filter(analysis => !analysis.error);
            const failedAnalyses = analyses.filter(analysis => analysis.error);

            if (validAnalyses.length === 0) {
                throw new Error('No images could be successfully analyzed');
            }

            // Step 2: Create Facebook listings
            const facebookResults = await this.facebookWorkflow.createBulkListings(
                validAnalyses,
                imageUrls
            );

            // Step 3: Compile comprehensive results
            const results = {
                success: facebookResults.success,
                totalImages: imageFiles.length,
                analyzedSuccessfully: validAnalyses.length,
                analysisFailed: failedAnalyses.length,
                facebookListings: {
                    created: facebookResults.successCount,
                    failed: facebookResults.failureCount,
                    results: facebookResults.results
                },
                failedAnalyses: failedAnalyses.length > 0 ? failedAnalyses : undefined,
                processingTime: Date.now()
            };

            errorHandler.logEvent('IntegratedWorkflowCompleted', {
                totalImages: imageFiles.length,
                successfulListings: facebookResults.successCount,
                failedListings: facebookResults.failureCount
            });

            return results;

        } catch (error) {
            errorHandler.logError(error, { 
                operation: 'IntegratedFacebookWorkflow',
                imageCount: imageFiles.length 
            });
            throw error;
        }
    }

    async createMultiMarketplaceListings(imageFiles, imageUrls, marketplaces = ['facebook']) {
        await this.initialize();

        try {
            // Step 1: Analyze images
            const analyses = await this.analyzeImages(imageFiles);
            const validAnalyses = analyses.filter(analysis => !analysis.error);

            if (validAnalyses.length === 0) {
                throw new Error('No images could be successfully analyzed');
            }

            const results = {
                totalImages: imageFiles.length,
                analyzedSuccessfully: validAnalyses.length,
                marketplaceResults: {}
            };

            // Step 2: Create listings on each marketplace
            for (const marketplace of marketplaces) {
                try {
                    switch (marketplace.toLowerCase()) {
                        case 'facebook':
                            const facebookResults = await this.facebookWorkflow.createBulkListings(
                                validAnalyses,
                                imageUrls
                            );
                            results.marketplaceResults.facebook = facebookResults;
                            break;

                        // Future marketplaces can be added here
                        case 'etsy':
                            // TODO: Implement Etsy workflow
                            results.marketplaceResults.etsy = {
                                success: false,
                                error: 'Etsy integration not yet implemented'
                            };
                            break;

                        case 'ebay':
                            // TODO: Implement eBay workflow integration
                            results.marketplaceResults.ebay = {
                                success: false,
                                error: 'eBay integration not yet implemented in this workflow'
                            };
                            break;

                        default:
                            results.marketplaceResults[marketplace] = {
                                success: false,
                                error: `Unsupported marketplace: ${marketplace}`
                            };
                    }
                } catch (error) {
                    results.marketplaceResults[marketplace] = {
                        success: false,
                        error: error.message
                    };
                }
            }

            return results;

        } catch (error) {
            errorHandler.logError(error, { 
                operation: 'MultiMarketplaceWorkflow',
                marketplaces,
                imageCount: imageFiles.length 
            });
            throw error;
        }
    }

    async getWorkflowStatus(workflowId) {
        // This would typically query a database for workflow status
        // For now, return a simple status check
        return {
            workflowId,
            status: 'completed',
            timestamp: new Date().toISOString()
        };
    }
}

// Azure Function endpoints
app.http('integratedMarketplaceWorkflow', {
    methods: ['POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        return await errorHandler.withErrorHandling('integratedMarketplaceWorkflow', async () => {
            const contentType = request.headers.get('content-type') || '';
            
            if (!contentType.includes('multipart/form-data')) {
                throw new Error('Request must be multipart/form-data with images');
            }

            const formData = await request.formData();
            const imageFiles = [];
            const imageUrls = [];
            let action = 'facebook'; // default action
            let marketplaces = ['facebook']; // default marketplaces

            // Extract data from form
            for (const [key, value] of formData.entries()) {
                if (key === 'images' && value instanceof File) {
                    const buffer = Buffer.from(await value.arrayBuffer());
                    imageFiles.push({
                        buffer,
                        originalname: value.name,
                        mimetype: value.type,
                        size: buffer.length
                    });
                } else if (key === 'imageUrls') {
                    imageUrls.push(value);
                } else if (key === 'action') {
                    action = value;
                } else if (key === 'marketplaces') {
                    try {
                        marketplaces = JSON.parse(value);
                    } catch {
                        marketplaces = [value]; // Single marketplace as string
                    }
                }
            }

            if (imageFiles.length === 0) {
                throw new Error('No images provided');
            }

            const workflow = new IntegratedMarketplaceWorkflow();

            let result;
            switch (action) {
                case 'facebook':
                    result = await workflow.processImagesAndCreateFacebookListings(imageFiles, imageUrls);
                    break;

                case 'multi':
                    result = await workflow.createMultiMarketplaceListings(imageFiles, imageUrls, marketplaces);
                    break;

                case 'analyze':
                    result = await workflow.analyzeImages(imageFiles);
                    break;

                default:
                    throw new Error(`Unsupported action: ${action}`);
            }

            return errorHandler.createSuccessResponse(result, 'integratedMarketplaceWorkflow');

        }, { 
            contentType: request.headers.get('content-type'),
            userAgent: request.headers.get('user-agent')
        });
    }
});

export { IntegratedMarketplaceWorkflow };