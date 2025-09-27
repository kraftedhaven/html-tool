import { app } from '@azure/functions';
import { errorHandler } from '../utils/errorHandler.js';
import { withUsageTracking, withFeatureAccess } from '../middleware/usageTracking.js';

// Simplified endpoint for Facebook Marketplace integration
// This demonstrates how the workflow integrates with the existing system
app.http('facebookIntegration', {
    methods: ['POST'],
    authLevel: 'function',
    handler: withFeatureAccess('marketplaceCount')(withUsageTracking('listings')(async (request, context) => {
        return await errorHandler.withErrorHandling('facebookIntegration', async () => {
            const { action, data } = await request.json();

            switch (action) {
                case 'validateListing':
                    // Validate listing data before sending to Facebook
                    const validation = validateFacebookListing(data);
                    return errorHandler.createSuccessResponse(validation, 'validateListing');

                case 'formatForFacebook':
                    // Format product analysis data for Facebook Marketplace
                    const formatted = formatProductForFacebook(data);
                    return errorHandler.createSuccessResponse(formatted, 'formatForFacebook');

                case 'getBulkStatus':
                    // Get status of bulk listing operation
                    const status = getBulkListingStatus(data.batchId);
                    return errorHandler.createSuccessResponse(status, 'getBulkStatus');

                default:
                    throw new Error(`Unsupported action: ${action}`);
            }
        }, { action });
    }))
});

function validateFacebookListing(productData) {
    const errors = [];
    const warnings = [];

    // Required fields validation
    if (!productData.seoTitle || productData.seoTitle.length < 5) {
        errors.push('Title must be at least 5 characters long');
    }

    if (!productData.suggestedPrice || productData.suggestedPrice <= 0) {
        errors.push('Price must be greater than 0');
    }

    if (!productData.categoryId) {
        warnings.push('No category detected - will use default category');
    }

    // Facebook-specific validations
    if (productData.seoTitle && productData.seoTitle.length > 100) {
        warnings.push('Title is long - consider shortening for better visibility');
    }

    if (productData.suggestedPrice > 500) {
        warnings.push('High-value items may require additional verification on Facebook');
    }

    // Image validation
    if (!productData.images || productData.images.length === 0) {
        errors.push('At least one image is required for Facebook Marketplace');
    }

    if (productData.images && productData.images.length > 10) {
        warnings.push('Facebook Marketplace supports up to 10 images - extras will be ignored');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        readyForListing: errors.length === 0
    };
}

function formatProductForFacebook(productAnalysis) {
    // Map eBay category to Facebook category
    const categoryMapping = {
        '11450': 'CLOTHING_AND_ACCESSORIES',
        '15724': 'CLOTHING_AND_ACCESSORIES',
        '1059': 'CLOTHING_AND_ACCESSORIES',
        '281': 'JEWELRY_AND_WATCHES',
        '14324': 'JEWELRY_AND_WATCHES',
        '1': 'ANTIQUES_AND_COLLECTIBLES',
        '20081': 'ANTIQUES_AND_COLLECTIBLES',
        '11700': 'HOME_AND_GARDEN',
        '159912': 'HOME_AND_GARDEN',
        '58058': 'ELECTRONICS',
        '293': 'ELECTRONICS'
    };

    const facebookCategory = categoryMapping[productAnalysis.categoryId] || 'OTHER';

    // Generate Facebook-optimized description
    let description = `${productAnalysis.seoTitle}\n\n`;
    
    if (productAnalysis.brand && productAnalysis.brand !== 'Unknown') {
        description += `Brand: ${productAnalysis.brand}\n`;
    }
    
    if (productAnalysis.size && productAnalysis.size !== 'Unknown') {
        description += `Size: ${productAnalysis.size}\n`;
    }
    
    if (productAnalysis.color?.primary) {
        description += `Color: ${productAnalysis.color.primary}`;
        if (productAnalysis.color.secondary && productAnalysis.color.secondary !== productAnalysis.color.primary) {
            description += ` with ${productAnalysis.color.secondary}`;
        }
        description += '\n';
    }
    
    if (productAnalysis.condition) {
        description += `Condition: ${productAnalysis.condition}\n`;
    }
    
    if (productAnalysis.material && productAnalysis.material !== 'Unknown') {
        description += `Material: ${productAnalysis.material}`;
        if (productAnalysis.fabricType && productAnalysis.fabricType !== productAnalysis.material) {
            description += ` (${productAnalysis.fabricType})`;
        }
        description += '\n';
    }
    
    if (productAnalysis.estimatedYear && productAnalysis.estimatedYear > 1900) {
        description += `Estimated Year: ${productAnalysis.estimatedYear}\n`;
    }
    
    if (productAnalysis.theme && productAnalysis.theme !== 'Unknown') {
        description += `Style/Theme: ${productAnalysis.theme}\n`;
    }
    
    if (productAnalysis.keyFeatures) {
        description += `\nKey Features:\n${productAnalysis.keyFeatures}\n`;
    }
    
    description += '\n#vintage #thrifted #sustainable #fashion #unique';

    // Map condition to Facebook format
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

    const facebookCondition = conditionMap[productAnalysis.condition?.toLowerCase()] || 'used_good';

    return {
        name: productAnalysis.seoTitle,
        description: description,
        price: Math.round(productAnalysis.suggestedPrice * 100), // Facebook uses cents
        currency: 'USD',
        category: facebookCategory,
        availability: 'in_stock',
        condition: facebookCondition,
        brand: productAnalysis.brand || 'Vintage',
        retailer_id: `HHT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        images: (productAnalysis.images || []).slice(0, 10).map(url => ({ url })), // Max 10 images
        
        // Additional metadata for tracking
        originalAnalysis: {
            confidence: productAnalysis.confidence,
            categoryId: productAnalysis.categoryId,
            categoryName: productAnalysis.categoryName
        }
    };
}

function getBulkListingStatus(batchId) {
    // In a real implementation, this would query a database or cache
    // For now, return a mock status
    return {
        batchId,
        status: 'processing',
        totalItems: 5,
        completed: 3,
        failed: 1,
        pending: 1,
        estimatedCompletion: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
        lastUpdated: new Date().toISOString()
    };
}

export { validateFacebookListing, formatProductForFacebook, getBulkListingStatus };