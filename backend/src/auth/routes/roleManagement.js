import { errorResponse } from '../schemas/authSchemas.js';

export function roleManagementRoutes(fastify, controller, authenticate) {
  // GET /users/roles - Get user's available roles
  fastify.get('/users/roles', {
    schema: {
      description: 'Get user\'s available roles',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            roles: { 
              type: 'array', 
              items: { 
                type: 'string',
                enum: ['member', 'parent', 'club_manager', 'admin']
              }
            },
            primaryRole: { 
              type: 'string',
              enum: ['member', 'parent', 'club_manager', 'admin']
            },
            availableRoles: {
              type: 'array',
              items: { 
                type: 'string',
                enum: ['member', 'parent', 'club_manager', 'admin']
              },
              description: 'Roles that the user can switch to'
            }
          }
        },
        401: errorResponse
      }
    },
    preHandler: authenticate
  }, controller.getUserRoles.bind(controller));

  // POST /users/roles/assign - Assign new role to user (admin only)
  /** fastify.post('/users/roles/assign', {
    schema: {
      description: 'Assign new role to user (admin only)',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['userId', 'role'],
        properties: {
          userId: { 
            type: 'integer',
            description: 'ID of user to assign role to'
          },
          role: { 
            type: 'string',
            enum: ['member', 'parent', 'club_manager', 'admin'],
            description: 'Role to assign'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                roles: { 
                  type: 'array', 
                  items: { type: 'string' }
                }
              }
            }
          }
        },
        400: errorResponse,
        401: errorResponse,
        403: errorResponse,
        404: errorResponse
      }
    },
    preHandler: authenticate
  }, controller.assignUserRole.bind(controller));
  */
}
