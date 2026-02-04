export async function trainingSessionRoutes(fastify, options) {
  const { trainingSessionController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Training Session CRUD routes
  fastify.post('/', {
    schema: {
      tags: ['Training Sessions'],
      summary: 'Create a new training session',
      body: {
        type: 'object',
        required: ['title', 'date', 'start_time', 'end_time'],
        properties: {
          season_id: { type: ['integer', 'null'] },
          title: { type: 'string', minLength: 3 },
          description: { type: ['string', 'null'] },
          session_type: {
            type: 'string',
            enum: ['training', 'practice', 'conditioning', 'tactical', 'friendly', 'other'],
            default: 'training'
          },
          date: { type: 'string', format: 'date' },
          start_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
          end_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
          location: { type: ['string', 'null'] },
          coach_id: { type: ['integer', 'null'] },
          max_participants: { type: ['integer', 'null'], minimum: 1 },
          status: {
            type: 'string',
            enum: ['draft', 'scheduled', 'cancelled'],
            default: 'draft'
          },
          team_ids: {
            type: 'array',
            items: { type: 'integer' },
            minItems: 1
          },
          is_recurring: { type: 'boolean', default: false },
          recurrence_pattern: {
            type: ['string', 'null'],
            enum: ['daily', 'weekly', 'biweekly', 'monthly', null]
          },
          recurrence_days: {
            type: ['array', 'null'],
            items: { type: 'integer', minimum: 0, maximum: 6 }
          },
          recurrence_end_date: { type: ['string', 'null'], format: 'date' }
        }
      }
    }
  }, trainingSessionController.createSession.bind(trainingSessionController));

  fastify.get('/', {
    schema: {
      tags: ['Training Sessions'],
      summary: 'Get all training sessions for the user\'s club',
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          season_id: { type: 'integer' },
          team_id: { type: 'integer' },
          from_date: { type: 'string', format: 'date' },
          to_date: { type: 'string', format: 'date' },
          expand: { type: 'string', enum: ['true', 'false'], default: 'false' }
        }
      }
    }
  }, trainingSessionController.getSessions.bind(trainingSessionController));

  fastify.get('/upcoming', {
    schema: {
      tags: ['Training Sessions'],
      summary: 'Get upcoming training sessions',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 10 }
        }
      }
    }
  }, trainingSessionController.getUpcomingSessions.bind(trainingSessionController));

  fastify.get('/:sessionId', {
    schema: {
      tags: ['Training Sessions'],
      summary: 'Get training session by ID',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' }
        },
        required: ['sessionId']
      }
    }
  }, trainingSessionController.getSession.bind(trainingSessionController));

  fastify.put('/:sessionId', {
    schema: {
      tags: ['Training Sessions'],
      summary: 'Update training session',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' }
        },
        required: ['sessionId']
      },
      body: {
        type: 'object',
        properties: {
          season_id: { type: ['integer', 'null'] },
          title: { type: 'string', minLength: 3 },
          description: { type: ['string', 'null'] },
          session_type: {
            type: 'string',
            enum: ['training', 'practice', 'conditioning', 'tactical', 'friendly', 'other']
          },
          date: { type: 'string', format: 'date' },
          start_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
          end_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
          location: { type: ['string', 'null'] },
          coach_id: { type: ['integer', 'null'] },
          max_participants: { type: ['integer', 'null'], minimum: 1 },
          status: {
            type: 'string',
            enum: ['draft', 'scheduled']
          },
          team_ids: {
            type: 'array',
            items: { type: 'integer' }
          }
        }
      }
    }
  }, trainingSessionController.updateSession.bind(trainingSessionController));

  fastify.delete('/:sessionId', {
    schema: {
      tags: ['Training Sessions'],
      summary: 'Delete training session',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' }
        },
        required: ['sessionId']
      }
    }
  }, trainingSessionController.deleteSession.bind(trainingSessionController));

  fastify.post('/:sessionId/publish', {
    schema: {
      tags: ['Training Sessions'],
      summary: 'Publish training session',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' }
        },
        required: ['sessionId']
      }
    }
  }, trainingSessionController.publishSession.bind(trainingSessionController));

  fastify.post('/:sessionId/cancel', {
    schema: {
      tags: ['Training Sessions'],
      summary: 'Cancel training session (changes status to cancelled)',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' }
        },
        required: ['sessionId']
      }
    }
  }, trainingSessionController.cancelSession.bind(trainingSessionController));

  // ============================================================================
  // RECURRING EVENT EXCEPTION ROUTES (Option B Architecture)
  // ============================================================================

  // Cancel single occurrence
  fastify.post('/:sessionId/occurrences/:date/cancel', {
    schema: {
      tags: ['Training Sessions - Recurring'],
      summary: 'Cancel a single occurrence of a recurring session',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' },
          date: { type: 'string', format: 'date' }
        },
        required: ['sessionId', 'date']
      }
    }
  }, trainingSessionController.cancelOccurrence.bind(trainingSessionController));

  // Reschedule single occurrence
  fastify.post('/:sessionId/occurrences/:date/reschedule', {
    schema: {
      tags: ['Training Sessions - Recurring'],
      summary: 'Reschedule a single occurrence',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' },
          date: { type: 'string', format: 'date' }
        },
        required: ['sessionId', 'date']
      },
      body: {
        type: 'object',
        required: ['newDate', 'newStartTime', 'newEndTime'],
        properties: {
          newDate: { type: 'string', format: 'date' },
          newStartTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
          newEndTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
        }
      }
    }
  }, trainingSessionController.rescheduleOccurrence.bind(trainingSessionController));

  // Modify single occurrence
  fastify.patch('/:sessionId/occurrences/:date', {
    schema: {
      tags: ['Training Sessions - Recurring'],
      summary: 'Modify a single occurrence (change any fields)',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' },
          date: { type: 'string', format: 'date' }
        },
        required: ['sessionId', 'date']
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          start_time: { type: 'string' },
          end_time: { type: 'string' },
          location: { type: 'string' },
          coach_id: { type: 'integer' },
          max_participants: { type: 'integer' },
          status: { type: 'string', enum: ['draft', 'scheduled', 'cancelled'] }
        }
      }
    }
  }, trainingSessionController.modifyOccurrence.bind(trainingSessionController));

  // Edit this and future occurrences
  fastify.patch('/:sessionId/occurrences/:date/future', {
    schema: {
      tags: ['Training Sessions - Recurring'],
      summary: 'Edit this and all future occurrences (splits series)',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' },
          date: { type: 'string', format: 'date' }
        },
        required: ['sessionId', 'date']
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          session_type: { type: 'string' },
          start_time: { type: 'string' },
          end_time: { type: 'string' },
          location: { type: 'string' },
          coach_id: { type: 'integer' },
          max_participants: { type: 'integer' },
          status: { type: 'string' }
        }
      }
    }
  }, trainingSessionController.editFutureOccurrences.bind(trainingSessionController));

  // Edit all occurrences
  fastify.patch('/:sessionId/all', {
    schema: {
      tags: ['Training Sessions - Recurring'],
      summary: 'Edit all occurrences in recurring series',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' }
        },
        required: ['sessionId']
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          session_type: { type: 'string' },
          start_time: { type: 'string' },
          end_time: { type: 'string' },
          location: { type: 'string' },
          coach_id: { type: 'integer' },
          max_participants: { type: 'integer' },
          status: { type: 'string' }
        }
      }
    }
  }, trainingSessionController.editAllOccurrences.bind(trainingSessionController));

  // Delete exception (restore to parent values)
  fastify.delete('/:sessionId/occurrences/:date/exception', {
    schema: {
      tags: ['Training Sessions - Recurring'],
      summary: 'Delete exception and restore occurrence to parent values',
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' },
          date: { type: 'string', format: 'date' }
        },
        required: ['sessionId', 'date']
      }
    }
  }, trainingSessionController.deleteException.bind(trainingSessionController));
}
