import { authRequest, authResponse, errorResponse } from '../schemas/authSchemas.js';

export function registerRoutes(fastify, controller) {
  fastify.post('/auth/register', {
    schema: {
      description: 'Register a new user',
      tags: ['auth'],
      body: authRequest,
      response: {
        200: authResponse,
        400: errorResponse,
        429: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
            retryAfter: { type: 'number' }
          }
        }
      }
    },
    config: {
      rateLimit: {
        max: 3, // 3 registration attempts per minute
        timeWindow: '1 minute'
      }
    }
  }, controller.register.bind(controller));
}