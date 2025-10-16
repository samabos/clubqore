import { refreshRequest, refreshResponse, errorResponse } from '../schemas/authSchemas.js';

export function refreshRoutes(fastify, controller) {
  fastify.post('/auth/refresh', {
    schema: {
      description: 'Refresh access token using refresh token',
      tags: ['auth'],
      body: refreshRequest,
      response: {
        200: refreshResponse,
        401: errorResponse
      }
    }
  }, controller.refresh.bind(controller));
}
