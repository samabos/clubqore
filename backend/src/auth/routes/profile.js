import { userResponse, errorResponse } from '../schemas/authSchemas.js';
import { updateUserRequest } from '../schemas/userSchemas.js';

export function profileRoutes(fastify, controller, authenticate) {
  // GET /auth/me - Get current user profile
  fastify.get('/auth/me', {
    schema: {
      description: 'Get current authenticated user with complete profile',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: userResponse,
        401: errorResponse
      }
    },
    preHandler: authenticate
  }, controller.getProfile.bind(controller));

  // PUT /auth/me - Update current user profile
  fastify.put('/auth/me', {
    schema: {
      description: 'Update current user profile',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      body: updateUserRequest,
      response: {
        200: {
          type: 'object',
          properties: {
            user: userResponse.properties.user,
            message: { type: 'string' }
          }
        },
        400: errorResponse,
        401: errorResponse
      }
    },
    preHandler: authenticate
  }, controller.updateProfile.bind(controller));
}
