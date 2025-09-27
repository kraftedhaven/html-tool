# eBay MCP Server Implementation Guide

## Overview

The eBay MCP (Model Context Protocol) Server provides a comprehensive set of 36 eBay seller account management operations integrated with the existing Neural Listing Engine. This implementation enables AI agents to perform sophisticated eBay operations while leveraging the existing image analysis and product research capabilities.

## Architecture

The MCP Server is built as an EventEmitter-based class that integrates with:
- **Existing Neural Listing Engine**: Image analysis and product categorization
- **eBay APIs**: All seller account management operations
- **Azure Key Vault**: Secure credential management
- **Token Manager**: Automated eBay token refresh

## Available Operations (36 Total)

### Listing Management Operations (1-12)
1. `createListingDraft` - Create listing drafts with AI-generated content
2. `updateListingDraft` - Update existing listing drafts
3. `publishListing` - Publish drafts to active listings
4. `endListing` - End active listings
5. `reviseListing` - Revise active listings
6. `getListingDetails` - Get detailed listing information
7. `getActiveListings` - Retrieve all active listings
8. `getDraftListings` - Retrieve all draft listings
9. `getEndedListings` - Retrieve all ended listings
10. `bulkCreateListings` - Create multiple listings simultaneously
11. `bulkUpdateListings` - Update multiple listings simultaneously
12. `bulkEndListings` - End multiple listings simultaneously

### Inventory Management Operations (13-18)
13. `createInventoryItem` - Create inventory items
14. `updateInventoryItem` - Update inventory items
15. `getInventoryItem` - Get inventory item details
16. `deleteInventoryItem` - Delete inventory items
17. `bulkCreateInventory` - Create multiple inventory items
18. `getInventoryItems` - Retrieve all inventory items

### Order Management Operations (19-24)
19. `getOrders` - Retrieve seller orders
20. `getOrderDetails` - Get detailed order information
21. `fulfillOrder` - Fulfill orders with shipping info
22. `shipOrder` - Ship orders (alias for fulfillOrder)
23. `cancelOrder` - Cancel orders and issue refunds
24. `processReturn` - Process return requests

### Account Management Operations (25-30)
25. `getSellerAccount` - Get seller account information
26. `updateSellerAccount` - Update seller account settings
27. `getSellerPolicies` - Retrieve seller policies
28. `createSellerPolicy` - Create new seller policies
29. `updateSellerPolicy` - Update existing policies
30. `getSellerMetrics` - Get seller performance metrics

### Product Research Operations (31-36)
31. `searchProducts` - Search eBay products
32. `getProductDetails` - Get detailed product information
33. `getCategoryTree` - Get eBay category tree
34. `suggestCategories` - Get category suggestions
35. `getMarketInsights` - Get market insights and pricing data
36. `analyzePricing` - Analyze optimal pricing strategies

## Neural Listing Engine Integration

### Enhanced Operations
- `analyzeImagesWithNeuralEngine` - Integrate with existing image analysis
- `createListingWithNeuralAnalysis` - Complete listing creation with AI analysis

### Integration Flow
1. **Image Analysis**: Uses existing Neural Listing Engine for AI-powered product analysis
2. **Category Mapping**: Leverages existing eBay category suggestions
3. **Content Generation**: Uses AI-generated SEO titles and descriptions
4. **Listing Creation**: Creates eBay listings with optimized content

## API Endpoints

### Main MCP Operations
```
POST /api/mcpEbayAgent
{
  "operation": "createListingDraft",
  "params": {
    "productAnalysis": { ... },
    "sku": "ITEM-123",
    "price": 29.99,
    "quantity": 1
  }
}
```

### Neural Listing Integration
```
POST /api/mcp/neural-listing
{
  "imageUrls": ["https://example.com/image1.jpg"],
  "additionalData": {
    "price": 29.99,
    "quantity": 1
  }
}
```

### Health Check
```
GET /api/mcp/health
```

### Operations List
```
GET /api/mcp/operations
```

## Usage Examples

### Create Listing with AI Analysis
```javascript
// Analyze images and create listing
const result = await mcpServer.createListingWithNeuralAnalysis(
  ['https://example.com/vintage-jacket.jpg'],
  { price: 45.99, quantity: 1 }
);
```

### Bulk Operations
```javascript
// Bulk create listings
const result = await mcpServer.executeOperation('bulkCreateListings', {
  listings: [
    { sku: 'ITEM-1', productAnalysis: {...}, price: 29.99 },
    { sku: 'ITEM-2', productAnalysis: {...}, price: 39.99 }
  ]
});
```

### Market Research
```javascript
// Get market insights
const insights = await mcpServer.executeOperation('getMarketInsights', {
  query: 'vintage leather jacket',
  categoryId: '57988'
});
```

## Error Handling

The MCP Server includes comprehensive error handling:
- **Rate Limiting**: Automatic retry with exponential backoff
- **Token Refresh**: Automatic eBay token renewal
- **Validation**: Input parameter validation
- **Logging**: Detailed error logging and monitoring

## Event System

The MCP Server emits events for monitoring:
```javascript
mcpServer.on('operationCompleted', (event) => {
  console.log(`Operation ${event.operation} completed successfully`);
});

mcpServer.on('operationFailed', (event) => {
  console.error(`Operation ${event.operation} failed: ${event.error}`);
});
```

## Security

- **Azure Key Vault**: All API keys and secrets stored securely
- **Token Management**: Automatic token refresh and validation
- **Input Validation**: All parameters validated before processing
- **Rate Limiting**: Respects eBay API rate limits

## Deployment

The MCP Server is deployed as part of the Azure Functions app and integrates seamlessly with the existing Neural Listing Engine infrastructure.
