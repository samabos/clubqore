export const inviteRoutes = async function (fastify, options) {
  const { inviteController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Validate invite code
  fastify.post('/validate', {
    schema: {
      tags: ['Invites'],
      summary: 'Validate invite code',
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            club: { type: 'object' },
            role: { type: 'string' },
            expires_at: { type: 'string' },
            remaining_uses: { type: 'integer' }
          }
        }
      }
    }
  }, inviteController.validateInviteCode.bind(inviteController));

  // Preview invite code without using it
  fastify.post('/preview', {
    schema: {
      tags: ['Invites'],
      summary: 'Preview invite code without using it',
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            club: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                clubType: { type: 'string' },
                description: { type: 'string' },
                logoUrl: { type: 'string' },
                memberCount: { type: 'number' }
              }
            },
            userCanJoin: { type: 'boolean' },
            alreadyMember: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, inviteController.previewInviteCode.bind(inviteController));
};
