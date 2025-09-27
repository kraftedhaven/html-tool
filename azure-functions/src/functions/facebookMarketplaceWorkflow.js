import { app } from '@azure/functions';
import { keyVault } from '../utils/keyVault.js';
import { errorHandler } from '../utils/errorHandler.js';
import { checkMarketplaceAccess, withUsageTracking } from '../middleware/usageTracking.js';
import axios from 'axios';

class FacebookMarketplaceWorkflow {
    constructor() {
        this.baseUrl = 'https://graph.facebook.com/v18.0';
        this.accessToken = null;
        this.pageId = null;
        this.initialized = false;
        
        // Facebook category mapping from eBay categories
        this.categoryMapping = {
            // Clothing & Accessories
            '11450': 'CLOTHING_AND_ACCESSORIES',
            '15724': 'CLOTHING_AND_ACCESSORIES', // Women's clothing
            '1059': 'CLOTHING_AND_ACCESSORIES',  // Men's clothing
            
            // Jewelry & Watches
            '281': 'JEWELRY_AND_WATCHES',
            '14324': 'JEWELRY_AND_WATCHES',
            
            // Antiques & Collectibles
            '1': 'ANTIQUES_AND_COLLECTIBLES',
            '20081': 'ANTIQUES_AND_COLLECTIBLES',
            
            // Home & Garden
            '11700': 'HOME_AND_GARDEN',
            '159912': 'HOME_AND_GARDEN',
            
            // Electronics
            '58058': 'ELECTRONICS',
            '293': 'ELECTRONICS',
            
            // Default fallback
            'default': 'OTHER'
        };

        // Rate limiting configuration
        this.rateLimiter = {
            requests: 0,
            resetTime: Date.now() + 3600000, // 1 hour
            maxRequests: 200 // Facebook's hourly limit
        };
    }

    async initialize() {
        if (this.initialized) return;

        try {
            this.accessToken = await keyVault.getSecret('facebook-access-token');
            this.pageId = await keyVault.getSecret('facebook-page-id');
            
            if (!this.accessToken || !this.pageId) {
                throw new Error('Facebook credentials not found in Key Vault');
            }

            this.initialized = true;
            errorHandler.logEvent('FacebookWorkflowInitialized', { pageId: this.pageId });
        } catch (error) {
            errorHandler.logError(error, { operation: 'FacebookWorkflowInitialize' });
            throw error;
        }
    }

    async checkRateLimit() {
        const now = Date.now();
        
        // Reset counter if hour has passed
        if (now > this.rateLimiter.resetTime) {
            this.rateLimiter.requests = 0;
            this.rateLimiter.resetTime = now + 3600000;
        }

        if (this.rateLimiter.requests >= this.rateLimiter.maxRequests) {
            const waitTime = this.rateLimiter.resetTime - now;
            throw new Error(`Facebook API rate limit exceeded. Try again in ${Math.ceil(waitTime / 60000)} minutes.`);
        }

        this.rateLimiter.requests++;
    }

    mapToFacebookCategory(ebayCategoryId) {
        return this.categoryMapping[ebayCategoryId] || this.categoryMapping['default'];
    }

    generateFacebookDescription(productAnalysis) {
        const { 
            seoTitle, 
            brand, 
            productType, 
            size, 
            color, 
            condition, 
            keyFeatures, 
            estimatedYear, 
            material, 
            fabricType, 
            theme 
        } = productAnalysis;

        let description = `${seoTitle}\n\n`;
        
        if (brand && brand !== 'Unknown') {
            description += `Brand: ${brand}\n`;
        }
        
        if (size && size !== 'Unknown') {
            description += `Size: ${size}\n`;
        }
        
        if (color?.primary) {
            description += `Color: ${color.primary}`;
            if (color.secondary && color.secondary !== color.primary) {
                description += ` with ${color.secondary}`;
            }
            description += '\n';
        }
        
        if (condition) {
            description += `Condition: ${condition}\n`;
        }
        
        if (material && material !== 'Unknown') {
            description += `Material: ${material}`;
            if (fabricType && fabricType !== material) {
                description += ` (${fabricType})`;
            }
            description += '\n';
        }
        
        if (estimatedYear && estimatedYear > 1900) {
            description += `Estimated Year: ${estimatedYear}\n`;
        }
        
        if (theme && theme !== 'Unknown') {
            description += `Style/Theme: ${theme}\n`;
        }
        
        if (keyFeatures) {
            description += `\nKey Features:\n${keyFeatures}\n`;
        }
        
        description += '\n#vintage #thrifted #sustainable #fashion #unique';
        
        return description;
    }

    async createSingleListing(productAnalysis, imageUrls) {
        await this.initialize();
        await this.checkRateLimit();

        try {
            const facebookCategory = this.mapToFacebookCategory(productAnalysis.categoryId);
            const description = this.generateFacebookDescription(productAnalysis);
            
            // Prepare listing data
            const listingData = {
                name: productAnalysis.seoTitle,
                description: description,
                price: Math.round(productAnalysis.suggestedPrice * 100), // Facebook uses cents
                currency: 'USD',
                category: facebookCategory,
                availability: 'in_stock',
                condition: this.mapConditionToFacebook(productAnalysis.condition),
                brand: productAnalysis.brand || 'Vintage',
                retailer_id: `HHT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                images: imageUrls.map(url => ({ url }))
            };

            // Create the listing
            const response = await axios.post(
                `${this.baseUrl}/${this.pageId}/marketplace_listings`,
                listingData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const result = response.data;

            // Track conversion event for analytics
            if (result.id) {
                await this.trackConversionEvent('AddToCart', {
                    content_ids: [result.id],
                    content_name: productAnalysis.seoTitle,
                    content_category: facebookCategory,
                    value: productAnalysis.suggestedPrice,
                    currency: 'USD'
                });
            }

            errorHandler.logEvent('FacebookListingCreated', {
                listingId: result.id,
                category: facebookCategory,
                price: productAnalysis.suggestedPrice
            });

            return {
                success: true,
                listingId: result.id,
                marketplace: 'facebook',
                title: productAnalysis.seoTitle,
                price: productAnalysis.suggestedPrice,
                category: facebookCategory,
                url: `https://www.facebook.com/marketplace/item/${result.id}`
            };

        } catch (error) {
            // Handle Facebook-specific errors
            if (error.response?.status === 429) {
                throw new Error('Facebook API rate limit exceeded. Please wait before creating more listings.');
            }
            
            if (error.response?.status === 400) {
                const errorMessage = error.response.data?.error?.message || 'Invalid listing data';
                throw new Error(`Facebook listing validation failed: ${errorMessage}`);
            }
            
            if (error.response?.status === 403) {
                throw new Error('Facebook page permissions insufficient for marketplace listings');
            }

            errorHandler.logError(error, { 
                operation: 'FacebookCreateListing',
                productTitle: productAnalysis.seoTitle 
            });
            throw error;
        }
    }

    async createBulkListings(productAnalyses, imageUrlsArray) {
        await this.initialize();

        const results = [];
        const errors = [];
        let successCount = 0;
        let failureCount = 0;

        errorHandler.logEvent('FacebookBulkListingStarted', { 
            totalItems: productAnalyses.length 
        });

        for (let i = 0; i < productAnalyses.length; i++) {
            try {
                // Add delay between requests to respect rate limits
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
                }

                const result = await this.createSingleListing(
                    productAnalyses[i], 
                    imageUrlsArray[i] || []
                );
                
                results.push(result);
                successCount++;

            } catch (error) {
                const errorResult = {
                    success: false,
                    error: error.message,
                    productTitle: productAnalyses[i].seoTitle,
                    index: i
                };
                
                results.push(errorResult);
                errors.push(errorResult);
                failureCount++;

                // If rate limit hit, stop processing
                if (error.message.includes('rate limit')) {
                    errorHandler.logEvent('FacebookBulkListingRateLimited', {
                        processedItems: i + 1,
                        successCount,
                        failureCount
                    });
                    break;
                }
            }
        }

        errorHandler.logEvent('FacebookBulkListingCompleted', {
            totalItems: productAnalyses.length,
            successCount,
            failureCount,
            processingTime: Date.now()
        });

        return {
            success: successCount > 0,
            totalProcessed: results.length,
            successCount,
            failureCount,
            results,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    async trackConversionEvent(eventName, eventData) {
        try {
            const pixelId = await keyVault.getSecret('facebook-pixel-id');
            const conversionToken = await keyVault.getSecret('facebook-conversion-api-token');

            if (!pixelId || !conversionToken) {
                console.warn('Facebook Pixel ID or Conversion API token not configured');
                return;
            }

            const conversionData = {
                data: [{
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: 'website',
                    event_source_url: 'https://hiddenhaven.azurestaticapps.net',
                    custom_data: eventData
                }]
            };

            await axios.post(
                `${this.baseUrl}/${pixelId}/events`,
                conversionData,
                {
                    headers: {
                        'Authorization': `Bearer ${conversionToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

        } catch (error) {
            // Don't fail the main operation if conversion tracking fails
            errorHandler.logError(error, { operation: 'FacebookConversionTracking' });
        }
    }

    mapConditionToFacebook(condition) {
        const conditionMap = {
            'new': 'new',
            'like new': 'new',
            'excellent': 'used_like_new',
            'very good': 'used_good',
            'good': 'used_good',
            'fair': 'used_fair',
            'poor': 'used_fair',
            'vintage': 'used_good'
        };

        return conditionMap[condition?.toLowerCase()] || 'used_good';
    }

    async getListingStatus(listingId) {
        await this.initialize();
        
        try {
            const response = await axios.get(
                `${this.baseUrl}/${listingId}?fields=id,name,price,availability,marketplace_listing_status`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    timeout: 10000
                }
            );

            return response.data;
        } catch (error) {
            errorHandler.logError(error, { 
                operation: 'FacebookGetListingStatus',
                listingId 
            });
            throw error;
        }
    }
}

// Azure Function endpoints
app.http('facebookMarketplaceWorkflow', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: checkMarketplaceAccess('facebook')(withUsageTracking('listings')(async (request, context) => {
        return await errorHandler.withErrorHandling('facebookMarketplaceWorkflow', async () => {
            const { action, data } = await request.json();
            const workflow = new FacebookMarketplaceWorkflow();

            switch (action) {
                case 'createListing':
                    const { productAnalysis, imageUrls } = data;
                    return errorHandler.createSuccessResponse(
                        await workflow.createSingleListing(productAnalysis, imageUrls),
                        'facebookCreateListing'
                    );

                case 'bulkCreate':
                    const { productAnalyses, imageUrlsArray } = data;
                    return errorHandler.createSuccessResponse(
                        await workflow.createBulkListings(productAnalyses, imageUrlsArray),
                        'facebookBulkCreate'
                    );

                case 'getStatus':
                    const { listingId } = data;
                    return errorHandler.createSuccessResponse(
                        await workflow.getListingStatus(listingId),
                        'facebookGetStatus'
                    );

                default:
                    throw new Error(`Unsupported action: ${action}`);
            }
        }, { action: request.action });
    }))
});

export { FacebookMarketplaceWorkflow };