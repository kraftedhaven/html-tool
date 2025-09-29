/**
 * Subscription Management Azure Function
 * Handles SaaS subscription operations including user registration, authentication, and billing
 */

import { app } from '@azure/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import StripeService from '../services/stripeService.js';
import DatabaseService from '../services/databaseService.js';
import { SubscriptionModel, UserModel, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from '../models/subscriptionModels.js';
import { getKeyVaultSecret } from '../utils/keyVault.js';

const stripeService = new StripeService();
const dbService = new DatabaseService();

/**
 * User Registration Endpoint
 */
app.http('userRegister', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: async (request, context) => {
    try {
      const { email, password, firstName, lastName, plan = 'basic' } = await request.json();

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return {
          status: 400,
          jsonBody: { error: 'Missing required fields' }
        };
      }

      // Check if user already exists
      const existingUser = await dbService.getUserByEmail(email);
      if (existingUser) {
        return {
          status: 409,
          jsonBody: { error: 'User already exists' }
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create Stripe customer first
      const stripeCustomer = await stripeService.createCustomer(
        email,
        `${firstName} ${lastName}`,
        { email }
      );

      // Create user in database
      const user = await dbService.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        stripeCustomerId: stripeCustomer.id
      });

      // Create subscription with 7-day trial
      const stripeSubscription = await stripeService.createSubscription(
        stripeCustomer.id,
        plan,
        7 // 7-day trial
      );

      // Create subscription record in database
      const subscription = await dbService.createSubscription({
        userId: user.id,
        stripeCustomerId: stripeCustomer.id,
        stripeSubscriptionId: stripeSubscription.id,
        plan: plan.toLowerCase(),
        status: SUBSCRIPTION_STATUS.TRIALING,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
      });

      // Generate JWT token
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const token = jwt.sign(
        { userId: user.id, email, subscriptionId: subscription.id },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return {
        status: 201,
        jsonBody: {
          message: 'User registered successfully',
          user: {
            id: user.id,
            email,
            firstName,
            lastName,
            subscription: {
              id: subscription.id,
              plan,
              status: subscription.status,
              trialEnd: subscription.currentPeriodEnd
            }
          },
          token,
          setupIntent: {
            clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
          }
        }
      };

    } catch (error) {
      context.log.error('Registration error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Registration failed', details: error.message }
      };
    }
  }
});

/**
 * User Login Endpoint
 */
app.http('userLogin', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: async (request, context) => {
    try {
      const { email, password } = await request.json();

      if (!email || !password) {
        return {
          status: 400,
          jsonBody: { error: 'Email and password required' }
        };
      }

      // Find user
      const user = await dbService.getUserByEmail(email);
      if (!user) {
        return {
          status: 401,
          jsonBody: { error: 'Invalid credentials' }
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return {
          status: 401,
          jsonBody: { error: 'Invalid credentials' }
        };
      }

      // Find user's subscription
      const subscription = await dbService.getSubscriptionByUserId(user.id);

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
      const isAdmin = ADMIN_USER_IDS.includes(user.id);

      // Generate JWT token
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const token = jwt.sign(
        { userId: user.id, email, subscriptionId: subscription?.id, isAdmin },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return {
        status: 200,
        jsonBody: {
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin,
            subscription: subscription ? {
              id: subscription.id,
              plan: subscription.plan,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd
            } : null
          },
          token
        }
      };

    } catch (error) {
      context.log.error('Login error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Login failed', details: error.message }
      };
    }
  }
});

/**
 * Get Subscription Plans
 */
app.http('getSubscriptionPlans', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'subscription/plans',
  handler: async (request, context) => {
    try {
      const plans = Object.values(SUBSCRIPTION_PLANS).map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        features: plan.features
      }));

      return {
        status: 200,
        jsonBody: { plans }
      };

    } catch (error) {
      context.log.error('Error fetching plans:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch plans' }
      };
    }
  }
});

/**
 * Update Subscription Plan
 */
app.http('updateSubscriptionPlan', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'subscription/update-plan',
  handler: async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          status: 401,
          jsonBody: { error: 'Authorization header required' }
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const decoded = jwt.verify(token, jwtSecret);

      const { newPlan } = await request.json();
      if (!newPlan || !SUBSCRIPTION_PLANS[newPlan.toUpperCase()]) {
        return {
          status: 400,
          jsonBody: { error: 'Invalid plan specified' }
        };
      }

      // Get user's subscription
      const subscription = await dbService.getSubscriptionById(decoded.subscriptionId);
      if (!subscription) {
        return {
          status: 404,
          jsonBody: { error: 'Subscription not found' }
        };
      }

      // Update Stripe subscription
      const updatedStripeSubscription = await stripeService.updateSubscription(
        subscription.stripeSubscriptionId,
        newPlan
      );

      // Update subscription in database
      const updatedSubscription = await dbService.updateSubscription(subscription.id, {
        plan: newPlan.toLowerCase()
      });

      return {
        status: 200,
        jsonBody: {
          message: 'Subscription updated successfully',
          subscription: {
            id: updatedSubscription.id,
            plan: updatedSubscription.plan,
            status: updatedSubscription.status,
            currentPeriodEnd: updatedSubscription.currentPeriodEnd
          }
        }
      };

    } catch (error) {
      context.log.error('Subscription update error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to update subscription', details: error.message }
      };
    }
  }
});

/**
 * Cancel Subscription
 */
app.http('cancelSubscription', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'subscription/cancel',
  handler: async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          status: 401,
          jsonBody: { error: 'Authorization header required' }
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const decoded = jwt.verify(token, jwtSecret);

      const { immediate = false } = await request.json();

      // Get user's subscription
      const subscription = await dbService.getSubscriptionById(decoded.subscriptionId);
      if (!subscription) {
        return {
          status: 404,
          jsonBody: { error: 'Subscription not found' }
        };
      }

      // Cancel Stripe subscription
      let cancelledSubscription;
      let updateData = {};
      
      if (immediate) {
        cancelledSubscription = await stripeService.cancelSubscriptionImmediately(
          subscription.stripeSubscriptionId
        );
        updateData.status = SUBSCRIPTION_STATUS.CANCELLED;
      } else {
        cancelledSubscription = await stripeService.cancelSubscription(
          subscription.stripeSubscriptionId,
          true
        );
        updateData.cancelAtPeriodEnd = true;
      }

      const updatedSubscription = await dbService.updateSubscription(subscription.id, updateData);

      return {
        status: 200,
        jsonBody: {
          message: immediate ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end',
          subscription: {
            id: updatedSubscription.id,
            plan: updatedSubscription.plan,
            status: updatedSubscription.status,
            cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
            currentPeriodEnd: updatedSubscription.currentPeriodEnd
          }
        }
      };

    } catch (error) {
      context.log.error('Subscription cancellation error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to cancel subscription', details: error.message }
      };
    }
  }
});

/**
 * Get User Profile and Subscription Details
 */
app.http('getUserProfile', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'user/profile',
  handler: async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          status: 401,
          jsonBody: { error: 'Authorization header required' }
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const decoded = jwt.verify(token, jwtSecret);

      const user = await dbService.getUserById(decoded.userId);
      const subscription = await dbService.getSubscriptionById(decoded.subscriptionId);

      if (!user) {
        return {
          status: 404,
          jsonBody: { error: 'User not found' }
        };
      }

      return {
        status: 200,
        jsonBody: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt
          },
          subscription: subscription ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            planDetails: subscription.getPlanDetails()
          } : null
        }
      };

    } catch (error) {
      context.log.error('Profile fetch error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch profile', details: error.message }
      };
    }
  }
});

/**
 * Create Billing Portal Session
 */
app.http('createBillingPortal', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'subscription/billing-portal',
  handler: async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          status: 401,
          jsonBody: { error: 'Authorization header required' }
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const decoded = jwt.verify(token, jwtSecret);

      const { returnUrl } = await request.json();
      if (!returnUrl) {
        return {
          status: 400,
          jsonBody: { error: 'Return URL required' }
        };
      }

      const user = await dbService.getUserById(decoded.userId);
      if (!user || !user.stripeCustomerId) {
        return {
          status: 404,
          jsonBody: { error: 'Customer not found' }
        };
      }

      const session = await stripeService.createBillingPortalSession(
        user.stripeCustomerId,
        returnUrl
      );

      return {
        status: 200,
        jsonBody: {
          url: session.url
        }
      };

    } catch (error) {
      context.log.error('Billing portal error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to create billing portal', details: error.message }
      };
    }
  }
});

/**
 * Stripe Webhook Handler
 */
app.http('stripeWebhook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'webhooks/stripe',
  handler: async (request, context) => {
    try {
      const sig = request.headers.get('stripe-signature');
      const webhookSecret = await getKeyVaultSecret('STRIPE_WEBHOOK_SECRET');
      
      // Verify webhook signature (simplified for demo)
      const event = await request.json();
      
      const result = await stripeService.handleWebhook(event);
      
      // Update subscription data based on webhook
      if (result.subscriptionId) {
        // Find subscription by Stripe subscription ID
        const subscriptions = await dbService.getAllSubscriptions(1000, 0);
        const subscription = subscriptions.find(s => s.stripeSubscriptionId === result.subscriptionId);
        
        if (subscription) {
          switch (result.action) {
            case 'subscription_updated':
              // Fetch updated subscription from Stripe
              const stripeSubscription = await stripeService.getSubscription(result.subscriptionId);
              await dbService.updateSubscription(subscription.id, {
                status: stripeSubscription.status,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
              });
              break;
              
            case 'subscription_deleted':
              await dbService.updateSubscription(subscription.id, {
                status: SUBSCRIPTION_STATUS.CANCELLED
              });
              break;
          }
        }
      }

      return {
        status: 200,
        jsonBody: { received: true, handled: result.handled }
      };

    } catch (error) {
      context.log.error('Webhook error:', error);
      return {
        status: 400,
        jsonBody: { error: 'Webhook processing failed' }
      };
    }
  }
});
/**

 * Get User Usage Statistics
 */
app.http('getUserUsage', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'user/usage',
  handler: async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          status: 401,
          jsonBody: { error: 'Authorization header required' }
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const decoded = jwt.verify(token, jwtSecret);

      const subscription = await dbService.getSubscriptionById(decoded.subscriptionId);
      if (!subscription) {
        return {
          status: 404,
          jsonBody: { error: 'Subscription not found' }
        };
      }

      // Get current period usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const currentUsage = await dbService.getCurrentUsage(decoded.userId, periodStart, periodEnd);
      const planDetails = subscription.getPlanDetails();

      // Calculate usage percentages
      const usage = currentUsage || {
        listingsCreated: 0,
        aiAnalysesUsed: 0,
        apiCallsMade: 0
      };

      const calculatePercentage = (used, limit) => {
        if (limit === -1) return 0; // Unlimited
        return limit > 0 ? Math.round((used / limit) * 100) : 0;
      };

      return {
        status: 200,
        jsonBody: {
          currentPeriod: {
            start: periodStart,
            end: periodEnd
          },
          usage: {
            listings: {
              used: usage.listingsCreated,
              limit: planDetails.features.monthlyListingLimit,
              percentage: calculatePercentage(usage.listingsCreated, planDetails.features.monthlyListingLimit),
              unlimited: planDetails.features.monthlyListingLimit === -1
            },
            aiAnalyses: {
              used: usage.aiAnalysesUsed,
              limit: planDetails.features.aiAnalysisLimit,
              percentage: calculatePercentage(usage.aiAnalysesUsed, planDetails.features.aiAnalysisLimit),
              unlimited: planDetails.features.aiAnalysisLimit === -1
            },
            apiCalls: {
              used: usage.apiCallsMade,
              limit: -1, // No limit on API calls
              percentage: 0,
              unlimited: true
            }
          },
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            features: planDetails.features
          }
        }
      };

    } catch (error) {
      context.log.error('Get usage error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch usage', details: error.message }
      };
    }
  }
});