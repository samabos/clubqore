/**
 * Parent Payment Routes
 *
 * Routes for parents to manage their payment methods.
 */

import { ParentPaymentMethodController } from '../controllers/ParentPaymentMethodController.js';

/**
 * Register parent payment method routes
 *
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Route options
 * @param {Function} options.authenticate - Authentication middleware
 */
export async function parentPaymentRoutes(fastify, options) {
  const { authenticate } = options;
  const controller = new ParentPaymentMethodController(fastify.db);

  // Get all payment methods
  fastify.get('/', {
    preHandler: authenticate,
    schema: {
      description: 'Get all payment methods for the authenticated parent',
      tags: ['Parent Payment Methods'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                directDebits: { type: 'integer' },
                cards: { type: 'integer' },
                hasDefault: { type: 'boolean' },
                defaultMethod: { type: 'object' },
                methods: { type: 'array' }
              }
            }
          }
        }
      }
    }
  }, (request, reply) => controller.getPaymentMethods(request, reply));

  // Initiate mandate setup
  fastify.post('/mandate/setup', {
    preHandler: authenticate,
    schema: {
      description: 'Initiate Direct Debit mandate setup',
      tags: ['Parent Payment Methods'],
      body: {
        type: 'object',
        required: ['clubId'],
        properties: {
          clubId: { type: 'integer' },
          provider: { type: 'string', enum: ['gocardless'], default: 'gocardless' },
          scheme: { type: 'string', enum: ['bacs', 'sepa_core', 'ach'], default: 'bacs' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                authorisationUrl: { type: 'string' },
                expiresAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, (request, reply) => controller.initiateMandateSetup(request, reply));

  // Complete mandate setup (callback) - No auth required, state token validates user
  fastify.get('/mandate/complete', {
    schema: {
      description: 'Complete Direct Debit mandate setup (callback handler)',
      tags: ['Parent Payment Methods'],
      querystring: {
        type: 'object',
        required: ['state'],
        properties: {
          state: { type: 'string' }
        }
      }
    }
  }, (request, reply) => controller.completeMandateSetup(request, reply));

  // Get single payment method
  fastify.get('/:paymentMethodId', {
    preHandler: authenticate,
    schema: {
      description: 'Get a payment method by ID',
      tags: ['Parent Payment Methods'],
      params: {
        type: 'object',
        required: ['paymentMethodId'],
        properties: {
          paymentMethodId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.getPaymentMethod(request, reply));

  // Set default payment method
  fastify.put('/:paymentMethodId/default', {
    preHandler: authenticate,
    schema: {
      description: 'Set a payment method as default',
      tags: ['Parent Payment Methods'],
      params: {
        type: 'object',
        required: ['paymentMethodId'],
        properties: {
          paymentMethodId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.setDefaultPaymentMethod(request, reply));

  // Remove payment method
  fastify.delete('/:paymentMethodId', {
    preHandler: authenticate,
    schema: {
      description: 'Remove a payment method',
      tags: ['Parent Payment Methods'],
      params: {
        type: 'object',
        required: ['paymentMethodId'],
        properties: {
          paymentMethodId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.removePaymentMethod(request, reply));
}

export default parentPaymentRoutes;
