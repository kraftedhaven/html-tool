import { app } from '@azure/functions';
import { EBayMCPServer } from '../mcp/mcpServer.js';
import { errorHandler } from '../utils/errorHandler.js';

// Initialize MCP Server instance
const mcpServer = new EBayMCPServer();

// Set up event listeners for monitoring
mcpServer.on('operationCompleted', (event) => {
  console.log(`MCP Operation completed: ${event.operation}`, {
    operation: event.operation,
    success: true,
    timestamp: new Date().toISOString()
  });
});

mcpServer.on('operationFailed', (event) => {
  console.error(`MCP Operation failed: ${event.operation}`, {
    operation: event.operation,
    error: event.error,
    timestamp: new Date().toISOString()
  });
});

app.http('mcpEbayAgent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { operation, params } = await request.json();

      if (!operation) {
        return {
          status: 400,
          jsonBody: {
            error: 'Operation name is required',
            availableOperations: Array.from(mcpServer.operations.keys())
          }
        };
      }

      // Execute the MCP operation
      const result = await mcpServer.executeOperation(operation, params);

      return {
        status: 200,
        jsonBody: {
          success: true,
          operation,
          result,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('MCP eBay Agent Error:', error);
      
      const errorResponse = errorHandler.handleError(error, 'MCP_EBAY_AGENT');
      
      return {
        status: errorResponse.status || 500,
        jsonBody: {
          success: false,
          error: errorResponse.message,
          operation: request.body?.operation || 'unknown',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});

// Health check endpoint for MCP server
app.http('mcpEbayAgentHealth', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mcp/health',
  handler: async (request, context) => {
    try {
      return {
        status: 200,
        jsonBody: {
          status: 'healthy',
          server: 'eBay MCP Server',
          availableOperations: Array.from(mcpServer.operations.keys()).length,
          operations: Array.from(mcpServer.operations.keys()),
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

// List all available operations
app.http('mcpEbayAgentOperations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mcp/operations',
  handler: async (request, context) => {
    try {
      const operations = Array.from(mcpServer.operations.keys());
      
      // Group operations by category
      const categorizedOperations = {
        listingManagement: operations.filter(op => 
          ['createListingDraft', 'updateListingDraft', 'publishListing', 'endListing', 
           'reviseListing', 'getListingDetails', 'getActiveListings', 'getDraftListings', 
           'getEndedListings', 'bulkCreateListings', 'bulkUpdateListings', 'bulkEndListings'].includes(op)
        ),
        inventoryManagement: operations.filter(op => 
          ['createInventoryItem', 'updateInventoryItem', 'getInventoryItem', 
           'deleteInventoryItem', 'bulkCreateInventory', 'getInventoryItems'].includes(op)
        ),
        orderManagement: operations.filter(op => 
          ['getOrders', 'getOrderDetails', 'fulfillOrder', 'shipOrder', 
           'cancelOrder', 'processReturn'].includes(op)
        ),
        accountManagement: operations.filter(op => 
          ['getSellerAccount', 'updateSellerAccount', 'getSellerPolicies', 
           'createSellerPolicy', 'updateSellerPolicy', 'getSellerMetrics'].includes(op)
        ),
        productResearch: operations.filter(op => 
          ['searchProducts', 'getProductDetails', 'getCategoryTree', 
           'suggestCategories', 'getMarketInsights', 'analyzePricing'].includes(op)
        )
      };

      return {
        status: 200,
        jsonBody: {
          totalOperations: operations.length,
          categories: categorizedOperations,
          allOperations: operations,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 500,
        jsonBody: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});