/**
 * Subscription Routes (Club Manager)
 *
 * Routes for club managers to view and manage subscriptions.
 */

import { SubscriptionController } from '../controllers/SubscriptionController.js';

/**
 * Register subscription routes for club managers
 *
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Route options
 * @param {Function} options.authenticate - Authentication middleware
 */
export async function subscriptionRoutes(fastify, options) {
  const { authenticate } = options;
  const controller = new SubscriptionController(fastify.db);

  // Get available members for subscription (must be before /:subscriptionId)
  fastify.get('/available-members', {
    preHandler: authenticate,
    schema: {
      description: 'Get members who can be subscribed (no active subscription)',
      tags: ['Subscriptions'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  email: { type: 'string' },
                  first_name: { type: 'string' },
                  last_name: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, (request, reply) => controller.getAvailableMembers(request, reply));

  // Get subscription statistics (must be before /:subscriptionId)
  fastify.get('/stats', {
    preHandler: authenticate,
    schema: {
      description: 'Get subscription statistics for the club',
      tags: ['Subscriptions'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                activeCount: { type: 'integer' },
                pendingCount: { type: 'integer' },
                pausedCount: { type: 'integer' },
                cancelledCount: { type: 'integer' },
                suspendedCount: { type: 'integer' },
                totalActive: { type: 'integer' },
                monthlyRecurringRevenue: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, (request, reply) => controller.getStats(request, reply));

  // Get all subscriptions
  fastify.get('/', {
    preHandler: authenticate,
    schema: {
      description: 'Get all subscriptions for the club',
      tags: ['Subscriptions'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'active', 'paused', 'cancelled', 'suspended'] },
          tierId: { type: 'integer' },
          search: { type: 'string' },
          sortBy: { type: 'string', enum: ['created_at', 'amount', 'status'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        }
      }
    }
  }, (request, reply) => controller.getSubscriptions(request, reply));

  // Create subscription for a member
  fastify.post('/', {
    preHandler: authenticate,
    schema: {
      description: 'Create a subscription for a member',
      tags: ['Subscriptions'],
      body: {
        type: 'object',
        required: ['childUserId', 'membershipTierId'],
        properties: {
          parentUserId: { type: 'integer', description: 'Parent user ID (optional, for children)' },
          childUserId: { type: 'integer', description: 'Member/child user ID' },
          membershipTierId: { type: 'integer' },
          billingFrequency: { type: 'string', enum: ['monthly', 'annual'] },
          billingDayOfMonth: { type: 'integer', minimum: 1, maximum: 28 },
          startDate: { type: 'string', format: 'date' }
        }
      }
    }
  }, (request, reply) => controller.createSubscription(request, reply));

  // Get single subscription
  fastify.get('/:subscriptionId', {
    preHandler: authenticate,
    schema: {
      description: 'Get a subscription by ID',
      tags: ['Subscriptions'],
      params: {
        type: 'object',
        required: ['subscriptionId'],
        properties: {
          subscriptionId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.getSubscription(request, reply));

  // Cancel subscription
  fastify.post('/:subscriptionId/cancel', {
    preHandler: authenticate,
    schema: {
      description: 'Cancel a subscription',
      tags: ['Subscriptions'],
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

  // Suspend subscription
  fastify.post('/:subscriptionId/suspend', {
    preHandler: authenticate,
    schema: {
      description: 'Suspend a subscription due to payment issues',
      tags: ['Subscriptions'],
      params: {
        type: 'object',
        required: ['subscriptionId'],
        properties: {
          subscriptionId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.suspendSubscription(request, reply));

  // Reactivate suspended subscription
  fastify.post('/:subscriptionId/reactivate', {
    preHandler: authenticate,
    schema: {
      description: 'Reactivate a suspended subscription',
      tags: ['Subscriptions'],
      params: {
        type: 'object',
        required: ['subscriptionId'],
        properties: {
          subscriptionId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.reactivateSubscription(request, reply));
}

export default subscriptionRoutes;
