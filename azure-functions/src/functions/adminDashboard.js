/**
 * Admin Dashboard Azure Function
 * Handles admin operations for subscription and user management
 */

import { app } from '@azure/functions';
import { verifyAdminAccess } from '../middleware/auth.js';
import DatabaseService from '../services/databaseService.js';

const dbService = new DatabaseService();

/**
 * Get All Users (Admin)
 */
app.http('adminGetUsers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/users',
  handler: async (request, context) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const offset = parseInt(url.searchParams.get('offset')) || 0;

      const users = await dbService.getAllUsers(limit, offset);
      
      // Remove sensitive data
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        stripeCustomerId: user.stripeCustomerId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));

      return {
        status: 200,
        jsonBody: {
          users: sanitizedUsers,
          pagination: {
            limit,
            offset,
            total: sanitizedUsers.length
          }
        }
      };

    } catch (error) {
      context.log.error('Admin get users error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch users', details: error.message }
      };
    }
  }
});

/**
 * Get All Subscriptions (Admin)
 */
app.http('adminGetSubscriptions', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/subscriptions',
  handler: async (request, context) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const offset = parseInt(url.searchParams.get('offset')) || 0;

      const subscriptions = await dbService.getAllSubscriptions(limit, offset);

      return {
        status: 200,
        jsonBody: {
          subscriptions,
          pagination: {
            limit,
            offset,
            total: subscriptions.length
          }
        }
      };

    } catch (error) {
      context.log.error('Admin get subscriptions error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch subscriptions', details: error.message }
      };
    }
  }
});

/**
 * Get Subscription Statistics (Admin)
 */
app.http('adminGetSubscriptionStats', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/subscription-stats',
  handler: async (request, context) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      const stats = await dbService.getSubscriptionStats();
      
      // Calculate totals and revenue
      let totalSubscriptions = 0;
      let monthlyRevenue = 0;
      const planBreakdown = {};
      const statusBreakdown = {};

      stats.forEach(stat => {
        totalSubscriptions += stat.count;
        
        if (!planBreakdown[stat.plan]) {
          planBreakdown[stat.plan] = 0;
        }
        planBreakdown[stat.plan] += stat.count;
        
        if (!statusBreakdown[stat.status]) {
          statusBreakdown[stat.status] = 0;
        }
        statusBreakdown[stat.status] += stat.count;
        
        // Calculate revenue for active subscriptions
        if (stat.status === 'active' || stat.status === 'trialing') {
          const planPrices = { basic: 29, pro: 67, enterprise: 97 };
          monthlyRevenue += (planPrices[stat.plan] || 0) * stat.count;
        }
      });

      return {
        status: 200,
        jsonBody: {
          totalSubscriptions,
          monthlyRevenue,
          planBreakdown,
          statusBreakdown,
          rawStats: stats
        }
      };

    } catch (error) {
      context.log.error('Admin get subscription stats error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch subscription stats', details: error.message }
      };
    }
  }
});

/**
 * Get User Details with Subscription and Usage (Admin)
 */
app.http('adminGetUserDetails', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/users/{userId}',
  handler: async (request, context) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      const userId = request.params.userId;
      if (!userId) {
        return {
          status: 400,
          jsonBody: { error: 'User ID required' }
        };
      }

      const user = await dbService.getUserById(userId);
      if (!user) {
        return {
          status: 404,
          jsonBody: { error: 'User not found' }
        };
      }

      const subscription = await dbService.getSubscriptionByUserId(userId);
      
      // Get current usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const usage = await dbService.getCurrentUsage(userId, periodStart, periodEnd);

      return {
        status: 200,
        jsonBody: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
            stripeCustomerId: user.stripeCustomerId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          subscription: subscription ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            planDetails: subscription.getPlanDetails()
          } : null,
          usage: usage ? {
            listingsCreated: usage.listingsCreated,
            aiAnalysesUsed: usage.aiAnalysesUsed,
            apiCallsMade: usage.apiCallsMade,
            periodStart: usage.periodStart,
            periodEnd: usage.periodEnd
          } : null
        }
      };

    } catch (error) {
      context.log.error('Admin get user details error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch user details', details: error.message }
      };
    }
  }
});

/**
 * Update User Subscription (Admin)
 */
app.http('adminUpdateUserSubscription', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'admin/users/{userId}/subscription',
  handler: async (request, context) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      const userId = request.params.userId;
      const { plan, status } = await request.json();

      if (!userId) {
        return {
          status: 400,
          jsonBody: { error: 'User ID required' }
        };
      }

      const subscription = await dbService.getSubscriptionByUserId(userId);
      if (!subscription) {
        return {
          status: 404,
          jsonBody: { error: 'Subscription not found' }
        };
      }

      const updateData = {};
      if (plan) updateData.plan = plan;
      if (status) updateData.status = status;

      const updatedSubscription = await dbService.updateSubscription(subscription.id, updateData);

      return {
        status: 200,
        jsonBody: {
          message: 'Subscription updated successfully',
          subscription: updatedSubscription
        }
      };

    } catch (error) {
      context.log.error('Admin update subscription error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to update subscription', details: error.message }
      };
    }
  }
});

/**
 * Get System Health and Metrics (Admin)
 */
app.http('adminGetSystemHealth', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/system-health',
  handler: async (request, context) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      // Get basic system metrics
      const users = await dbService.getAllUsers(1, 0);
      const subscriptions = await dbService.getAllSubscriptions(1, 0);
      const stats = await dbService.getSubscriptionStats();

      const totalUsers = users.length > 0 ? 'Connected' : 'No users';
      const totalSubscriptions = subscriptions.length > 0 ? 'Connected' : 'No subscriptions';
      
      return {
        status: 200,
        jsonBody: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: {
            users: totalUsers,
            subscriptions: totalSubscriptions,
            connected: true
          },
          services: {
            stripe: 'Connected',
            keyVault: 'Connected',
            functions: 'Running'
          },
          metrics: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version
          }
        }
      };

    } catch (error) {
      context.log.error('Admin system health error:', error);
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

/**
 * Get System Usage Analytics (Admin)
 */
app.http('adminGetUsageAnalytics', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/usage-analytics',
  handler: async (request, context) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      const url = new URL(request.url);
      const days = parseInt(url.searchParams.get('days')) || 30;

      const usageMetrics = await dbService.getSystemUsageMetrics(days);
      
      // Calculate summary statistics
      const summary = {
        totalApiCalls: 0,
        totalListings: 0,
        totalAiAnalyses: 0,
        uniqueUsers: new Set(),
        planBreakdown: {}
      };

      usageMetrics.forEach(metric => {
        summary.uniqueUsers.add(metric.userId);
        
        if (!summary.planBreakdown[metric.subscriptionPlan]) {
          summary.planBreakdown[metric.subscriptionPlan] = {
            users: 0,
            usage: 0
          };
        }
        
        summary.planBreakdown[metric.subscriptionPlan].users = metric.uniqueUsers;
        summary.planBreakdown[metric.subscriptionPlan].usage += metric.totalUsage;
        
        switch (metric.type) {
          case 'apiCalls':
            summary.totalApiCalls += metric.totalUsage;
            break;
          case 'listings':
            summary.totalListings += metric.totalUsage;
            break;
          case 'aiAnalysis':
            summary.totalAiAnalyses += metric.totalUsage;
            break;
        }
      });

      return {
        status: 200,
        jsonBody: {
          period: {
            days,
            startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          },
          summary: {
            ...summary,
            uniqueUsers: summary.uniqueUsers.size
          },
          detailedMetrics: usageMetrics
        }
      };

    } catch (error) {
      context.log.error('Admin usage analytics error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch usage analytics', details: error.message }
      };
    }
  }
});

/**
 * Update User Status (Admin)
 */
app.http('adminUpdateUserStatus', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'admin/users/{userId}/status',
  handler: async (request, context) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      const userId = request.params.userId;
      const { isEmailVerified, status } = await request.json();

      if (!userId) {
        return {
          status: 400,
          jsonBody: { error: 'User ID required' }
        };
      }

      const user = await dbService.getUserById(userId);
      if (!user) {
        return {
          status: 404,
          jsonBody: { error: 'User not found' }
        };
      }

      const updateData = {};
      if (typeof isEmailVerified === 'boolean') {
        updateData.isEmailVerified = isEmailVerified;
      }
      if (status) {
        updateData.status = status;
      }

      const updatedUser = await dbService.updateUser(userId, updateData);

      return {
        status: 200,
        jsonBody: {
          message: 'User status updated successfully',
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            isEmailVerified: updatedUser.isEmailVerified,
            status: updatedUser.status
          }
        }
      };

    } catch (error) {
      context.log.error('Admin update user status error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to update user status', details: error.message }
      };
    }
  }
});

/**
 * Get Feature Usage Report (Admin)
 */
app.http('adminGetFeatureUsageReport', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/feature-usage-report',
  handler: async (request, context) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      const url = new URL(request.url);
      const days = parseInt(url.searchParams.get('days')) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const endDate = new Date();

      // Get all users and their usage
      const users = await dbService.getAllUsers(1000, 0);
      const report = [];

      for (const user of users) {
        const subscription = await dbService.getSubscriptionByUserId(user.id);
        const usage = await dbService.getCurrentUsage(user.id, startDate, endDate);
        const detailedUsage = await dbService.getDetailedUsageAnalytics(user.id, startDate, endDate);

        report.push({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt
          },
          subscription: subscription ? {
            plan: subscription.plan,
            status: subscription.status,
            planDetails: subscription.getPlanDetails()
          } : null,
          usage: usage ? {
            listingsCreated: usage.listingsCreated,
            aiAnalysesUsed: usage.aiAnalysesUsed,
            apiCallsMade: usage.apiCallsMade
          } : {
            listingsCreated: 0,
            aiAnalysesUsed: 0,
            apiCallsMade: 0
          },
          detailedUsage: detailedUsage || []
        });
      }

      // Calculate aggregate statistics
      const aggregateStats = {
        totalUsers: report.length,
        activeUsers: report.filter(r => r.subscription?.status === 'active').length,
        trialUsers: report.filter(r => r.subscription?.status === 'trialing').length,
        totalListings: report.reduce((sum, r) => sum + r.usage.listingsCreated, 0),
        totalAiAnalyses: report.reduce((sum, r) => sum + r.usage.aiAnalysesUsed, 0),
        totalApiCalls: report.reduce((sum, r) => sum + r.usage.apiCallsMade, 0),
        planDistribution: {
          basic: report.filter(r => r.subscription?.plan === 'basic').length,
          pro: report.filter(r => r.subscription?.plan === 'pro').length,
          enterprise: report.filter(r => r.subscription?.plan === 'enterprise').length
        }
      };

      return {
        status: 200,
        jsonBody: {
          period: {
            days,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          aggregateStats,
          userReports: report
        }
      };

    } catch (error) {
      context.log.error('Admin feature usage report error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to generate feature usage report', details: error.message }
      };
    }
  }
});