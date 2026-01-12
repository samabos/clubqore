import { authRequest, authResponse, errorResponse } from '../schemas/authSchemas.js';

export function loginRoutes(fastify, controller) {
  fastify.post('/auth/login', {
    schema: {
      description: 'Login with email and password',
      tags: ['auth'],
      body: authRequest,
      response: {
        200: authResponse,
        401: errorResponse,
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
        max: 5, // 5 login attempts per minute
        timeWindow: '1 minute'
      }
    }
  }, controller.login.bind(controller));
}
