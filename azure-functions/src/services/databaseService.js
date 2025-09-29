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
  async createUser(userData) {
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
      
      return new UserModel(resource);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    await this.initialize();
    
    try {
      const { resource } = await this.database
        .container('users')
        .item(userId, userId)
        .read();
      
      return resource ? new UserModel(resource) : null;
    } catch (error) {
      if (error.code === 404) return null;
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
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
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  async updateUser(userId, updates) {
    await this.initialize();
    
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      
      const { resource } = await this.database
        .container('users')
        .item(userId, userId)
        .replace(updatedUser);

      return new UserModel(resource);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Subscription Management
  async createSubscription(subscriptionData) {
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
      
      return new SubscriptionModel(resource);
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async getSubscriptionById(subscriptionId) {
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
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  async getSubscriptionByUserId(userId) {
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
      console.error('Error fetching subscription by user:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId, updates) {
    await this.initialize();
    
    try {
      const subscription = await this.getSubscriptionById(subscriptionId);
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

      return new SubscriptionModel(resource);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Usage Tracking
  async createUsageRecord(usageData) {
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
      
      return new UsageTrackingModel(resource);
    } catch (error) {
      console.error('Error creating usage record:', error);
      throw error;
    }
  }

  async getCurrentUsage(userId, periodStart, periodEnd) {
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
      console.error('Error fetching current usage:', error);
      throw error;
    }
  }

  async updateUsage(userId, usageType, amount = 1) {
    await this.initialize();
    
    try {
      // Get current billing period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get or create current usage record
      let usage = await this.getCurrentUsage(userId, periodStart, periodEnd);
      
      if (!usage) {
        const subscription = await this.getSubscriptionByUserId(userId);
        usage = await this.createUsageRecord({
          userId,
          subscriptionId: subscription?.id,
          periodStart,
          periodEnd,
          listingsCreated: 0,
          aiAnalysesUsed: 0,
          apiCallsMade: 0
        });
      }

      // Update usage
      usage.incrementUsage(usageType, amount);

      // Save updated usage
      const { resource } = await this.database
        .container('usageTracking')
        .item(usage.id, userId)
        .replace(usage);

      return new UsageTrackingModel(resource);
    } catch (error) {
      console.error('Error updating usage:', error);
      throw error;
    }
  }

  // Admin functions
  async getAllUsers(limit = 50, offset = 0) {
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
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  async getAllSubscriptions(limit = 50, offset = 0) {
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
      console.error('Error fetching all subscriptions:', error);
      throw error;
    }
  }

  async getSubscriptionStats() {
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
      console.error('Error fetching subscription stats:', error);
      throw error;
    }
  }

  // Enhanced usage tracking with detailed metrics
  async trackDetailedUsage(userId, usageData) {
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
      
      return resource;
    } catch (error) {
      console.error('Error tracking detailed usage:', error);
      throw error;
    }
  }

  // Get detailed usage analytics
  async getDetailedUsageAnalytics(userId, startDate, endDate) {
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
      console.error('Error fetching detailed usage analytics:', error);
      throw error;
    }
  }

  // Get system-wide usage metrics for admin
  async getSystemUsageMetrics(days = 30) {
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
      console.error('Error fetching system usage metrics:', error);
      throw error;
    }
  }

  // Featured Items
  async createFeaturedItem(listingData) {
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
      
      return resource;
    } catch (error) {
      console.error('Error creating featured item:', error);
      throw error;
    }
  }

  async getFeaturedItems(limit = 10) {
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
      console.error('Error fetching featured items:', error);
      throw error;
    }
  }
}

export default DatabaseService;