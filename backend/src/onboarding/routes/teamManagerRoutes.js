import { TeamManagerController } from '../controllers/TeamManagerController.js';
import { 
  createTeamManagerSchema, 
  updateTeamManagerSchema,
  teamManagerParamsSchema 
} from '../schemas/teamManagerSchemas.js';

/**
 * Register team manager routes
 */
export async function registerTeamManagerRoutes(fastify, options) {
  const teamManagerController = new TeamManagerController(fastify.db);

  // Create team manager
  fastify.post('/clubs/:clubId/team-managers', {
    schema: {
      ...createTeamManagerSchema,
      ...teamManagerParamsSchema,
      tags: ['Team Managers'],
      summary: 'Create new team manager (coach) account',
      description: 'Creates a new team manager account with login credentials. Requires club manager authorization.',
      response: {
        201: {
          description: 'Team manager created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            teamManager: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                accountNumber: { type: 'string' },
                email: { type: 'string' },
                fullName: { type: 'string' },
                role: { type: 'string' },
                clubId: { type: 'string' },
                clubName: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string' }
              }
            },
            temporaryPassword: { type: 'string' },
            emailSent: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: fastify.authenticate
  }, (request, reply) => teamManagerController.createTeamManager(request, reply));

  // Get all team managers for a club
  fastify.get('/clubs/:clubId/team-managers', {
    schema: {
      ...teamManagerParamsSchema,
      tags: ['Team Managers'],
      summary: 'Get all team managers for a club',
      description: 'Retrieves list of all team managers (coaches) for the specified club',
      response: {
        200: {
          description: 'Team managers retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  accountNumber: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  fullName: { type: 'string' },
                  phone: { type: 'string' },
                  specialization: { type: 'string' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string' }
                }
              }
            },
            count: { type: 'number' }
          }
        }
      }
    },
    preHandler: fastify.authenticate
  }, (request, reply) => teamManagerController.getTeamManagers(request, reply));

  // Get team manager by ID
  fastify.get('/clubs/:clubId/team-managers/:teamManagerId', {
    schema: {
      params: {
        type: 'object',
        required: ['clubId', 'teamManagerId'],
        properties: {
          clubId: { type: 'string', pattern: '^[0-9]+$' },
          teamManagerId: { type: 'string', pattern: '^[0-9]+$' }
        }
      },
      tags: ['Team Managers'],
      summary: 'Get team manager details by ID',
      response: {
        200: {
          description: 'Team manager retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accountNumber: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                fullName: { type: 'string' },
                phone: { type: 'string' },
                dateOfBirth: { type: 'string' },
                specialization: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate
  }, (request, reply) => teamManagerController.getTeamManagerById(request, reply));

  // Update team manager
  fastify.put('/clubs/:clubId/team-managers/:teamManagerId', {
    schema: {
      ...updateTeamManagerSchema,
      params: {
        type: 'object',
        required: ['clubId', 'teamManagerId'],
        properties: {
          clubId: { type: 'string', pattern: '^[0-9]+$' },
          teamManagerId: { type: 'string', pattern: '^[0-9]+$' }
        }
      },
      tags: ['Team Managers'],
      summary: 'Update team manager details',
      response: {
        200: {
          description: 'Team manager updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: fastify.authenticate
  }, (request, reply) => teamManagerController.updateTeamManager(request, reply));

  // Deactivate team manager
  fastify.delete('/clubs/:clubId/team-managers/:teamManagerId', {
    schema: {
      params: {
        type: 'object',
        required: ['clubId', 'teamManagerId'],
        properties: {
          clubId: { type: 'string', pattern: '^[0-9]+$' },
          teamManagerId: { type: 'string', pattern: '^[0-9]+$' }
        }
      },
      tags: ['Team Managers'],
      summary: 'Deactivate team manager',
      description: 'Deactivates a team manager account (does not delete)',
      response: {
        200: {
          description: 'Team manager deactivated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: fastify.authenticate
  }, (request, reply) => teamManagerController.deactivateTeamManager(request, reply));
}
