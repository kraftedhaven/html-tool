/**
 * Database Service for SaaS Platform
 * Handles data persistence for users, subscriptions, and usage tracking
 */

import { CosmosClient } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { UserModel, SubscriptionModel, UsageTrackingModel } from '../models/subscriptionModels.js';

class DatabaseService {
  constructor() {
    // Use environment variables for Cosmos DB connection
    this.client = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT || 'https://localhost:8081',
      key: process.env.COSMOS_DB_KEY || 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=='
    });
    
    this.databaseId = 'HiddenHavenThreadsDB';
    this.containersConfig = {
      users: { id: 'users', partitionKey: '/id' },
      subscriptions: { id: 'subscriptions', partitionKey: '/userId' },
      usageTracking: { id: 'usageTracking', partitionKey: '/userId' }
    };
    
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: this.databaseId
      });
      this.database = database;

      // Create containers if they don't exist
      for (const [name, config] of Object.entries(this.containersConfig)) {
        await this.database.containers.createIfNotExists({
          id: config.id,
          partitionKey: config.partitionKey
        });
      }

      this.initialized = true;
      console.log('Database service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // User Management
  async createUser(userData, context) {
    await this.initialize();
    
    const user = new UserModel({
      id: uuidv4(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    try {
      const { resource } = await this.database
        .container('users')
        .items
        .create(user);
      
      context.log.info('User created successfully');
      return new UserModel(resource);
    } catch (error) {
      context.log.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(userId, context) {
    await this.initialize();
    
    try {
      const { resource } = await this.database
        .container('users')
        .item(userId, userId)
        .read();
      
      return resource ? new UserModel(resource) : null;
    } catch (error) {
      if (error.code === 404) return null;
      context.log.error('Error fetching user:', error);
      throw error;
    }
  }

  async getUserByEmail(email, context) {
    await this.initialize();
    
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.email = @email',
        parameters: [{ name: '@email', value: email }]
      };

      const { resources } = await this.database
        .container('users')
        .items
        .query(querySpec)
        .fetchAll();

      return resources.length > 0 ? new UserModel(resources[0]) : null;
    } catch (error) {
      context.log.error('Error fetching user by email:', error);
      throw error;
    }
  }

  async updateUser(userId, updates, context) {
    await this.initialize();
    
    try {
      const user = await this.getUserById(userId, context);
      if (!user) throw new Error('User not found');

      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      
      const { resource } = await this.database
        .container('users')
        .item(userId, userId)
        .replace(updatedUser);

      context.log.info('User updated successfully');
      return new UserModel(resource);
    } catch (error) {
      context.log.error('Error updating user:', error);
      throw error;
    }
  }

  // Subscription Management
  async createSubscription(subscriptionData, context) {
    await this.initialize();
    
    const subscription = new SubscriptionModel({
      id: uuidv4(),
      ...subscriptionData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    try {
      const { resource } = await this.database
        .container('subscriptions')
        .items
        .create(subscription);
      
      context.log.info('Subscription created successfully');
      return new SubscriptionModel(resource);
    } catch (error) {
      context.log.error('Error creating subscription:', error);
      throw error;
    }
  }

  async getSubscriptionById(subscriptionId, context) {
    await this.initialize();
    
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: subscriptionId }]
      };

      const { resources } = await this.database
        .container('subscriptions')
        .items
        .query(querySpec)
        .fetchAll();

      return resources.length > 0 ? new SubscriptionModel(resources[0]) : null;
    } catch (error) {
      context.log.error('Error fetching subscription:', error);
      throw error;
    }
  }

  async getSubscriptionByUserId(userId, context) {
    await this.initialize();
    
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: userId }]
      };

      const { resources } = await this.database
        .container('subscriptions')
        .items
        .query(querySpec)
        .fetchAll();

      return resources.length > 0 ? new SubscriptionModel(resources[0]) : null;
    } catch (error) {
      context.log.error('Error fetching subscription by user:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId, updates, context) {
    await this.initialize();
    
    try {
      const subscription = await this.getSubscriptionById(subscriptionId, context);
      if (!subscription) throw new Error('Subscription not found');

      const updatedSubscription = { 
        ...subscription, 
        ...updates, 
        updatedAt: new Date() 
      };
      
      const { resource } = await this.database
        .container('subscriptions')
        .item(subscriptionId, subscription.userId)
        .replace(updatedSubscription);

      context.log.info('Subscription updated successfully');
      return new SubscriptionModel(resource);
    } catch (error) {
      context.log.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Usage Tracking
  async createUsageRecord(usageData, context) {
    await this.initialize();
    
    const usage = new UsageTrackingModel({
      id: uuidv4(),
      ...usageData,
      createdAt: new Date()
    });

    try {
      const { resource } = await this.database
        .container('usageTracking')
        .items
        .create(usage);
      
      context.log.info('Usage record created successfully');
      return new UsageTrackingModel(resource);
    } catch (error) {
      context.log.error('Error creating usage record:', error);
      throw error;
    }
  }

  async getCurrentUsage(userId, periodStart, periodEnd, context) {
    await this.initialize();
    
    try {
      const querySpec = {
        query: `
          SELECT * FROM c 
          WHERE c.userId = @userId 
          AND c.periodStart >= @periodStart 
          AND c.periodEnd <= @periodEnd
          ORDER BY c.createdAt DESC
        `,
        parameters: [
          { name: '@userId', value: userId },
          { name: '@periodStart', value: periodStart.toISOString() },
          { name: '@periodEnd', value: periodEnd.toISOString() }
        ]
      };

      const { resources } = await this.database
        .container('usageTracking')
        .items
        .query(querySpec)
        .fetchAll();

      return resources.length > 0 ? new UsageTrackingModel(resources[0]) : null;
    } catch (error) {
      context.log.error('Error fetching current usage:', error);
      throw error;
    }
  }

  async updateUsage(userId, usageType, amount = 1, context) {
    await this.initialize();
    
    try {
      // Get current billing period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get or create current usage record
      let usage = await this.getCurrentUsage(userId, periodStart, periodEnd, context);
      
      if (!usage) {
        const subscription = await this.getSubscriptionByUserId(userId, context);
        usage = await this.createUsageRecord({
          userId,
          subscriptionId: subscription?.id,
          periodStart,
          periodEnd,
          listingsCreated: 0,
          aiAnalysesUsed: 0,
          apiCallsMade: 0
        }, context);
      }

      // Update usage
      usage.incrementUsage(usageType, amount);

      // Save updated usage
      const { resource } = await this.database
        .container('usageTracking')
        .item(usage.id, userId)
        .replace(usage);

      context.log.info('Usage updated successfully');
      return new UsageTrackingModel(resource);
    } catch (error) {
      context.log.error('Error updating usage:', error);
      throw error;
    }
  }

  // Admin functions
  async getAllUsers(limit = 50, offset = 0, context) {
    await this.initialize();
    
    try {
      const querySpec = {
        query: 'SELECT * FROM c ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit',
        parameters: [
          { name: '@offset', value: offset },
          { name: '@limit', value: limit }
        ]
      };

      const { resources } = await this.database
        .container('users')
        .items
        .query(querySpec)
        .fetchAll();

      return resources.map(user => new UserModel(user));
    } catch (error) {
      context.log.error('Error fetching all users:', error);
      throw error;
    }
  }

  async getAllSubscriptions(limit = 50, offset = 0, context) {
    await this.initialize();
    
    try {
      const querySpec = {
        query: 'SELECT * FROM c ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit',
        parameters: [
          { name: '@offset', value: offset },
          { name: '@limit', value: limit }
        ]
      };

      const { resources } = await this.database
        .container('subscriptions')
        .items
        .query(querySpec)
        .fetchAll();

      return resources.map(sub => new SubscriptionModel(sub));
    } catch (error) {
      context.log.error('Error fetching all subscriptions:', error);
      throw error;
    }
  }

  async getSubscriptionStats(context) {
    await this.initialize();
    
    try {
      const querySpec = {
        query: `
          SELECT 
            c.plan,
            c.status,
            COUNT(1) as count
          FROM c 
          GROUP BY c.plan, c.status
        `
      };

      const { resources } = await this.database
        .container('subscriptions')
        .items
        .query(querySpec)
        .fetchAll();

      return resources;
    } catch (error) {
      context.log.error('Error fetching subscription stats:', error);
      throw error;
    }
  }

  // Enhanced usage tracking with detailed metrics
  async trackDetailedUsage(userId, usageData, context) {
    await this.initialize();
    
    try {
      // Create detailed usage container if it doesn't exist
      await this.database.containers.createIfNotExists({
        id: 'detailedUsage',
        partitionKey: '/userId'
      });

      const detailedUsage = {
        id: uuidv4(),
        userId,
        type: usageData.type,
        metadata: usageData.metadata || {},
        timestamp: usageData.timestamp || new Date(),
        subscriptionPlan: usageData.subscriptionPlan,
        createdAt: new Date()
      };

      const { resource } = await this.database
        .container('detailedUsage')
        .items
        .create(detailedUsage);
      
      context.log.info('Detailed usage tracked successfully');
      return resource;
    } catch (error) {
      context.log.error('Error tracking detailed usage:', error);
      throw error;
    }
  }

  // Get detailed usage analytics
  async getDetailedUsageAnalytics(userId, startDate, endDate, context) {
    await this.initialize();
    
    try {
      const querySpec = {
        query: `
          SELECT 
            c.type,
            c.subscriptionPlan,
            COUNT(1) as count,
            c.metadata
          FROM c 
          WHERE c.userId = @userId 
          AND c.timestamp >= @startDate 
          AND c.timestamp <= @endDate
          GROUP BY c.type, c.subscriptionPlan, c.metadata
          ORDER BY c.timestamp DESC
        `,
        parameters: [
          { name: '@userId', value: userId },
          { name: '@startDate', value: startDate.toISOString() },
          { name: '@endDate', value: endDate.toISOString() }
        ]
      };

      const { resources } = await this.database
        .container('detailedUsage')
        .items
        .query(querySpec)
        .fetchAll();

      return resources;
    } catch (error) {
      context.log.error('Error fetching detailed usage analytics:', error);
      throw error;
    }
  }

  // Get system-wide usage metrics for admin
  async getSystemUsageMetrics(days = 30, context) {
    await this.initialize();
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const querySpec = {
        query: `
          SELECT 
            c.type,
            c.subscriptionPlan,
            COUNT(1) as totalUsage,
            COUNT(DISTINCT c.userId) as uniqueUsers
          FROM c 
          WHERE c.timestamp >= @startDate
          GROUP BY c.type, c.subscriptionPlan
          ORDER BY totalUsage DESC
        `,
        parameters: [
          { name: '@startDate', value: startDate.toISOString() }
        ]
      };

      const { resources } = await this.database
        .container('detailedUsage')
        .items
        .query(querySpec)
        .fetchAll();

      return resources;
    } catch (error) {
      context.log.error('Error fetching system usage metrics:', error);
      throw error;
    }
  }

  // Featured Items
  async createFeaturedItem(listingData, context) {
    await this.initialize();
    
    const featuredItem = {
      id: uuidv4(),
      ...listingData,
      createdAt: new Date()
    };

    try {
      const { resource } = await this.database
        .container('featuredItems')
        .items
        .create(featuredItem);
      
      context.log.info('Featured item created successfully');
      return resource;
    } catch (error) {
      context.log.error('Error creating featured item:', error);
      throw error;
    }
  }

  async getFeaturedItems(limit = 10, context) {
    await this.initialize();
    
    try {
      const querySpec = {
        query: 'SELECT * FROM c ORDER BY c.createdAt DESC OFFSET 0 LIMIT @limit',
        parameters: [
          { name: '@limit', value: limit }
        ]
      };

      const { resources } = await this.database
        .container('featuredItems')
        .items
        .query(querySpec)
        .fetchAll();

      return resources;
    } catch (error) {
      context.log.error('Error fetching featured items:', error);
      throw error;
    }
  }
  // ... (existing code)

  // Analytics
  async getMarketplacePerformance() {
    await this.initialize();
    // Mock data for now
    return {
      ebay: { revenue: 1200, listings: 50, conversion: 0.05 },
      facebook: { revenue: 800, listings: 30, conversion: 0.03 },
      etsy: { revenue: 1500, listings: 70, conversion: 0.07 },
    };
  }

  async getRevenue() {
    await this.initialize();
    // Mock data for now
    return {
      totalRevenue: 3500,
      profitMargin: 0.6,
    };
  }

  async getListingPerformance() {
    await this.initialize();
    // Mock data for now
    return {
      views: 10000,
      watchers: 500,
      conversionRates: 0.05,
    };
  }

  async getCompetitiveIntelligence() {
    await this.initialize();
    // Mock data for now
    return {
      competitorPrices: ['$10.00', '$12.50', '$15.00'],
      pricingRecommendations: ['$11.00', '$13.50', '$16.00'],
      marketTrends: ['trend1', 'trend2', 'trend3'],
    };
  }

  async getSeoAndContentOptimization() {
    await this.initialize();
    // Mock data for now
    return {
      keywordRankings: {
        'keyword1': 1,
        'keyword2': 3,
        'keyword3': 5,
      },
      contentOptimizationSuggestions: [
        'suggestion1',
        'suggestion2',
        'suggestion3',
      ],
    };
  }

  async getAffiliateData() {
    await this.initialize();
    // Mock data for now
    return {
      earnings: 500,
      statistics: {
        referrals: 10,
        conversionRate: 0.2,
      },
    };
  }
}

export default DatabaseService;