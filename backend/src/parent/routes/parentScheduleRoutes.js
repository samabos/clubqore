export async function parentScheduleRoutes(fastify, options) {
  const { parentScheduleController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Get all upcoming events for parent's children
  fastify.get('/schedule', {
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
