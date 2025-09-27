/**
 * Test script for MCP eBay Server functionality
 * Run with: node test-mcp-server.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.AZURE_FUNCTION_URL || 'http://localhost:7071';
const MCP_ENDPOINT = `${BASE_URL}/api/mcpEbayAgent`;
const HEALTH_ENDPOINT = `${BASE_URL}/api/mcp/health`;
const OPERATIONS_ENDPOINT = `${BASE_URL}/api/mcp/operations`;

/**
 * Test MCP Server Health Check
 */
async function testHealthCheck() {
  console.log('\n🔍 Testing MCP Server Health Check...');
  
  try {
    const response = await axios.get(HEALTH_ENDPOINT);
    console.log('✅ Health Check Status:', response.data.status);
    console.log('📊 Available Operations:', response.data.availableOperations);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

/**
 * Test MCP Operations List
 */
async function testOperationsList() {
  console.log('\n📋 Testing MCP Operations List...');
  
  try {
    const response = await axios.get(OPERATIONS_ENDPOINT);
    console.log('✅ Total Operations:', response.data.totalOperations);
    console.log('📂 Categories:', Object.keys(response.data.categories));
    
    // Display operations by category
    for (const [category, operations] of Object.entries(response.data.categories)) {
      console.log(`  ${category}: ${operations.length} operations`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Operations List Failed:', error.message);
    return false;
  }
}

/**
 * Test Create Listing Draft Operation
 */
async function testCreateListingDraft() {
  console.log('\n📝 Testing Create Listing Draft...');
  
  const testProductAnalysis = {
    seoTitle: 'Vintage 1990s Nike Air Jordan Sneakers Size 10',
    brand: 'Nike',
    productType: 'Sneakers',
    size: '10',
    color: { primary: 'Black', secondary: 'Red' },
    condition: 'USED_EXCELLENT',
    keyFeatures: 'Classic Air Jordan design with original box',
    estimatedYear: 1995,
    countryOfManufacture: 'USA',
    material: 'Leather',
    fabricType: 'Synthetic',
    theme: 'Athletic',
    suggestedPrice: 299.99,
    confidence: 0.95,
    categoryId: '15709',
    categoryName: 'Athletic Shoes',
    imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  };

  const requestData = {
    operation: 'createListingDraft',
    params: {
      productAnalysis: testProductAnalysis,
      sku: `TEST-${Date.now()}`,
      price: 299.99,
      quantity: 1
    }
  };

  try {
    const response = await axios.post(MCP_ENDPOINT, requestData);
    console.log('✅ Listing Draft Created:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('❌ Create Listing Draft Failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test Get Active Listings Operation
 */
async function testGetActiveListings() {
  console.log('\n📊 Testing Get Active Listings...');
  
  const requestData = {
    operation: 'getActiveListings',
    params: {
      limit: 10,
      offset: 0
    }
  };

  try {
    const response = await axios.post(MCP_ENDPOINT, requestData);
    console.log('✅ Active Listings Retrieved:', response.data.result.total, 'listings');
    return response.data.result;
  } catch (error) {
    console.error('❌ Get Active Listings Failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test Market Insights Operation
 */
async function testMarketInsights() {
  console.log('\n📈 Testing Market Insights...');
  
  const requestData = {
    operation: 'getMarketInsights',
    params: {
      query: 'vintage nike sneakers',
      categoryId: '15709'
    }
  };

  try {
    const response = await axios.post(MCP_ENDPOINT, requestData);
    console.log('✅ Market Insights Retrieved:');
    console.log('  Sold Count:', response.data.result.insights.soldCount);
    console.log('  Active Count:', response.data.result.insights.activeCount);
    console.log('  Average Sold Price:', response.data.result.insights.avgSoldPrice);
    console.log('  STR (Sell Through Rate):', response.data.result.insights.str.toFixed(2) + '%');
    return response.data.result;
  } catch (error) {
    console.error('❌ Market Insights Failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test Pricing Analysis Operation
 */
async function testPricingAnalysis() {
  console.log('\n💰 Testing Pricing Analysis...');
  
  const requestData = {
    operation: 'analyzePricing',
    params: {
      query: 'vintage nike air jordan',
      categoryId: '15709',
      condition: 'USED_EXCELLENT'
    }
  };

  try {
    const response = await axios.post(MCP_ENDPOINT, requestData);
    console.log('✅ Pricing Analysis Complete:');
    console.log('  Recommended Price:', '$' + response.data.result.analysis.recommendedPrice);
    console.log('  Competitive Range:', 
      '$' + response.data.result.analysis.competitiveRange.low.toFixed(2) + 
      ' - $' + response.data.result.analysis.competitiveRange.high.toFixed(2));
    console.log('  Confidence:', response.data.result.analysis.confidence);
    return response.data.result;
  } catch (error) {
    console.error('❌ Pricing Analysis Failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test Category Suggestions Operation
 */
async function testCategorySuggestions() {
  console.log('\n🏷️ Testing Category Suggestions...');
  
  const requestData = {
    operation: 'suggestCategories',
    params: {
      query: 'vintage leather jacket'
    }
  };

  try {
    const response = await axios.post(MCP_ENDPOINT, requestData);
    console.log('✅ Category Suggestions Retrieved:', response.data.result.suggestions.length, 'suggestions');
    if (response.data.result.suggestions.length > 0) {
      console.log('  Top Suggestion:', response.data.result.suggestions[0]);
    }
    return response.data.result;
  } catch (error) {
    console.error('❌ Category Suggestions Failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test Invalid Operation Handling
 */
async function testInvalidOperation() {
  console.log('\n❌ Testing Invalid Operation Handling...');
  
  const requestData = {
    operation: 'nonExistentOperation',
    params: {}
  };

  try {
    const response = await axios.post(MCP_ENDPOINT, requestData);
    console.log('❌ Should have failed but got:', response.data);
    return false;
  } catch (error) {
    if (error.response?.status === 500 && error.response?.data?.error?.includes('Unknown operation')) {
      console.log('✅ Invalid Operation Properly Rejected');
      return true;
    } else {
      console.error('❌ Unexpected Error:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * Run all MCP Server tests
 */
async function runAllTests() {
  console.log('🚀 Starting MCP eBay Server Tests...');
  console.log('Base URL:', BASE_URL);
  
  const results = {
    healthCheck: false,
    operationsList: false,
    createListingDraft: false,
    getActiveListings: false,
    marketInsights: false,
    pricingAnalysis: false,
    categorySuggestions: false,
    invalidOperation: false
  };

  // Run tests sequentially
  results.healthCheck = await testHealthCheck();
  results.operationsList = await testOperationsList();
  
  // Only run API tests if health check passes
  if (results.healthCheck) {
    results.createListingDraft = await testCreateListingDraft();
    results.getActiveListings = await testGetActiveListings();
    results.marketInsights = await testMarketInsights();
    results.pricingAnalysis = await testPricingAnalysis();
    results.categorySuggestions = await testCategorySuggestions();
    results.invalidOperation = await testInvalidOperation();
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  for (const [test, result] of Object.entries(results)) {
    console.log(`${result ? '✅' : '❌'} ${test}`);
  }
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All MCP Server tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }

  return results;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };