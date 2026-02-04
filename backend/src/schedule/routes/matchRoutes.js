export async function matchRoutes(fastify, options) {
  const { matchController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Match CRUD routes
  fastify.post('/', {
    schema: {
      tags: ['Matches'],
      summary: 'Create a new match'
    }
  }, matchController.createMatch.bind(matchController));

  fastify.get('/', {
    schema: {
      tags: ['Matches'],
      summary: 'Get all matches for the user\'s club',
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          season_id: { type: 'integer' },
          team_id: { type: 'integer' },
          match_type: { type: 'string' },
          from_date: { type: 'string', format: 'date' },
          to_date: { type: 'string', format: 'date' },
          expand: { type: 'string', enum: ['true', 'false'], default: 'false' }
        }
      }
    }
  }, matchController.getMatches.bind(matchController));

  fastify.get('/upcoming', {
    schema: {
      tags: ['Matches'],
      summary: 'Get upcoming matches',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 10 }
        }
      }
    }
  }, matchController.getUpcomingMatches.bind(matchController));

  fastify.get('/:matchId', {
    schema: {
      tags: ['Matches'],
      summary: 'Get match by ID',
      params: {
        type: 'object',
        properties: {
          matchId: { type: 'integer' }
        },
        required: ['matchId']
      }
    }
  }, matchController.getMatch.bind(matchController));

  fastify.put('/:matchId', {
    schema: {
      tags: ['Matches'],
      summary: 'Update match',
      params: {
        type: 'object',
        properties: {
          matchId: { type: 'integer' }
        },
        required: ['matchId']
      }
    }
  }, matchController.updateMatch.bind(matchController));

  fastify.delete('/:matchId', {
    schema: {
      tags: ['Matches'],
      summary: 'Delete match',
      params: {
        type: 'object',
        properties: {
          matchId: { type: 'integer' }
        },
        required: ['matchId']
      }
    }
  }, matchController.deleteMatch.bind(matchController));

  fastify.post('/:matchId/publish', {
    schema: {
      tags: ['Matches'],
      summary: 'Publish match',
      params: {
        type: 'object',
        properties: {
          matchId: { type: 'integer' }
        },
        required: ['matchId']
      }
    }
  }, matchController.publishMatch.bind(matchController));

  fastify.put('/:matchId/result', {
    schema: {
      tags: ['Matches'],
      summary: 'Update match result',
      params: {
        type: 'object',
        properties: {
          matchId: { type: 'integer' }
        },
        required: ['matchId']
      }
    }
  }, matchController.updateMatchResult.bind(matchController));

  // Match Events routes
  fastify.post('/:matchId/events', {
    schema: {
      tags: ['Match Events'],
      summary: 'Add match event (goal, card, substitution)',
      params: {
        type: 'object',
        properties: {
          matchId: { type: 'integer' }
        },
        required: ['matchId']
      }
    }
  }, matchController.addMatchEvent.bind(matchController));

  fastify.get('/:matchId/events', {
    schema: {
      tags: ['Match Events'],
      summary: 'Get all events for a match',
      params: {
        type: 'object',
        properties: {
          matchId: { type: 'integer' }
        },
        required: ['matchId']
      }
    }
  }, matchController.getMatchEvents.bind(matchController));

  fastify.delete('/events/:eventId', {
    schema: {
      tags: ['Match Events'],
      summary: 'Delete match event',
      params: {
        type: 'object',
        properties: {
          eventId: { type: 'integer' }
        },
        required: ['eventId']
      }
    }
  }, matchController.deleteMatchEvent.bind(matchController));
}
