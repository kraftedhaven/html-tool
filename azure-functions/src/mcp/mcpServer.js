import { EventEmitter } from 'events';
import { tokenManager } from '../utils/tokenManager.js';
import { keyVault } from '../utils/keyVault.js';
import { EBayAIWorkflows } from './ebayAIWorkflows.js';
import axios from 'axios';

// Import existing Neural Listing Engine functions for integration
const NEURAL_LISTING_BASE_URL = process.env.NEURAL_LISTING_BASE_URL || 'http://localhost:7071/api';

// eBay API Configuration
const EBAY_ENV = process.env.EBAY_ENV || 'production';
const EBAY_BASE = EBAY_ENV === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';

/**
 * MCP (Model Context Protocol) Server for eBay AI Agent Operations
 * Implements the 36 eBay seller account management operations
 */
class EBayMCPServer extends EventEmitter {
  constructor() {
    super();
    this.operations = new Map();
    this.aiWorkflows = new EBayAIWorkflows();
    this.initializeOperations();
  }

  /**
   * Initialize all 36 eBay seller account management operations
   */
  initializeOperations() {
    // Listing Management Operations (1-12)
    this.operations.set('createListingDraft', this.createListingDraft.bind(this));
    this.operations.set('updateListingDraft', this.updateListingDraft.bind(this));
    this.operations.set('publishListing', this.publishListing.bind(this));
    this.operations.set('endListing', this.endListing.bind(this));
    this.operations.set('reviseListing', this.reviseListing.bind(this));
    this.operations.set('getListingDetails', this.getListingDetails.bind(this));
    this.operations.set('getActiveListings', this.getActiveListings.bind(this));
    this.operations.set('getDraftListings', this.getDraftListings.bind(this));
    this.operations.set('getEndedListings', this.getEndedListings.bind(this));
    this.operations.set('bulkCreateListings', this.bulkCreateListings.bind(this));
    this.operations.set('bulkUpdateListings', this.bulkUpdateListings.bind(this));
    this.operations.set('bulkEndListings', this.bulkEndListings.bind(this));

    // Inventory Management Operations (13-18)
    this.operations.set('createInventoryItem', this.createInventoryItem.bind(this));
    this.operations.set('updateInventoryItem', this.updateInventoryItem.bind(this));
    this.operations.set('getInventoryItem', this.getInventoryItem.bind(this));
    this.operations.set('deleteInventoryItem', this.deleteInventoryItem.bind(this));
    this.operations.set('bulkCreateInventory', this.bulkCreateInventory.bind(this));
    this.operations.set('getInventoryItems', this.getInventoryItems.bind(this));

    // Order Management Operations (19-24)
    this.operations.set('getOrders', this.getOrders.bind(this));
    this.operations.set('getOrderDetails', this.getOrderDetails.bind(this));
    this.operations.set('fulfillOrder', this.fulfillOrder.bind(this));
    this.operations.set('shipOrder', this.shipOrder.bind(this));
    this.operations.set('cancelOrder', this.cancelOrder.bind(this));
    this.operations.set('processReturn', this.processReturn.bind(this));

    // Account Management Operations (25-30)
    this.operations.set('getSellerAccount', this.getSellerAccount.bind(this));
    this.operations.set('updateSellerAccount', this.updateSellerAccount.bind(this));
    this.operations.set('getSellerPolicies', this.getSellerPolicies.bind(this));
    this.operations.set('createSellerPolicy', this.createSellerPolicy.bind(this));
    this.operations.set('updateSellerPolicy', this.updateSellerPolicy.bind(this));
    this.operations.set('getSellerMetrics', this.getSellerMetrics.bind(this));

    // Product Research Operations (31-36)
    this.operations.set('searchProducts', this.searchProducts.bind(this));
    this.operations.set('getProductDetails', this.getProductDetails.bind(this));
    this.operations.set('getCategoryTree', this.getCategoryTree.bind(this));
    this.operations.set('suggestCategories', this.suggestCategories.bind(this));
    this.operations.set('getMarketInsights', this.getMarketInsights.bind(this));
    this.operations.set('analyzePricing', this.analyzePricing.bind(this));

    // AI Workflow Operations (37-40) - New AI-powered workflows
    this.operations.set('generateOptimizedListingDraft', this.generateOptimizedListingDraft.bind(this));
    this.operations.set('searchAndAnalyzeProducts', this.searchAndAnalyzeProducts.bind(this));
    this.operations.set('getEnhancedProductMetadata', this.getEnhancedProductMetadata.bind(this));
    this.operations.set('optimizeListingDecisions', this.optimizeListingDecisions.bind(this));
  }

  /**
   * Execute an MCP operation
   * @param {string} operation - Operation name
   * @param {Object} params - Operation parameters
   * @returns {Promise<Object>} Operation result
   */
  async executeOperation(operation, params = {}) {
    try {
      if (!this.operations.has(operation)) {
        throw new Error(`Unknown operation: ${operation}`);
      }

      console.log(`Executing MCP operation: ${operation}`, params);
      const result = await this.operations.get(operation)(params);
      
      this.emit('operationCompleted', { operation, params, result });
      return result;
    } catch (error) {
      console.error(`MCP operation failed: ${operation}`, error);
      this.emit('operationFailed', { operation, params, error: error.message });
      throw error;
    }
  }

  /**
   * Integrate with existing Neural Listing Engine image analysis
   * @param {Array} imageUrls - Array of image URLs to analyze
   * @returns {Promise<Object>} AI analysis results
   */
  async analyzeImagesWithNeuralEngine(imageUrls) {
    try {
      const response = await axios.post(`${NEURAL_LISTING_BASE_URL}/analyzeImages`, {
        imageUrls
      });
      
      return response.data;
    } catch (error) {
      console.error('Neural Listing Engine integration error:', error);
      throw new Error('Failed to analyze images with Neural Listing Engine');
    }
  }

  /**
   * Create listing using Neural Listing Engine analysis
   * @param {Array} imageUrls - Product images
   * @param {Object} additionalData - Additional product data
   * @returns {Promise<Object>} Complete listing creation result
   */
  async createListingWithNeuralAnalysis(imageUrls, additionalData = {}) {
    try {
      // Step 1: Analyze images with Neural Listing Engine
      const analysisResult = await this.analyzeImagesWithNeuralEngine(imageUrls);
      
      if (!analysisResult.success) {
        throw new Error('Image analysis failed');
      }

      // Step 2: Generate SKU
      const sku = `NLE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      // Step 3: Create listing draft with AI analysis
      const listingResult = await this.createListingDraft({
        productAnalysis: {
          ...analysisResult.analysis,
          imageUrls,
          ...additionalData
        },
        sku,
        price: additionalData.price || analysisResult.analysis.suggestedPrice,
        quantity: additionalData.quantity || 1
      });

      return {
        success: true,
        sku,
        analysisResult,
        listingResult,
        message: 'Listing created successfully with Neural Listing Engine integration'
      };
    } catch (error) {
      console.error('Neural Listing Engine integration error:', error);
      throw error;
    }
  }

  /**
   * Get authenticated headers for eBay API calls
   */
  async getAuthHeaders() {
    const token = await tokenManager.getEbayAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
    };
  }

  // Listing Management Operations (1-12)

  /**
   * Create a listing draft using AI-generated product analysis
   */
  async createListingDraft(params) {
    const { productAnalysis, sku, price, quantity = 1 } = params;
    
    if (!productAnalysis || !sku) {
      throw new Error('Product analysis and SKU are required');
    }

    const headers = await this.getAuthHeaders();
    
    // Create inventory item first
    const inventoryData = {
      product: {
        title: productAnalysis.seoTitle,
        description: this.generateListingDescription(productAnalysis),
        imageUrls: productAnalysis.imageUrls || [],
        aspects: this.generateProductAspects(productAnalysis)
      },
      condition: productAnalysis.condition || 'USED_EXCELLENT',
      availability: {
        shipToLocationAvailability: { quantity }
      }
    };

    await axios.put(
      `${EBAY_BASE}/sell/inventory/v1/inventory_item/${sku}`,
      inventoryData,
      { headers }
    );

    // Create offer (draft listing)
    const policySecrets = await keyVault.getSecrets([
      'ebay-fulfillment-policy-id',
      'ebay-payment-policy-id',
      'ebay-return-policy-id'
    ]);

    const offerData = {
      sku,
      marketplaceId: 'EBAY_US',
      format: 'FIXED_PRICE',
      listingDescription: this.generateListingDescription(productAnalysis),
      availableQuantity: quantity,
      categoryId: productAnalysis.categoryId,
      listingPolicies: {
        fulfillmentPolicyId: policySecrets['ebay-fulfillment-policy-id'],
        paymentPolicyId: policySecrets['ebay-payment-policy-id'],
        returnPolicyId: policySecrets['ebay-return-policy-id']
      },
      pricingSummary: {
        price: { value: price || productAnalysis.suggestedPrice, currency: 'USD' }
      }
    };

    const response = await axios.post(
      `${EBAY_BASE}/sell/inventory/v1/offer`,
      offerData,
      { headers }
    );

    return {
      success: true,
      offerId: response.data.offerId,
      sku,
      status: 'draft',
      message: 'Listing draft created successfully'
    };
  }

  /**
   * Update an existing listing draft
   */
  async updateListingDraft(params) {
    const { offerId, updates } = params;
    
    if (!offerId) {
      throw new Error('Offer ID is required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.put(
      `${EBAY_BASE}/sell/inventory/v1/offer/${offerId}`,
      updates,
      { headers }
    );

    return {
      success: true,
      offerId,
      message: 'Listing draft updated successfully'
    };
  }

  /**
   * Publish a listing from draft
   */
  async publishListing(params) {
    const { offerId } = params;
    
    if (!offerId) {
      throw new Error('Offer ID is required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.post(
      `${EBAY_BASE}/sell/inventory/v1/offer/${offerId}/publish`,
      {},
      { headers }
    );

    return {
      success: true,
      offerId,
      listingId: response.data.listingId,
      status: 'active',
      message: 'Listing published successfully'
    };
  }

  /**
   * End an active listing
   */
  async endListing(params) {
    const { offerId, reason = 'NOT_AVAILABLE' } = params;
    
    if (!offerId) {
      throw new Error('Offer ID is required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.post(
      `${EBAY_BASE}/sell/inventory/v1/offer/${offerId}/withdraw`,
      { reasonForWithdrawal: reason },
      { headers }
    );

    return {
      success: true,
      offerId,
      status: 'ended',
      message: 'Listing ended successfully'
    };
  }

  /**
   * Generate listing description from product analysis
   */
  generateListingDescription(productAnalysis) {
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

    let description = `<h2>${seoTitle}</h2>\n\n`;
    
    if (brand) description += `<p><strong>Brand:</strong> ${brand}</p>\n`;
    if (productType) description += `<p><strong>Type:</strong> ${productType}</p>\n`;
    if (size) description += `<p><strong>Size:</strong> ${size}</p>\n`;
    if (color?.primary) description += `<p><strong>Color:</strong> ${color.primary}${color.secondary ? ` / ${color.secondary}` : ''}</p>\n`;
    if (condition) description += `<p><strong>Condition:</strong> ${condition}</p>\n`;
    if (estimatedYear) description += `<p><strong>Era:</strong> ${estimatedYear}s</p>\n`;
    if (material) description += `<p><strong>Material:</strong> ${material}</p>\n`;
    if (fabricType) description += `<p><strong>Fabric:</strong> ${fabricType}</p>\n`;
    if (theme) description += `<p><strong>Style:</strong> ${theme}</p>\n`;
    
    if (keyFeatures) {
      description += `\n<h3>Key Features:</h3>\n<p>${keyFeatures}</p>\n`;
    }

    description += `\n<p><em>This item has been professionally analyzed using AI technology to ensure accurate description and categorization.</em></p>`;

    return description;
  }

  /**
   * Generate product aspects from analysis
   */
  generateProductAspects(productAnalysis) {
    const aspects = {};
    
    if (productAnalysis.brand) aspects.Brand = [productAnalysis.brand];
    if (productAnalysis.size) aspects.Size = [productAnalysis.size];
    if (productAnalysis.color?.primary) aspects.Color = [productAnalysis.color.primary];
    if (productAnalysis.material) aspects.Material = [productAnalysis.material];
    if (productAnalysis.condition) aspects.Condition = [productAnalysis.condition];
    if (productAnalysis.estimatedYear) aspects.Decade = [`${productAnalysis.estimatedYear}s`];
    if (productAnalysis.theme) aspects.Style = [productAnalysis.theme];
    if (productAnalysis.fabricType) aspects['Fabric Type'] = [productAnalysis.fabricType];
    
    return aspects;
  }

  /**
   * Revise an active listing
   */
  async reviseListing(params) {
    const { offerId, revisions } = params;
    
    if (!offerId || !revisions) {
      throw new Error('Offer ID and revisions are required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.put(
      `${EBAY_BASE}/sell/inventory/v1/offer/${offerId}`,
      revisions,
      { headers }
    );

    return {
      success: true,
      offerId,
      message: 'Listing revised successfully'
    };
  }

  /**
   * Get details of a specific listing
   */
  async getListingDetails(params) {
    const { offerId } = params;
    
    if (!offerId) {
      throw new Error('Offer ID is required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/sell/inventory/v1/offer/${offerId}`,
      { headers }
    );

    return {
      success: true,
      listing: response.data
    };
  }

  /**
   * Get all active listings
   */
  async getActiveListings(params) {
    const { limit = 100, offset = 0 } = params;
    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/sell/inventory/v1/offer?limit=${limit}&offset=${offset}`,
      { headers }
    );

    // Filter for published offers only
    const activeListings = response.data.offers?.filter(offer => 
      offer.status === 'PUBLISHED'
    ) || [];

    return {
      success: true,
      listings: activeListings,
      total: activeListings.length
    };
  }

  /**
   * Get all draft listings
   */
  async getDraftListings(params) {
    const { limit = 100, offset = 0 } = params;
    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/sell/inventory/v1/offer?limit=${limit}&offset=${offset}`,
      { headers }
    );

    // Filter for unpublished offers only
    const draftListings = response.data.offers?.filter(offer => 
      offer.status === 'UNPUBLISHED'
    ) || [];

    return {
      success: true,
      listings: draftListings,
      total: draftListings.length
    };
  }

  /**
   * Get all ended listings
   */
  async getEndedListings(params) {
    const { limit = 100, offset = 0 } = params;
    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/sell/inventory/v1/offer?limit=${limit}&offset=${offset}`,
      { headers }
    );

    // Filter for ended offers
    const endedListings = response.data.offers?.filter(offer => 
      offer.status === 'ENDED'
    ) || [];

    return {
      success: true,
      listings: endedListings,
      total: endedListings.length
    };
  }

  /**
   * Bulk create multiple listings
   */
  async bulkCreateListings(params) {
    const { listings } = params;
    
    if (!listings || !Array.isArray(listings)) {
      throw new Error('Listings array is required');
    }

    const headers = await this.getAuthHeaders();
    
    // Create inventory items first
    const inventoryRequests = listings.map(listing => ({
      sku: listing.sku,
      product: {
        title: listing.productAnalysis.seoTitle,
        description: this.generateListingDescription(listing.productAnalysis),
        imageUrls: listing.productAnalysis.imageUrls || [],
        aspects: this.generateProductAspects(listing.productAnalysis)
      },
      condition: listing.productAnalysis.condition || 'USED_EXCELLENT',
      availability: {
        shipToLocationAvailability: { quantity: listing.quantity || 1 }
      }
    }));

    await axios.post(
      `${EBAY_BASE}/sell/inventory/v1/bulk_create_or_replace_inventory_item`,
      { requests: inventoryRequests },
      { headers }
    );

    // Get policy IDs
    const policySecrets = await keyVault.getSecrets([
      'ebay-fulfillment-policy-id',
      'ebay-payment-policy-id',
      'ebay-return-policy-id'
    ]);

    // Create offers
    const offerRequests = listings.map(listing => ({
      sku: listing.sku,
      marketplaceId: 'EBAY_US',
      format: 'FIXED_PRICE',
      listingDescription: this.generateListingDescription(listing.productAnalysis),
      availableQuantity: listing.quantity || 1,
      categoryId: listing.productAnalysis.categoryId,
      listingPolicies: {
        fulfillmentPolicyId: policySecrets['ebay-fulfillment-policy-id'],
        paymentPolicyId: policySecrets['ebay-payment-policy-id'],
        returnPolicyId: policySecrets['ebay-return-policy-id']
      },
      pricingSummary: {
        price: { value: listing.price || listing.productAnalysis.suggestedPrice, currency: 'USD' }
      }
    }));

    const response = await axios.post(
      `${EBAY_BASE}/sell/inventory/v1/bulk_create_offer`,
      { requests: offerRequests },
      { headers }
    );

    return {
      success: true,
      created: response.data.responses?.length || 0,
      results: response.data.responses
    };
  }

  /**
   * Bulk update multiple listings
   */
  async bulkUpdateListings(params) {
    const { updates } = params;
    
    if (!updates || !Array.isArray(updates)) {
      throw new Error('Updates array is required');
    }

    const headers = await this.getAuthHeaders();
    const results = [];

    for (const update of updates) {
      try {
        const response = await axios.put(
          `${EBAY_BASE}/sell/inventory/v1/offer/${update.offerId}`,
          update.data,
          { headers }
        );
        results.push({ offerId: update.offerId, success: true });
      } catch (error) {
        results.push({ 
          offerId: update.offerId, 
          success: false, 
          error: error.message 
        });
      }
    }

    return {
      success: true,
      updated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Bulk end multiple listings
   */
  async bulkEndListings(params) {
    const { offerIds, reason = 'NOT_AVAILABLE' } = params;
    
    if (!offerIds || !Array.isArray(offerIds)) {
      throw new Error('Offer IDs array is required');
    }

    const headers = await this.getAuthHeaders();
    const results = [];

    for (const offerId of offerIds) {
      try {
        await axios.post(
          `${EBAY_BASE}/sell/inventory/v1/offer/${offerId}/withdraw`,
          { reasonForWithdrawal: reason },
          { headers }
        );
        results.push({ offerId, success: true });
      } catch (error) {
        results.push({ 
          offerId, 
          success: false, 
          error: error.message 
        });
      }
    }

    return {
      success: true,
      ended: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  // Inventory Management Operations (13-18)

  /**
   * Create inventory item
   */
  async createInventoryItem(params) {
    const { sku, productData } = params;
    
    if (!sku || !productData) {
      throw new Error('SKU and product data are required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.put(
      `${EBAY_BASE}/sell/inventory/v1/inventory_item/${sku}`,
      productData,
      { headers }
    );

    return {
      success: true,
      sku,
      message: 'Inventory item created successfully'
    };
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(params) {
    const { sku, updates } = params;
    
    if (!sku || !updates) {
      throw new Error('SKU and updates are required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.put(
      `${EBAY_BASE}/sell/inventory/v1/inventory_item/${sku}`,
      updates,
      { headers }
    );

    return {
      success: true,
      sku,
      message: 'Inventory item updated successfully'
    };
  }

  /**
   * Get inventory item details
   */
  async getInventoryItem(params) {
    const { sku } = params;
    
    if (!sku) {
      throw new Error('SKU is required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/sell/inventory/v1/inventory_item/${sku}`,
      { headers }
    );

    return {
      success: true,
      item: response.data
    };
  }

  /**
   * Delete inventory item
   */
  async deleteInventoryItem(params) {
    const { sku } = params;
    
    if (!sku) {
      throw new Error('SKU is required');
    }

    const headers = await this.getAuthHeaders();
    
    await axios.delete(
      `${EBAY_BASE}/sell/inventory/v1/inventory_item/${sku}`,
      { headers }
    );

    return {
      success: true,
      sku,
      message: 'Inventory item deleted successfully'
    };
  }

  /**
   * Bulk create inventory items
   */
  async bulkCreateInventory(params) {
    const { items } = params;
    
    if (!items || !Array.isArray(items)) {
      throw new Error('Items array is required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.post(
      `${EBAY_BASE}/sell/inventory/v1/bulk_create_or_replace_inventory_item`,
      { requests: items },
      { headers }
    );

    return {
      success: true,
      created: response.data.responses?.length || 0,
      results: response.data.responses
    };
  }

  /**
   * Get all inventory items
   */
  async getInventoryItems(params) {
    const { limit = 100, offset = 0 } = params;
    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/sell/inventory/v1/inventory_item?limit=${limit}&offset=${offset}`,
      { headers }
    );

    return {
      success: true,
      items: response.data.inventoryItems || [],
      total: response.data.total || 0
    };
  }

  // Order Management Operations (19-24)

  /**
   * Get orders
   */
  async getOrders(params) {
    const { 
      filter = 'creationdate:[2024-01-01T00:00:00.000Z..]',
      limit = 50,
      offset = 0 
    } = params;
    
    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/sell/fulfillment/v1/order?filter=${encodeURIComponent(filter)}&limit=${limit}&offset=${offset}`,
      { headers }
    );

    return {
      success: true,
      orders: response.data.orders || [],
      total: response.data.total || 0
    };
  }

  /**
   * Get order details
   */
  async getOrderDetails(params) {
    const { orderId } = params;
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/sell/fulfillment/v1/order/${orderId}`,
      { headers }
    );

    return {
      success: true,
      order: response.data
    };
  }

  /**
   * Fulfill order
   */
  async fulfillOrder(params) {
    const { orderId, lineItems, shippingCarrierCode, trackingNumber } = params;
    
    if (!orderId || !lineItems) {
      throw new Error('Order ID and line items are required');
    }

    const headers = await this.getAuthHeaders();
    
    const fulfillmentData = {
      lineItems,
      shippedDate: new Date().toISOString()
    };

    if (shippingCarrierCode && trackingNumber) {
      fulfillmentData.shippingCarrierCode = shippingCarrierCode;
      fulfillmentData.trackingNumber = trackingNumber;
    }

    const response = await axios.post(
      `${EBAY_BASE}/sell/fulfillment/v1/order/${orderId}/shipping_fulfillment`,
      fulfillmentData,
      { headers }
    );

    return {
      success: true,
      orderId,
      fulfillmentId: response.data.fulfillmentId,
      message: 'Order fulfilled successfully'
    };
  }

  /**
   * Ship order (alias for fulfill order with tracking)
   */
  async shipOrder(params) {
    return await this.fulfillOrder(params);
  }

  /**
   * Cancel order
   */
  async cancelOrder(params) {
    const { orderId, cancelReason = 'BUYER_CANCELLED' } = params;
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.post(
      `${EBAY_BASE}/sell/fulfillment/v1/order/${orderId}/issue_refund`,
      {
        reasonForRefund: cancelReason,
        comment: 'Order cancelled as requested'
      },
      { headers }
    );

    return {
      success: true,
      orderId,
      message: 'Order cancelled successfully'
    };
  }

  /**
   * Process return
   */
  async processReturn(params) {
    const { returnId, action, comments } = params;
    
    if (!returnId || !action) {
      throw new Error('Return ID and action are required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.post(
      `${EBAY_BASE}/sell/fulfillment/v1/return/${returnId}/decide`,
      {
        decision: action,
        comments: comments || 'Return processed'
      },
      { headers }
    );

    return {
      success: true,
      returnId,
      action,
      message: 'Return processed successfully'
    };
  }

  // Account Management Operations (25-30)

  /**
   * Get seller account information
   */
  async getSellerAccount(params) {
    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/sell/account/v1/privilege`,
      { headers }
    );

    return {
      success: true,
      account: response.data
    };
  }

  /**
   * Update seller account
   */
  async updateSellerAccount(params) {
    const { updates } = params;
    
    if (!updates) {
      throw new Error('Account updates are required');
    }

    // Note: Most account updates require specific endpoints
    return {
      success: true,
      message: 'Account update initiated - specific endpoints may be required for certain changes'
    };
  }

  /**
   * Get seller policies
   */
  async getSellerPolicies(params) {
    const { policyType = 'ALL' } = params;
    const headers = await this.getAuthHeaders();
    
    const endpoints = {
      'FULFILLMENT': '/sell/account/v1/fulfillment_policy',
      'PAYMENT': '/sell/account/v1/payment_policy',
      'RETURN': '/sell/account/v1/return_policy'
    };

    if (policyType === 'ALL') {
      const promises = Object.entries(endpoints).map(async ([type, endpoint]) => {
        try {
          const response = await axios.get(`${EBAY_BASE}${endpoint}`, { headers });
          return { type, policies: response.data };
        } catch (error) {
          return { type, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      return {
        success: true,
        policies: results
      };
    } else if (endpoints[policyType]) {
      const response = await axios.get(`${EBAY_BASE}${endpoints[policyType]}`, { headers });
      return {
        success: true,
        policies: response.data
      };
    } else {
      throw new Error('Invalid policy type');
    }
  }

  /**
   * Create seller policy
   */
  async createSellerPolicy(params) {
    const { policyType, policyData } = params;
    
    if (!policyType || !policyData) {
      throw new Error('Policy type and data are required');
    }

    const headers = await this.getAuthHeaders();
    const endpoints = {
      'FULFILLMENT': '/sell/account/v1/fulfillment_policy',
      'PAYMENT': '/sell/account/v1/payment_policy',
      'RETURN': '/sell/account/v1/return_policy'
    };

    if (!endpoints[policyType]) {
      throw new Error('Invalid policy type');
    }

    const response = await axios.post(
      `${EBAY_BASE}${endpoints[policyType]}`,
      policyData,
      { headers }
    );

    return {
      success: true,
      policyId: response.data.policyId,
      message: 'Policy created successfully'
    };
  }

  /**
   * Update seller policy
   */
  async updateSellerPolicy(params) {
    const { policyType, policyId, updates } = params;
    
    if (!policyType || !policyId || !updates) {
      throw new Error('Policy type, ID, and updates are required');
    }

    const headers = await this.getAuthHeaders();
    const endpoints = {
      'FULFILLMENT': '/sell/account/v1/fulfillment_policy',
      'PAYMENT': '/sell/account/v1/payment_policy',
      'RETURN': '/sell/account/v1/return_policy'
    };

    if (!endpoints[policyType]) {
      throw new Error('Invalid policy type');
    }

    const response = await axios.put(
      `${EBAY_BASE}${endpoints[policyType]}/${policyId}`,
      updates,
      { headers }
    );

    return {
      success: true,
      policyId,
      message: 'Policy updated successfully'
    };
  }

  /**
   * Get seller metrics
   */
  async getSellerMetrics(params) {
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await axios.get(
        `${EBAY_BASE}/sell/analytics/v1/seller_standards_profile`,
        { headers }
      );

      return {
        success: true,
        metrics: response.data
      };
    } catch (error) {
      // Fallback to basic account info if analytics not available
      const accountResponse = await axios.get(
        `${EBAY_BASE}/sell/account/v1/privilege`,
        { headers }
      );

      return {
        success: true,
        metrics: {
          basic: accountResponse.data,
          note: 'Full analytics may require additional permissions'
        }
      };
    }
  }

  // Product Research Operations (31-36)

  /**
   * Search products using eBay Browse API
   */
  async searchProducts(params) {
    const { query, categoryId, limit = 50, offset = 0 } = params;
    
    if (!query) {
      throw new Error('Search query is required');
    }

    const headers = await this.getAuthHeaders();
    
    let searchUrl = `${EBAY_BASE}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
    
    if (categoryId) {
      searchUrl += `&category_ids=${categoryId}`;
    }

    const response = await axios.get(searchUrl, { headers });

    return {
      success: true,
      products: response.data.itemSummaries || [],
      total: response.data.total || 0
    };
  }

  /**
   * Get detailed product information
   */
  async getProductDetails(params) {
    const { itemId } = params;
    
    if (!itemId) {
      throw new Error('Item ID is required');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/buy/browse/v1/item/${itemId}`,
      { headers }
    );

    return {
      success: true,
      product: response.data
    };
  }

  /**
   * Get eBay category tree
   */
  async getCategoryTree(params) {
    const { categoryTreeId = '0' } = params;
    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/commerce/taxonomy/v1/category_tree/${categoryTreeId}`,
      { headers }
    );

    return {
      success: true,
      categoryTree: response.data
    };
  }

  /**
   * Suggest categories for a product
   */
  async suggestCategories(params) {
    const { query } = params;
    
    if (!query) {
      throw new Error('Query is required for category suggestion');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${EBAY_BASE}/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${encodeURIComponent(query)}`,
      { headers }
    );

    return {
      success: true,
      suggestions: response.data.categorySuggestions || []
    };
  }

  /**
   * Get market insights and pricing data
   */
  async getMarketInsights(params) {
    const { query, categoryId } = params;
    
    if (!query) {
      throw new Error('Query is required for market insights');
    }

    // Use the existing eBay STR functionality for market insights
    const EBAY_FINDING_API_URL = 'https://svcs.ebay.com/services/search/FindingService/v1';
    const ebayClientId = await keyVault.getSecret('ebay-client-id');

    const soldParams = new URLSearchParams({
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.13.0',
      'SECURITY-APPNAME': ebayClientId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': true,
      'keywords': query,
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
      'paginationInput.entriesPerPage': '100'
    });

    if (categoryId) {
      soldParams.append('categoryId', categoryId);
    }

    const activeParams = new URLSearchParams(soldParams);
    activeParams.set('OPERATION-NAME', 'findItemsAdvanced');
    activeParams.delete('itemFilter(0).name');
    activeParams.delete('itemFilter(0).value');

    const [soldResponse, activeResponse] = await Promise.all([
      axios.get(`${EBAY_FINDING_API_URL}?${soldParams.toString()}`),
      axios.get(`${EBAY_FINDING_API_URL}?${activeParams.toString()}`)
    ]);

    const soldItems = soldResponse.data.findCompletedItemsResponse[0].searchResult[0].item || [];
    const activeItems = activeResponse.data.findItemsAdvancedResponse[0].searchResult[0].item || [];

    // Calculate market insights
    const soldPrices = soldItems.map(item => parseFloat(item.sellingStatus[0].currentPrice[0].__value__));
    const activePrices = activeItems.map(item => parseFloat(item.sellingStatus[0].currentPrice[0].__value__));

    const insights = {
      soldCount: soldItems.length,
      activeCount: activeItems.length,
      avgSoldPrice: soldPrices.length > 0 ? soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length : 0,
      avgActivePrice: activePrices.length > 0 ? activePrices.reduce((a, b) => a + b, 0) / activePrices.length : 0,
      minSoldPrice: soldPrices.length > 0 ? Math.min(...soldPrices) : 0,
      maxSoldPrice: soldPrices.length > 0 ? Math.max(...soldPrices) : 0,
      str: soldItems.length > 0 ? (soldItems.length / (soldItems.length + activeItems.length)) * 100 : 0
    };

    return {
      success: true,
      insights,
      soldItems: soldItems.slice(0, 10), // Return top 10 sold items
      activeItems: activeItems.slice(0, 10) // Return top 10 active items
    };
  }

  /**
   * Analyze pricing for optimal listing price
   */
  async analyzePricing(params) {
    const { query, categoryId, condition = 'USED' } = params;
    
    if (!query) {
      throw new Error('Query is required for pricing analysis');
    }

    // Get market insights first
    const insights = await this.getMarketInsights({ query, categoryId });
    
    // Calculate recommended pricing based on condition and market data
    let recommendedPrice = insights.result.insights.avgSoldPrice;
    
    // Adjust price based on condition
    const conditionMultipliers = {
      'NEW': 1.2,
      'NEW_OTHER': 1.1,
      'NEW_WITH_DEFECTS': 0.9,
      'MANUFACTURER_REFURBISHED': 0.85,
      'SELLER_REFURBISHED': 0.8,
      'USED_EXCELLENT': 0.95,
      'USED_VERY_GOOD': 0.85,
      'USED_GOOD': 0.75,
      'USED_ACCEPTABLE': 0.65,
      'FOR_PARTS_OR_NOT_WORKING': 0.4
    };

    if (conditionMultipliers[condition]) {
      recommendedPrice *= conditionMultipliers[condition];
    }

    // Calculate competitive pricing range
    const competitiveRange = {
      low: recommendedPrice * 0.9,
      optimal: recommendedPrice,
      high: recommendedPrice * 1.1
    };

    return {
      success: true,
      analysis: {
        recommendedPrice: Math.round(recommendedPrice * 100) / 100,
        competitiveRange,
        marketData: insights.result.insights,
        condition,
        confidence: insights.result.insights.soldCount > 10 ? 'HIGH' : 
                   insights.result.insights.soldCount > 5 ? 'MEDIUM' : 'LOW'
      }
    };
  }

  // AI Workflow Operations (37-40)

  /**
   * Generate optimized listing draft using AI workflows
   * Integrates with Neural Listing Engine and adds AI-powered optimization
   */
  async generateOptimizedListingDraft(params) {
    const { productAnalysis, marketData } = params;
    
    if (!productAnalysis) {
      throw new Error('Product analysis is required for optimized listing generation');
    }

    try {
      const result = await this.aiWorkflows.generateOptimizedListingDraft(productAnalysis, marketData);
      
      return {
        success: true,
        ...result,
        message: 'Optimized listing draft generated successfully with AI workflows'
      };
    } catch (error) {
      console.error('AI Listing Generation Error:', error);
      throw new Error(`Failed to generate optimized listing: ${error.message}`);
    }
  }

  /**
   * Search and analyze products with AI-powered insights
   */
  async searchAndAnalyzeProducts(params) {
    const { query, options = {} } = params;
    
    if (!query) {
      throw new Error('Search query is required');
    }

    try {
      const result = await this.aiWorkflows.searchAndAnalyzeProducts(query, options);
      
      return {
        success: true,
        ...result,
        message: 'Product search and analysis completed successfully'
      };
    } catch (error) {
      console.error('AI Product Search Error:', error);
      throw new Error(`Failed to search and analyze products: ${error.message}`);
    }
  }

  /**
   * Get enhanced product metadata with AI analysis
   */
  async getEnhancedProductMetadata(params) {
    const { productIdentifier, identifierType = 'sku' } = params;
    
    if (!productIdentifier) {
      throw new Error('Product identifier is required');
    }

    try {
      const result = await this.aiWorkflows.getEnhancedProductMetadata(productIdentifier, identifierType);
      
      return {
        success: true,
        ...result,
        message: 'Enhanced product metadata retrieved successfully'
      };
    } catch (error) {
      console.error('Enhanced Metadata Error:', error);
      throw new Error(`Failed to get enhanced metadata: ${error.message}`);
    }
  }

  /**
   * Optimize listing decisions using AI-powered analysis
   */
  async optimizeListingDecisions(params) {
    const { listingData, performanceData = {} } = params;
    
    if (!listingData) {
      throw new Error('Listing data is required for optimization');
    }

    try {
      const result = await this.aiWorkflows.optimizeListingDecisions(listingData, performanceData);
      
      return {
        success: true,
        ...result,
        message: 'Listing optimization decisions generated successfully'
      };
    } catch (error) {
      console.error('Listing Optimization Error:', error);
      throw new Error(`Failed to optimize listing decisions: ${error.message}`);
    }
  }
}

export { EBayMCPServer };