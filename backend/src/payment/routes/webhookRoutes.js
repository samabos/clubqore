/**
 * Webhook Routes
 *
 * Routes for receiving webhooks from payment providers.
 * These routes do NOT require authentication (webhooks come from external services).
 */

import { WebhookController } from '../controllers/WebhookController.js';

/**
 * Register webhook routes
 *
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Route options
 */
export async function webhookRoutes(fastify, options) {
  const controller = new WebhookController(fastify.db);

  // Configure to preserve raw body for signature verification
  // This hook captures the raw body before Fastify parses it
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      req.rawBody = body;
      const json = JSON.parse(body);
      done(null, json);
    } catch (err) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // GoCardless webhook endpoint
  fastify.post('/gocardless', {
    schema: {
      description: 'GoCardless webhook endpoint',
      tags: ['Webhooks'],
      headers: {
        type: 'object',
        properties: {
          'webhook-signature': { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            received: { type: 'boolean' },
            eventsProcessed: { type: 'integer' }
          }
        }
      }
    },
    // Disable default body parsing - we handle it above
    config: {
      rawBody: true
    }
  }, (request, reply) => controller.handleGoCardlessWebhook(request, reply));

  // Stripe webhook endpoint (for future use)
  fastify.post('/stripe', {
    schema: {
      description: 'Stripe webhook endpoint',
      tags: ['Webhooks'],
      headers: {
        type: 'object',
        properties: {
          'stripe-signature': { type: 'string' }
        }
      }
    },
    config: {
      rawBody: true
    }
  }, (request, reply) => controller.handleStripeWebhook(request, reply));

  // Health check for webhooks
  fastify.get('/health', {
    schema: {
      description: 'Webhook endpoint health check',
      tags: ['Webhooks'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, (request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });
}

export default webhookRoutes;
