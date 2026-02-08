import { requireScope } from '../../auth/permissionMiddleware.js';

export async function seasonRoutes(fastify, options) {
  const { seasonController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Scope middleware for seasons resource (matches database)
  const viewScope = requireScope('seasons', 'view');
  const createScope = requireScope('seasons', 'create');
  const editScope = requireScope('seasons', 'edit');
  const deleteScope = requireScope('seasons', 'delete');

  // Season CRUD routes
  fastify.post('/', {
    preHandler: [createScope],
    schema: {
      tags: ['Seasons'],
      summary: 'Create a new season'
    }
  }, seasonController.createSeason.bind(seasonController));

  fastify.get('/', {
    preHandler: [viewScope],
    schema: {
      tags: ['Seasons'],
      summary: 'Get all seasons for the user\'s club'
    }
  }, seasonController.getSeasons.bind(seasonController));

  fastify.get('/active', {
    preHandler: [viewScope],
    schema: {
      tags: ['Seasons'],
      summary: 'Get active season for the user\'s club'
    }
  }, seasonController.getActiveSeason.bind(seasonController));

  fastify.get('/:seasonId', {
    preHandler: [viewScope],
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
    preHandler: [editScope],
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
    preHandler: [deleteScope],
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
    preHandler: [editScope],
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
