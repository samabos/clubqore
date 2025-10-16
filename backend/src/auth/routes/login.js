import { authRequest, authResponse, errorResponse } from '../schemas/authSchemas.js';

export function loginRoutes(fastify, controller) {
  fastify.post('/auth/login', {
    schema: {
      description: 'Login with email and password',
      tags: ['auth'],
      body: authRequest,
      response: {
        200: authResponse,
        401: errorResponse
      }
    }
  }, controller.login.bind(controller));
}
