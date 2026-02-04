/**
 * @deprecated OBSOLETE - This file has been moved to schedule/routes/
 * This file is kept temporarily for reference and can be safely deleted.
 * New location: backend/src/schedule/routes/seasonRoutes.js
 */
export async function seasonRoutes(fastify, options) {
  const { seasonController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Season CRUD routes
  fastify.post('/', {
    schema: {
      tags: ['Seasons'],
      summary: 'Create a new season'
    }
  }, seasonController.createSeason.bind(seasonController));

  fastify.get('/', {
    schema: {
      tags: ['Seasons'],
      summary: 'Get all seasons for the user\'s club'
    }
  }, seasonController.getSeasons.bind(seasonController));

  fastify.get('/active', {
    schema: {
      tags: ['Seasons'],
      summary: 'Get active season for the user\'s club'
    }
  }, seasonController.getActiveSeason.bind(seasonController));

  fastify.get('/:seasonId', {
    schema: {
      tags: ['Seasons'],
      summary: 'Get season by ID',
      params: {
        type: 'object',
        properties: {
          seasonId: { type: 'integer' }
        },
        required: ['seasonId']
      }
    }
  }, seasonController.getSeason.bind(seasonController));

  fastify.put('/:seasonId', {
    schema: {
      tags: ['Seasons'],
      summary: 'Update season',
      params: {
        type: 'object',
        properties: {
          seasonId: { type: 'integer' }
        },
        required: ['seasonId']
      }
    }
  }, seasonController.updateSeason.bind(seasonController));

  fastify.delete('/:seasonId', {
    schema: {
      tags: ['Seasons'],
      summary: 'Delete season',
      params: {
        type: 'object',
        properties: {
          seasonId: { type: 'integer' }
        },
        required: ['seasonId']
      }
    }
  }, seasonController.deleteSeason.bind(seasonController));

  fastify.post('/:seasonId/activate', {
    schema: {
      tags: ['Seasons'],
      summary: 'Set season as active',
      params: {
        type: 'object',
        properties: {
          seasonId: { type: 'integer' }
        },
        required: ['seasonId']
      }
    }
  }, seasonController.setActiveSeason.bind(seasonController));
}
