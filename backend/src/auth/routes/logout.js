import { messageResponse, errorResponse } from '../schemas/authSchemas.js';

export function logoutRoutes(fastify, controller, authenticate) {
  fastify.post('/auth/logout', {
    schema: {
      description: 'Logout current session',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: messageResponse,
        401: errorResponse
      }
    },
    preHandler: authenticate
  }, controller.logout.bind(controller));

  fastify.post('/auth/logout-all', {
    schema: {
      description: 'Logout from all devices',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: messageResponse,
        401: errorResponse
      }
    },
    preHandler: authenticate
  }, controller.logoutAll.bind(controller));
}
