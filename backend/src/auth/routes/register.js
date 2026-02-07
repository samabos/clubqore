import { authRequest, authResponse, errorResponse, clubManagerRegistrationRequest, registrationSuccessResponse } from '../schemas/authSchemas.js';

export function registerRoutes(fastify, controller) {
  // Basic registration (legacy - kept for backward compatibility)
  fastify.post('/auth/register', {
    schema: {
      description: 'Register a new user (basic)',
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
        max: 3,
        timeWindow: '1 minute'
      }
    }
  }, controller.register.bind(controller));

  // Club manager registration with all fields
  fastify.post('/auth/register/club-manager', {
    schema: {
      description: 'Register a new club manager with club (requires email verification before login)',
      tags: ['auth'],
      body: clubManagerRegistrationRequest,
      response: {
        200: registrationSuccessResponse,
        400: errorResponse,
        409: errorResponse,
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
        max: 3,
        timeWindow: '1 minute'
      }
    }
  }, controller.registerClubManager.bind(controller));
}