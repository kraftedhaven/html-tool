/**
 * Stripe Integration Service
 * Handles subscription billing and payment processing
 */

import Stripe from 'stripe';
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from '../models/subscriptionModels.js';

class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
  }

  /**
   * Create a new Stripe customer
   */
  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(customerId, planId, trialDays = 0) {
    try {
      const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
      if (!plan) {
        throw new Error(`Invalid plan: ${planId}`);
      }

      const subscriptionData = {
        customer: customerId,
        items: [{
          price: plan.stripePriceId
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent']
      };

      if (trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(subscriptionId, newPlanId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const newPlan = SUBSCRIPTION_PLANS[newPlanId.toUpperCase()];
      
      if (!newPlan) {
        throw new Error(`Invalid plan: ${newPlanId}`);
      }

      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPlan.stripePriceId
        }],
        proration_behavior: 'create_prorations'
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd
      });
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Immediately cancel subscription
   */
  async cancelSubscriptionImmediately(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription immediately:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Create payment method setup intent
   */
  async createSetupIntent(customerId) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });
      return setupIntent;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw new Error(`Failed to create setup intent: ${error.message}`);
    }
  }

  /**
   * Get customer's payment methods
   */
  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice', 'customer']
      });
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  /**
   * Get customer's invoices
   */
  async getInvoices(customerId, limit = 10) {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit
      });
      return invoices.data;
    } catch (error) {
      console.error('Error retrieving invoices:', error);
      throw new Error(`Failed to get invoices: ${error.message}`);
    }
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(customerId, returnUrl) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });
      return session;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw new Error(`Failed to create billing portal: ${error.message}`);
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(event.data.object);
        
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event.data.object);
        
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event.data.object);
        
        case 'invoice.payment_succeeded':
          return await this.handlePaymentSucceeded(event.data.object);
        
        case 'invoice.payment_failed':
          return await this.handlePaymentFailed(event.data.object);
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
          return { handled: false };
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  async handleSubscriptionCreated(subscription) {
    console.log('Subscription created:', subscription.id);
    return { 
      handled: true, 
      action: 'subscription_created',
      subscriptionId: subscription.id 
    };
  }

  async handleSubscriptionUpdated(subscription) {
    console.log('Subscription updated:', subscription.id);
    return { 
      handled: true, 
      action: 'subscription_updated',
      subscriptionId: subscription.id 
    };
  }

  async handleSubscriptionDeleted(subscription) {
    console.log('Subscription deleted:', subscription.id);
    return { 
      handled: true, 
      action: 'subscription_deleted',
      subscriptionId: subscription.id 
    };
  }

  async handlePaymentSucceeded(invoice) {
    console.log('Payment succeeded for invoice:', invoice.id);
    return { 
      handled: true, 
      action: 'payment_succeeded',
      invoiceId: invoice.id 
    };
  }

  async handlePaymentFailed(invoice) {
    console.log('Payment failed for invoice:', invoice.id);
    return { 
      handled: true, 
      action: 'payment_failed',
      invoiceId: invoice.id 
    };
  }
}

export default StripeService;