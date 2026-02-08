import { requireScope } from '../../auth/permissionMiddleware.js';

export async function parentScheduleRoutes(fastify, options) {
  const { parentScheduleController, authenticate } = options;

  // Scope middleware for parent-schedule resource
  const viewScope = requireScope('parent-schedule', 'view');

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Get all upcoming events for parent's children
  fastify.get('/schedule', {
    preHandler: [viewScope],
    schema: {
      tags: ['Parent Schedule'],
      summary: 'Get all upcoming events (training sessions and matches) for parent\'s children',
      response: {
        200: {
          type: 'object',
          properties: {
            trainingSessions: { type: 'array' },
            matches: { type: 'array' }
          }
        }
      }
    }
  }, parentScheduleController.getChildrenSchedule.bind(parentScheduleController));

  // Get schedule for a specific child
  fastify.get('/children/:childId/schedule', {
    preHandler: [viewScope],
    schema: {
      tags: ['Parent Schedule'],
      summary: 'Get upcoming events for a specific child',
      params: {
        type: 'object',
        properties: {
          childId: { type: 'integer' }
        },
        required: ['childId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            trainingSessions: { type: 'array' },
            matches: { type: 'array' }
          }
        }
      }
    }
  }, parentScheduleController.getChildSchedule.bind(parentScheduleController));
}
