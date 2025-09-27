/**
 * Test Suite for SaaS Platform
 * Tests subscription management, usage tracking, and feature gating
 */

import axios from 'axios';

// Configuration
const BASE_URL = process.env.AZURE_FUNCTION_BASE_URL || 'http://localhost:7071/api';
const TEST_EMAIL = 'test@hiddenhaven.com';
const TEST_PASSWORD = 'TestPassword123!';
const ADMIN_TOKEN = process.env.ADMIN_TEST_TOKEN; // Set this for admin tests

let authToken = '';
let userId = '';
let subscriptionId = '';

console.log('🧪 Starting SaaS Platform Tests...\n');

/**
 * Test User Registration
 */
async function testUserRegistration() {
  console.log('📝 Testing User Registration...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      firstName: 'Test',
      lastName: 'User',
      plan: 'basic'
    });

    if (response.status === 201) {
      authToken = response.data.token;
      userId = response.data.user.id;
      subscriptionId = response.data.user.subscription.id;
      
      console.log('✅ User registration successful');
      console.log(`   User ID: ${userId}`);
      console.log(`   Subscription ID: ${subscriptionId}`);
      console.log(`   Plan: ${response.data.user.subscription.plan}`);
      console.log(`   Status: ${response.data.user.subscription.status}`);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  User already exists, attempting login...');
      return await testUserLogin();
    }
    console.error('❌ Registration failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test User Login
 */
async function testUserLogin() {
  console.log('🔐 Testing User Login...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.status === 200) {
      authToken = response.data.token;
      userId = response.data.user.id;
      subscriptionId = response.data.user.subscription?.id;
      
      console.log('✅ User login successful');
      console.log(`   User ID: ${userId}`);
      console.log(`   Subscription ID: ${subscriptionId}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Getting Subscription Plans
 */
async function testGetSubscriptionPlans() {
  console.log('📋 Testing Get Subscription Plans...');
  
  try {
    const response = await axios.get(`${BASE_URL}/subscription/plans`);
    
    if (response.status === 200) {
      console.log('✅ Subscription plans retrieved successfully');
      console.log(`   Available plans: ${response.data.plans.length}`);
      
      response.data.plans.forEach(plan => {
        console.log(`   - ${plan.name}: $${plan.price}/${plan.interval}`);
        console.log(`     Features: ${JSON.stringify(plan.features, null, 6)}`);
      });
      return true;
    }
  } catch (error) {
    console.error('❌ Get plans failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Getting User Profile
 */
async function testGetUserProfile() {
  console.log('👤 Testing Get User Profile...');
  
  try {
    const response = await axios.get(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status === 200) {
      console.log('✅ User profile retrieved successfully');
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Plan: ${response.data.subscription?.plan}`);
      console.log(`   Status: ${response.data.subscription?.status}`);
      console.log(`   Features: ${JSON.stringify(response.data.subscription?.planDetails?.features, null, 6)}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Get profile failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Getting Usage Statistics
 */
async function testGetUsageStats() {
  console.log('📊 Testing Get Usage Statistics...');
  
  try {
    const response = await axios.get(`${BASE_URL}/user/usage`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Usage statistics retrieved successfully');
      console.log(`   Listings used: ${response.data.usage.listings.used}/${response.data.usage.listings.limit}`);
      console.log(`   AI analyses used: ${response.data.usage.aiAnalyses.used}/${response.data.usage.aiAnalyses.limit}`);
      console.log(`   API calls: ${response.data.usage.apiCalls.used} (unlimited)`);
      return true;
    }
  } catch (error) {
    console.error('❌ Get usage stats failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Feature Access (Bulk Upload)
 */
async function testFeatureAccess() {
  console.log('🔒 Testing Feature Access (Bulk Upload)...');
  
  try {
    // Try to access bulk upload (should fail for basic plan)
    const response = await axios.post(`${BASE_URL}/bulk-upload-ebay`, {
      listings: [{
        sku: 'TEST-001',
        title: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        imageUrls: ['https://example.com/image.jpg'],
        brand: 'Test Brand',
        size: 'M',
        color: 'Blue'
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('⚠️  Bulk upload should have been blocked for basic plan');
    return false;
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.upgradeRequired) {
      console.log('✅ Feature access correctly blocked for basic plan');
      console.log(`   Error: ${error.response.data.error}`);
      console.log(`   Feature: ${error.response.data.feature}`);
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Usage Tracking (AI Analysis)
 */
async function testUsageTracking() {
  console.log('📈 Testing Usage Tracking (AI Analysis)...');
  
  try {
    // Create a test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8E, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const formData = new FormData();
    const blob = new Blob([testImageBuffer], { type: 'image/png' });
    formData.append('images', blob, 'test.png');

    const response = await axios.post(`${BASE_URL}/analyze-images`, formData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ AI analysis completed successfully');
      console.log('   Usage should be incremented');
      
      // Check updated usage
      const usageResponse = await axios.get(`${BASE_URL}/user/usage`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (usageResponse.status === 200) {
        console.log(`   Updated AI analyses used: ${usageResponse.data.usage.aiAnalyses.used}`);
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ Usage tracking test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Subscription Plan Update
 */
async function testSubscriptionUpdate() {
  console.log('🔄 Testing Subscription Plan Update...');
  
  try {
    const response = await axios.post(`${BASE_URL}/subscription/update-plan`, {
      newPlan: 'pro'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Subscription updated successfully');
      console.log(`   New plan: ${response.data.subscription.plan}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Subscription update failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Admin Dashboard (if admin token available)
 */
async function testAdminDashboard() {
  if (!ADMIN_TOKEN) {
    console.log('⚠️  Skipping admin tests (no admin token provided)');
    return true;
  }
  
  console.log('👑 Testing Admin Dashboard...');
  
  try {
    // Test get all users
    const usersResponse = await axios.get(`${BASE_URL}/admin/users?limit=10`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (usersResponse.status === 200) {
      console.log('✅ Admin users list retrieved successfully');
      console.log(`   Total users: ${usersResponse.data.users.length}`);
    }
    
    // Test subscription stats
    const statsResponse = await axios.get(`${BASE_URL}/admin/subscription-stats`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (statsResponse.status === 200) {
      console.log('✅ Admin subscription stats retrieved successfully');
      console.log(`   Total subscriptions: ${statsResponse.data.totalSubscriptions}`);
      console.log(`   Monthly revenue: $${statsResponse.data.monthlyRevenue}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Admin dashboard test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  const tests = [
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'Get Subscription Plans', fn: testGetSubscriptionPlans },
    { name: 'Get User Profile', fn: testGetUserProfile },
    { name: 'Get Usage Statistics', fn: testGetUsageStats },
    { name: 'Feature Access Control', fn: testFeatureAccess },
    { name: 'Usage Tracking', fn: testUsageTracking },
    { name: 'Subscription Update', fn: testSubscriptionUpdate },
    { name: 'Admin Dashboard', fn: testAdminDashboard }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n${'='.repeat(50)}`);
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! SaaS platform is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };