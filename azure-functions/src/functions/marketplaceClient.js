import { app } from '@azure/functions';
import { keyVault } from '../utils/keyVault.js';
import { errorHandler } from '../utils/errorHandler.js';
import { FacebookMarketplaceWorkflow } from './facebookMarketplaceWorkflow.js';
import axios from 'axios';

// Unified Marketplace Client - handles eBay, Facebook, Etsy
class UnifiedMarketplaceClient {
    constructor() {
        this.clients = {};
        this.initialized = false;
        this.facebookWorkflow = new FacebookMarketplaceWorkflow();
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Get all API credentials from Key Vault
            const [ebayToken, facebookToken, etsyToken, openaiKey] = await Promise.all([
                keyVault.getSecret('ebay-access-token'),
                keyVault.getSecret('facebook-access-token'),
                keyVault.getSecret('etsy-access-token'),
                keyVault.getSecret('openai-api-key')
            ]);

            // Determine eBay environment
            const isEbaySandbox = process.env.EBAY_ENVIRONMENT === 'sandbox';

            this.clients = {
                ebay: {
                    token: ebayToken,
                    baseUrl: isEbaySandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com',
                    sandbox: isEbaySandbox
                },
                facebook: {
                    token: facebookToken,
                    baseUrl: 'https://graph.facebook.com/v18.0'
                },
                etsy: {
                    token: etsyToken,
                    baseUrl: 'https://openapi.etsy.com/v3'
                },
                openai: {
                    key: openaiKey,
                    baseUrl: 'https://api.openai.com/v1'
                }
            };

            this.initialized = true;
        } catch (error) {
            throw new Error(`Failed to initialize marketplace clients: ${error.message}`);
        }
    }

    // Universal listing creation - works for all marketplaces
    async createListing(marketplace, productData) {
        await this.initialize();

        switch (marketplace.toLowerCase()) {
            case 'ebay':
                return this.createEbayListing(productData);
            case 'facebook':
                return this.createFacebookListing(productData);
            case 'etsy':
                return this.createEtsyListing(productData);
            default:
                throw new Error(`Unsupported marketplace: ${marketplace}`);
        }
    }

    async createEbayListing(productData) {
        const { title, description, price, images, category } = productData;

        const listingData = {
            Item: {
                Title: title,
                Description: description,
                StartPrice: price,
                CategoryID: category,
                PictureDetails: {
                    PictureURL: images
                },
                ListingDuration: 'Days_7',
                ListingType: 'FixedPriceItem',
                Currency: 'USD',
                Country: 'US',
                Location: 'United States',
                PaymentMethods: ['PayPal'],
                PayPalEmailAddress: await getSecret('PAYPAL-EMAIL'),
                ReturnPolicy: {
                    ReturnsAcceptedOption: 'ReturnsAccepted',
                    RefundOption: 'MoneyBack',
                    ReturnsWithinOption: 'Days_30'
                }
            }
        };

        const response = await fetch(`${this.clients.ebay.baseUrl}/ws/api.dll`, {
            method: 'POST',
            headers: {
                'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
                'X-EBAY-API-DEV-NAME': await getSecret('a4f5e1db-7edd-4a52-b128-9fd6bed1f9dd'),
                'X-EBAY-API-APP-NAME': await getSecret('KorinnCl-lumora-SBX-1cf2d78b4-9f6a04eb'),
                'X-EBAY-API-CERT-NAME': await getSecret('SBX-cf2d78b4f3a8-51de-41bc-99e2-1dff'),
                'X-EBAY-API-CALL-NAME': 'AddFixedPriceItem',
                'X-EBAY-API-SITEID': '0',
                'Content-Type': 'text/xml'
            },
            body: this.buildEbayXML('AddFixedPriceItem', listingData)
        });

        return this.parseEbayResponse(await response.text());
    }

    async createFacebookListing(productData) {
        // Use the dedicated Facebook workflow for better error handling and features
        return await this.facebookWorkflow.createSingleListing(productData, productData.images || []);
    }

    // Facebook Conversion API event tracking
    async sendFacebookConversionEvent(eventName, eventData) {
        try {
            const pixelId = await getSecret('FACEBOOK-PIXEL-ID');
            const accessToken = await getSecret('FACEBOOK-CONVERSION-API-TOKEN');

            const conversionData = {
                data: [{
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: 'website',
                    event_source_url: 'https://your-domain.com',
                    custom_data: eventData
                }]
            };

            await fetch(`${this.clients.facebook.baseUrl}/${pixelId}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(conversionData)
            });
        } catch (error) {
            // Don't fail the main listing if conversion tracking fails
            console.warn('Facebook Conversion API error:', error.message);
        }
    }

    async createEtsyListing(productData) {
        const { title, description, price, images, category } = productData;

        const listingData = {
            title: title,
            description: description,
            price: price,
            quantity: 1,
            taxonomy_id: this.mapToEtsyTaxonomy(category),
            tags: this.generateEtsyTags(productData),
            materials: productData.materials || ['vintage'],
            shipping_template_id: await getSecret('ETSY-SHIPPING-TEMPLATE-ID'),
            who_made: 'someone_else',
            when_made: this.mapVintageYear(productData.estimatedYear),
            is_supply: false,
            state: 'draft' // Create as draft first
        };

        const response = await fetch(`${this.clients.etsy.baseUrl}/application/shops/me/listings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.clients.etsy.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(listingData)
        });

        return await response.json();
    }

    // Utility methods
    buildEbayXML(callName, data) {
        return `<?xml version="1.0" encoding="utf-8"?>
        <${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents">
            <RequesterCredentials>
                <eBayAuthToken>${this.clients.ebay.token}</eBayAuthToken>
            </RequesterCredentials>
            ${this.objectToXML(data)}
        </${callName}Request>`;
    }

    objectToXML(obj, indent = '') {
        let xml = '';
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                xml += `${indent}<${key}>\n${this.objectToXML(value, indent + '  ')}\n${indent}</${key}>\n`;
            } else if (Array.isArray(value)) {
                value.forEach(item => {
                    xml += `${indent}<${key}>${item}</${key}>\n`;
                });
            } else {
                xml += `${indent}<${key}>${value}</${key}>\n`;
            }
        }
        return xml;
    }

    parseEbayResponse(xmlText) {
        // Simple XML parsing for eBay responses
        const ack = xmlText.match(/<Ack>([^<]+)<\/Ack>/)?.[1];
        const itemId = xmlText.match(/<ItemID>([^<]+)<\/ItemID>/)?.[1];
        const errors = xmlText.match(/<Errors>[\s\S]*?<\/Errors>/g) || [];

        return {
            success: ack === 'Success',
            itemId,
            errors: errors.map(e => e.match(/<LongMessage>([^<]+)<\/LongMessage>/)?.[1]).filter(Boolean)
        };
    }

    mapToFacebookCategory(ebayCategory) {
        const categoryMap = {
            '11450': 'CLOTHING_AND_ACCESSORIES',
            '281': 'JEWELRY_AND_WATCHES',
            '1': 'ANTIQUES_AND_COLLECTIBLES'
        };
        return categoryMap[ebayCategory] || 'OTHER';
    }

    mapToEtsyTaxonomy(ebayCategory) {
        const taxonomyMap = {
            '11450': 1, // Clothing
            '281': 4, // Jewelry
            '1': 69 // Vintage
        };
        return taxonomyMap[ebayCategory] || 69;
    }

    generateEtsyTags(productData) {
        const tags = ['vintage'];
        if (productData.brand) tags.push(productData.brand.toLowerCase());
        if (productData.material) tags.push(productData.material.toLowerCase());
        if (productData.theme) tags.push(productData.theme.toLowerCase());
        if (productData.estimatedYear) {
            const decade = Math.floor(productData.estimatedYear / 10) * 10;
            tags.push(`${decade}s`);
        }
        return tags.slice(0, 13); // Etsy max 13 tags
    }

    mapVintageYear(year) {
        if (!year) return 'vintage';
        if (year < 1920) return 'vintage';
        if (year < 1946) return '1940s';
        if (year < 1956) return '1950s';
        if (year < 1966) return '1960s';
        if (year < 1976) return '1970s';
        if (year < 1986) return '1980s';
        if (year < 1996) return '1990s';
        return 'vintage';
    }
}

// Azure Function endpoint
app.http('marketplaceClient', {
    methods: ['POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        try {
            const { marketplace, action, data } = await request.json();
            const client = new UnifiedMarketplaceClient();

            let result;
            switch (action) {
                case 'createListing':
                    result = await client.createListing(marketplace, data);
                    break;
                case 'bulkCreate':
                    if (marketplace.toLowerCase() === 'facebook') {
                        // Use Facebook workflow for bulk operations with better rate limiting
                        const imageUrlsArray = data.listings.map(listing => listing.images || []);
                        result = await client.facebookWorkflow.createBulkListings(data.listings, imageUrlsArray);
                    } else {
                        result = await Promise.all(
                            data.listings.map(listing =>
                                client.createListing(marketplace, listing)
                            )
                        );
                    }
                    break;
                default:
                    throw new Error(`Unsupported action: ${action}`);
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    data: result
                }
            };

        } catch (error) {
            context.log.error('Marketplace client error:', error);
            return errorHandler.handleApiError(error, 'marketplaceClient', { marketplace, action });
        }
    }
});