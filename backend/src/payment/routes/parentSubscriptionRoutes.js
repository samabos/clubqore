/**
 * Parent Subscription Routes
 *
 * Routes for parents to manage their subscriptions (self-service).
 */

import { ParentSubscriptionController } from '../controllers/ParentSubscriptionController.js';

/**
 * Register parent subscription routes
 *
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Route options
 * @param {Function} options.authenticate - Authentication middleware
 */
export async function parentSubscriptionRoutes(fastify, options) {
  const { authenticate } = options;
  const controller = new ParentSubscriptionController(fastify.db);

  // Get all subscriptions for the parent
  fastify.get('/', {
    preHandler: authenticate,
    schema: {
      description: 'Get all subscriptions for the authenticated parent',
      tags: ['Parent Subscriptions'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'active', 'paused', 'cancelled', 'suspended'] },
          clubId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.getSubscriptions(request, reply));

  // Create a new subscription
  fastify.post('/', {
    preHandler: authenticate,
    schema: {
      description: 'Create a new subscription for a child',
      tags: ['Parent Subscriptions'],
      body: {
        type: 'object',
        required: ['clubId', 'childUserId', 'membershipTierId'],
        properties: {
          clubId: { type: 'integer' },
          childUserId: { type: 'integer' },
          membershipTierId: { type: 'integer' },
          paymentMandateId: { type: 'integer' },
          billingDayOfMonth: { type: 'integer', minimum: 1, maximum: 28 },
          billingFrequency: { type: 'string', enum: ['monthly', 'annual'] }
        }
      }
    }
  }, (request, reply) => controller.createSubscription(request, reply));

  // Get single subscription
  fastify.get('/:subscriptionId', {
    preHandler: authenticate,
    schema: {
      description: 'Get a subscription by ID',
      tags: ['Parent Subscriptions'],
      params: {
        type: 'object',
        required: ['subscriptionId'],
        properties: {
          subscriptionId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.getSubscription(request, reply));

  // Change subscription tier
  fastify.put('/:subscriptionId/tier', {
    preHandler: authenticate,
    schema: {
      description: 'Change subscription tier',
      tags: ['Parent Subscriptions'],
      params: {
        type: 'object',
        required: ['subscriptionId'],
        properties: {
          subscriptionId: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        required: ['newTierId'],
        properties: {
          newTierId: { type: 'integer' },
          prorate: { type: 'boolean' }
        }
      }
    }
  }, (request, reply) => controller.changeTier(request, reply));

  // Pause subscription
  fastify.post('/:subscriptionId/pause', {
    preHandler: authenticate,
    schema: {
      description: 'Pause a subscription',
      tags: ['Parent Subscriptions'],
      params: {
        type: 'object',
        required: ['subscriptionId'],
        properties: {
          subscriptionId: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        properties: {
          resumeDate: { type: 'string', format: 'date' }
        }
      }
    }
  }, (request, reply) => controller.pauseSubscription(request, reply));

  // Resume subscription
  fastify.post('/:subscriptionId/resume', {
    preHandler: authenticate,
    schema: {
      description: 'Resume a paused subscription',
      tags: ['Parent Subscriptions'],
      params: {
        type: 'object',
        required: ['subscriptionId'],
        properties: {
          subscriptionId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.resumeSubscription(request, reply));

  // Cancel subscription
  fastify.post('/:subscriptionId/cancel', {
    preHandler: authenticate,
    schema: {
      description: 'Cancel a subscription',
      tags: ['Parent Subscriptions'],
      params: {
        type: 'object',
        required: ['subscriptionId'],
        properties: {
          subscriptionId: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string', maxLength: 500 },
          immediate: { type: 'boolean' }
        }
      }
    }
  }, (request, reply) => controller.cancelSubscription(request, reply));

  // Get available tiers for a club
  fastify.get('/clubs/:clubId/membership-tiers', {
    preHandler: authenticate,
    schema: {
      description: 'Get available membership tiers for a club',
      tags: ['Parent Subscriptions'],
      params: {
        type: 'object',
        required: ['clubId'],
        properties: {
          clubId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.getAvailableTiers(request, reply));
}

export default parentSubscriptionRoutes;
