# eBay API Integration Guide for Neural Listing Engine

## Core Integration Architecture

### 1. Required eBay APIs

**Inventory API (Primary)**
- `POST /sell/inventory/v1/inventory_item` - Create inventory items
- `POST /sell/inventory/v1/offer` - Create offers/listings
- `POST /sell/inventory/v1/bulk_create_or_replace_inventory_item` - Bulk upload

**Taxonomy API**
- `GET /commerce/taxonomy/v1/category_tree/{category_tree_id}` - Get categories
- `GET /commerce/taxonomy/v1/category_tree/{category_tree_id}/get_category_suggestions` - AI category suggestions

**Media API**
- `POST /sell/media/v1/video` - Upload product images
- `GET /sell/media/v1/video/{video_id}` - Get upload status

### 2. Backend API Structure

```javascript
// server.js - Main server setup
const express = require('express');
const multer = require('multer');
const { OpenAI } = require('openai');
const axios = require('axios');

const app = express();
const upload = multer({ dest: 'uploads/' });

// eBay API configuration
const EBAY_CONFIG = {
  sandbox: 'https://api.sandbox.ebay.com',
  production: 'https://api.ebay.com',
  clientId: process.env.EBAY_CLIENT_ID,
  clientSecret: process.env.EBAY_CLIENT_SECRET,
  accessToken: process.env.EBAY_ACCESS_TOKEN
};

// OpenAI configuration for image analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

### 3. Image Analysis Pipeline

```javascript
// /api/analyze-images endpoint
app.post('/api/analyze-images', upload.array('images'), async (req, res) => {
  try {
    const analysisResults = [];
    
    for (const file of req.files) {
      // Step 1: Analyze image with OpenAI Vision
      const imageAnalysis = await analyzeProductImage(file.path);
      
      // Step 2: Get eBay category suggestions
      const categoryData = await getEBayCategories(imageAnalysis.productType);
      
      // Step 3: Validate and enhance data
      const enhancedData = await enhanceProductData(imageAnalysis, categoryData);
      
      analysisResults.push(enhancedData);
    }
    
    res.json({ success: true, data: analysisResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function analyzeProductImage(imagePath) {
  const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this product image for eBay listing. Extract:
            - Product title (be specific and detailed)
            - Brand name
            - Product type/category
            - Size/dimensions (if visible)
            - Color (primary and secondary)
            - Condition assessment
            - Key features and materials
            - Estimated year/era (if vintage)
            - Country of manufacture (if identifiable)
            - Any text/labels visible
            
            Format as JSON with confidence scores for each field.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### 4. eBay Category Integration

```javascript
async function getEBayCategories(productType) {
  const response = await axios.get(
    `${EBAY_CONFIG.production}/commerce/taxonomy/v1/category_tree/0/get_category_suggestions`,
    {
      headers: {
        'Authorization': `Bearer ${EBAY_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: productType
      }
    }
  );
  
  return response.data.categorySuggestions[0]; // Best match
}

// Enhanced product data with eBay-specific formatting
async function enhanceProductData(aiAnalysis, categoryData) {
  return {
    // Core listing data
    title: aiAnalysis.title.substring(0, 80), // eBay title limit
    description: generateEBayDescription(aiAnalysis),
    category: categoryData.category.categoryId,
    categoryName: categoryData.category.categoryName,
    
    // Product specifics
    brand: aiAnalysis.brand,
    color: aiAnalysis.color,
    size: aiAnalysis.size,
    condition: mapConditionToEBay(aiAnalysis.condition),
    
    // Pricing and shipping
    price: estimatePrice(aiAnalysis),
    currency: 'USD',
    shippingCost: calculateShipping(aiAnalysis),
    
    // Metadata
    confidence: aiAnalysis.confidence,
    isVintage: aiAnalysis.estimatedYear < 2000,
    countryOfManufacture: aiAnalysis.countryOfManufacture || 'Unknown',
    
    // eBay specific
    listingDuration: 'Days_7',
    listingType: 'FixedPriceItem',
    paymentMethods: ['PayPal', 'VisaMC', 'AmEx']
  };
}
```

### 5. Bulk Upload to eBay

```javascript
// /api/bulk-upload-ebay endpoint
app.post('/api/bulk-upload-ebay', async (req, res) => {
  const { listings } = req.body;
  
  try {
    // Step 1: Create inventory items in bulk
    const inventoryItems = await createBulkInventoryItems(listings);
    
    // Step 2: Create offers/listings
    const offers = await createBulkOffers(inventoryItems);
    
    // Step 3: Publish to marketplace
    const published = await publishBulkListings(offers);
    
    res.json({
      success: true,
      uploaded: published.length,
      errors: published.filter(p => p.error),
      listings: published
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function createBulkInventoryItems(listings) {
  const inventoryRequests = listings.map(listing => ({
    sku: `RESELLER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    product: {
      title: listing.title,
      description: listing.description,
      aspects: {
        Brand: [listing.brand],
        Color: [listing.color],
        Size: [listing.size],
        Condition: [listing.condition]
      },
      imageUrls: listing.imageUrls
    },
    condition: listing.condition,
    packageWeightAndSize: {
      dimensions: {
        height: listing.dimensions?.height || 5,
        length: listing.dimensions?.length || 10,
        width: listing.dimensions?.width || 8,
        unit: 'INCH'
      },
      weight: {
        value: listing.weight || 1,
        unit: 'POUND'
      }
    }
  }));

  const response = await axios.post(
    `${EBAY_CONFIG.production}/sell/inventory/v1/bulk_create_or_replace_inventory_item`,
    { requests: inventoryRequests },
    {
      headers: {
        'Authorization': `Bearer ${EBAY_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.responses;
}
```

### 6. Frontend Integration Updates

```javascript
// Add to your Neural Listing Engine class
async uploadToEBay() {
  try {
    this.analyzeBtn.disabled = true;
    this.analyzeBtn.textContent = 'Uploading to eBay...';
    
    const response = await fetch('/api/bulk-upload-ebay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        listings: this.processedData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      this.showUploadResults(result);
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    this.showError('eBay upload failed: ' + error.message);
  } finally {
    this.analyzeBtn.disabled = false;
    this.analyzeBtn.textContent = 'Execute Analysis';
  }
}

showUploadResults(result) {
  const resultHTML = `
    <div class="upload-results">
      <h3>eBay Upload Complete</h3>
      <p>Successfully uploaded: ${result.uploaded} listings</p>
      <p>Errors: ${result.errors.length}</p>
      
      ${result.listings.map(listing => `
        <div class="listing-result">
          <strong>${listing.sku}</strong>
          ${listing.error ? 
            `<span class="error">Error: ${listing.error}</span>` : 
            `<span class="success">✓ Listed</span>`
          }
        </div>
      `).join('')}
    </div>
  `;
  
  this.dataDisplay.innerHTML = resultHTML;
}
```

## Required Environment Variables

```bash
# .env file
EBAY_CLIENT_ID=your_ebay_app_id
EBAY_CLIENT_SECRET=your_ebay_cert_id
EBAY_ACCESS_TOKEN=your_user_access_token
OPENAI_API_KEY=your_openai_key

# Database (optional but recommended)
DATABASE_URL=postgresql://user:pass@localhost:5432/reseller_db
```

## Implementation Priority

### Phase 1 (MVP - 2 weeks)
1. Image upload and OpenAI analysis
2. Basic eBay category mapping
3. CSV export functionality
4. Single listing upload to eBay

### Phase 2 (Enhanced - 4 weeks)
1. Bulk upload optimization
2. Error handling and retry logic
3. Image hosting integration
4. Price estimation algorithms

### Phase 3 (Advanced - 6 weeks)
1. Machine learning for accuracy improvement
2. Competitor pricing analysis
3. Automated relisting
4. Multi-marketplace support (Mercari, Poshmark)

## Key eBay API Considerations

**Rate Limits:**
- Sandbox: 5,000 calls/day
- Production: Varies by API (typically 5,000-50,000/day)

**Image Requirements:**
- JPG, PNG, GIF formats
- Minimum 500x500 pixels
- Maximum 12 images per listing
- Must be hosted (use eBay Media API or external CDN)

**Category Specifics:**
- Electronics require UPC/EAN codes
- Clothing needs size charts
- Vintage items (20+ years) have special requirements

This architecture gives you a production-ready foundation that can scale from processing 10 items to 1000+ items per day.