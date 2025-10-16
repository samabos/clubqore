import { authRequest, authResponse, errorResponse } from '../schemas/authSchemas.js';

export function registerRoutes(fastify, controller) {
  fastify.post('/auth/register', {
    schema: {
      description: 'Register a new user',
      tags: ['auth'],
      body: authRequest,
      response: {
        200: authResponse,
        400: errorResponse
      }
    }
  }, controller.register.bind(controller));
}