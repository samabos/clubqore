export const clubRoutes = async function (fastify, options) {
  const { clubController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Create new club
  fastify.post('/', {
    schema: {
      tags: ['Clubs'],
      summary: 'Create new club',
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          clubType: { type: 'string', enum: ['youth-academy', 'amateur-club', 'semi-professional', 'professional', 'training-center'] },
          description: { type: ['string', 'null'], maxLength: 1000 },
          foundedYear: { type: ['integer', 'null'], minimum: 1800, maximum: new Date().getFullYear() },
          membershipCapacity: { type: ['integer', 'null'], minimum: 1 },
          website: { type: ['string', 'null'], format: 'uri' },
          address: { type: ['string', 'null'], maxLength: 500 },
          phone: { type: ['string', 'null'], maxLength: 20 },
          email: { type: ['string', 'null'], format: 'email' },
          logoUrl: { type: ['string', 'null'], format: 'uri' }
        },
        required: ['name', 'clubType']
      }
    }
  }, clubController.createClub.bind(clubController));

  // Get club details
  fastify.get('/:clubId', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get club details',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        }
      }
    }
  }, clubController.getClub.bind(clubController));

  // Update club information (club managers only)
  fastify.put('/:clubId', {
    schema: {
      tags: ['Clubs'],
      summary: 'Update club information (club managers only)',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          clubType: { type: 'string', enum: ['youth-academy', 'amateur-club', 'semi-professional', 'professional', 'training-center'] },
          description: { type: ['string', 'null'], maxLength: 1000 },
          foundedYear: { type: ['integer', 'null'], minimum: 1800, maximum: new Date().getFullYear() },
          membershipCapacity: { type: ['integer', 'null'], minimum: 1 },
          website: { type: ['string', 'null'], format: 'uri' },
          address: { type: ['string', 'null'], maxLength: 500 },
          phone: { type: ['string', 'null'], maxLength: 20 },
          email: { type: ['string', 'null'], format: 'email' },
          logoUrl: { type: ['string', 'null'], format: 'uri' }
        }
      }
    }
  }, clubController.updateClub.bind(clubController));

  // Get current user's club (for club managers)
  fastify.get('/my-club', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get current user\'s club (for club managers)'
    }
  }, clubController.getMyClub.bind(clubController));

  // Get user's clubs (current user)
  fastify.get('/user', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get current user\'s clubs'
    }
  }, clubController.getUserClubs.bind(clubController));

  // Get user's clubs by ID
  fastify.get('/user/:userId', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get user\'s clubs by ID'
    }
  }, clubController.getUserClubs.bind(clubController));


  // Search clubs
  fastify.get('/search', {
    schema: {
      tags: ['Clubs'],
      summary: 'Search clubs',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          category: { type: 'string' },
          location: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, clubController.searchClubs.bind(clubController));

  // Browse clubs by category
  fastify.get('/browse', {
    schema: {
      tags: ['Clubs'],
      summary: 'Browse clubs by category',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, clubController.browseClubs.bind(clubController));

  // Create invite code for club
  fastify.post('/:clubId/invite-codes', {
    schema: {
      tags: ['Clubs'],
      summary: 'Create invite code for club',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        properties: {
          expires_at: { type: 'string', format: 'date-time' },
          max_uses: { type: 'integer', minimum: 1 },
          role: { type: 'string', enum: ['member', 'parent'] }
        }
      }
    }
  }, clubController.createInviteCode.bind(clubController));

  // Get club invite codes
  fastify.get('/:clubId/invite-codes', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get club invite codes',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        }
      }
    }
  }, clubController.getClubInviteCodes.bind(clubController));

  // Deactivate invite code
  fastify.delete('/invite-codes/:codeId', {
    schema: {
      tags: ['Clubs'],
      summary: 'Deactivate invite code',
      params: {
        type: 'object',
        properties: {
          codeId: { type: 'integer' }
        }
      }
    }
  }, clubController.deactivateInviteCode.bind(clubController));

  // Upload club logo
  fastify.post('/:clubId/logo', {
    schema: {
      tags: ['Clubs'],
      summary: 'Upload club logo',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        },
        required: ['clubId']
      },
      body: {
        type: 'object',
        properties: {
          logoData: { 
            type: 'string',
            description: 'Base64 encoded image data'
          }
        },
        required: ['logoData']
      }
    }
  }, clubController.uploadClubLogo.bind(clubController));

};
