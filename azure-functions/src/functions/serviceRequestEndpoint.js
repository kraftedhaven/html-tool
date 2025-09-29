/**
 * Service Request Endpoint
 * Handles "Done-For-You" listing service requests
 *
 * Service Request Statuses:
 * - pending_payment: Waiting for the user to complete payment.
 * - pending_assignment: Waiting for a lister to be assigned.
 * - assigned: A lister has been assigned and is working on the listings.
 * - pending_customer_approval: Listings are complete and waiting for customer approval.
 * - completed: The customer has approved the listings and they have been published.
 * - rejected: The customer has rejected the listings.
 * - cancelled: The service request has been cancelled.
 */

import { app } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseService } from '../services/databaseService.js';
import { getStripeService } from '../services/stripeService.js';
import { authenticateUser } from '../middleware/auth.js';
import { trackUsage } from '../middleware/usageTracking.js';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Calculate pricing based on service complexity
 */
function calculateServicePricing(serviceDetails) {
  const {
    itemCount = 1,
    marketplaces = ['ebay'],
    complexity = 'standard',
    rushOrder = false,
    additionalServices = []
  } = serviceDetails;

  let basePrice = 8; // Base price per listing

  // Complexity multiplier
  const complexityMultipliers = {
    'simple': 0.75,    // $6 per listing
    'standard': 1.0,   // $8 per listing
    'complex': 1.5,    // $12 per listing
    'premium': 1.875   // $15 per listing
  };

  basePrice *= complexityMultipliers[complexity] || 1.0;

  // Multiple marketplace discount (bulk pricing)
  let marketplaceMultiplier = marketplaces.length;
  if (marketplaces.length > 1) {
    marketplaceMultiplier = marketplaces.length * 0.8; // 20% discount for multi-marketplace
  }

  // Rush order surcharge (50% extra)
  const rushMultiplier = rushOrder ? 1.5 : 1.0;

  // Additional services pricing
  const additionalServicePricing = {
    'seo_optimization': 3,
    'competitor_research': 5,
    'bulk_upload': 2,
    'priority_support': 10
  };

  const additionalCost = additionalServices.reduce((total, service) => {
    return total + (additionalServicePricing[service] || 0);
  }, 0);

  const subtotal = (basePrice * marketplaceMultiplier * itemCount * rushMultiplier) + additionalCost;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  return {
    basePrice,
    itemCount,
    marketplaceCount: marketplaces.length,
    complexity,
    rushOrder,
    additionalServices,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    breakdown: {
      perListing: basePrice,
      marketplaces: marketplaceMultiplier,
      rushSurcharge: rushMultiplier,
      additionalServices: additionalCost
    }
  };
}

/**
 * Create a new service request
 */
app.http('createServiceRequest', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'service-requests',
  handler: async (request, context) => {
    try {
      // Authenticate user
      const user = await authenticateUser(request);
      if (!user) {
        return {
          status: 401,
          jsonBody: { error: 'Authentication required' }
        };
      }

      // Parse form data with file uploads
      const formData = await request.formData();
      const serviceDetails = JSON.parse(formData.get('serviceDetails') || '{}');
      
      // Extract uploaded files
      const uploadedFiles = [];
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('image_') && value instanceof File) {
          const buffer = Buffer.from(await value.arrayBuffer());
          uploadedFiles.push({
            originalName: value.name,
            mimeType: value.type,
            size: value.size,
            buffer: buffer
          });
        }
      }

      // Validate required fields
      if (!serviceDetails.itemCount || uploadedFiles.length === 0) {
        return {
          status: 400,
          jsonBody: { 
            error: 'Missing required fields: itemCount and at least one image' 
          }
        };
      }

      // Calculate pricing
      const pricing = calculateServicePricing(serviceDetails);

      // Store images (in production, upload to Azure Blob Storage)
      const imageUrls = uploadedFiles.map((file, index) => {
        // For now, we'll store as base64 in database
        // In production, upload to Azure Blob Storage and return URLs
        return {
          id: uuidv4(),
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          data: file.buffer.toString('base64')
        };
      });

      // Create service request record
      const db = getDatabaseService();
      const serviceRequestId = uuidv4();
      
      const serviceRequest = {
        id: serviceRequestId,
        userId: user.id,
        status: 'pending_payment',
        serviceDetails: {
          ...serviceDetails,
          pricing
        },
        images: imageUrls,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.createServiceRequest(serviceRequest);

      // Create Stripe payment intent
      const stripe = getStripeService();
      const paymentIntent = await stripe.createPaymentIntent({
        amount: Math.round(pricing.total * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          serviceRequestId,
          userId: user.id,
          type: 'done_for_you_service'
        }
      });

      // Track usage
      await trackUsage(user.id, 'service_request_created', {
        serviceRequestId,
        itemCount: serviceDetails.itemCount,
        total: pricing.total
      });

      return {
        status: 201,
        jsonBody: {
          serviceRequest: {
            id: serviceRequestId,
            status: serviceRequest.status,
            pricing,
            itemCount: serviceDetails.itemCount,
            marketplaces: serviceDetails.marketplaces,
            createdAt: serviceRequest.createdAt
          },
          paymentIntent: {
            clientSecret: paymentIntent.client_secret,
            amount: paymentIntent.amount
          }
        }
      };

    } catch (error) {
      context.log.error('Error creating service request:', error);
      return {
        status: 500,
        jsonBody: { 
          error: 'Failed to create service request',
          details: error.message 
        }
      };
    }
  }
});

/**
 * Get service request pricing calculator
 */
app.http('calculateServicePricing', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'service-requests/calculate-pricing',
  handler: async (request, context) => {
    try {
      const serviceDetails = await request.json();
      const pricing = calculateServicePricing(serviceDetails);

      return {
        status: 200,
        jsonBody: { pricing }
      };

    } catch (error) {
      context.log.error('Error calculating pricing:', error);
      return {
        status: 500,
        jsonBody: { 
          error: 'Failed to calculate pricing',
          details: error.message 
        }
      };
    }
  }
});

/**
 * Get user's service requests
 */
app.http('getUserServiceRequests', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'service-requests/user',
  handler: async (request, context) => {
    try {
      // Authenticate user
      const user = await authenticateUser(request);
      if (!user) {
        return {
          status: 401,
          jsonBody: { error: 'Authentication required' }
        };
      }

      const db = getDatabaseService();
      const serviceRequests = await db.getUserServiceRequests(user.id);

      // Remove sensitive data (like full image data) from response
      const sanitizedRequests = serviceRequests.map(request => ({
        id: request.id,
        status: request.status,
        serviceDetails: {
          ...request.serviceDetails,
          // Remove image data, keep only metadata
          images: request.images?.map(img => ({
            id: img.id,
            originalName: img.originalName,
            mimeType: img.mimeType,
            size: img.size
          }))
        },
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        completedAt: request.completedAt
      }));

      return {
        status: 200,
        jsonBody: { serviceRequests: sanitizedRequests }
      };

    } catch (error) {
      context.log.error('Error fetching service requests:', error);
      return {
        status: 500,
        jsonBody: { 
          error: 'Failed to fetch service requests',
          details: error.message 
        }
      };
    }
  }
});

/**
 * Get specific service request details
 */
app.http('adminGetServiceRequests', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'service-requests/admin',
  handler: async (request, context) => {
    try {
      // Verify admin access
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      const db = getDatabaseService();
      const serviceRequests = await db.getAllServiceRequests();

      return {
        status: 200,
        jsonBody: { serviceRequests }
      };

    } catch (error) {
      context.log.error('Error fetching all service requests:', error);
      return {
        status: 500,
        jsonBody: { 
          error: 'Failed to fetch service requests',
          details: error.message 
        }
      };
    }
  }
});