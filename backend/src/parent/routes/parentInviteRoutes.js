import { ParentInviteController } from '../controllers/ParentInviteController.js';
import { createAuthMiddleware } from '../../auth/middleware.js';

/**
 * Parent Invite Routes
 *
 * Routes for managing parent invitations
 * - Protected routes require authentication (club managers)
 * - Public routes for invite validation and registration
 */
export async function registerParentInviteRoutes(fastify, options) {
  // Create authentication middleware
  const authenticate = createAuthMiddleware(fastify.db);

  // Initialize controller with database instance
  const controller = new ParentInviteController(fastify.db);

  // ==================== PROTECTED ROUTES (Club Manager) ====================

  /**
   * POST /api/parent-invites
   * Create a new parent invite
   */
  fastify.post('/api/parent-invites', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['clubId', 'inviteeEmail'],
        properties: {
          clubId: { type: 'integer' },
          inviteeEmail: { type: 'string', format: 'email' },
          inviteeFirstName: { type: 'string' },
          inviteeLastName: { type: 'string' }
        }
      }
    }
  }, controller.createInvite.bind(controller));

  /**
   * GET /api/clubs/:clubId/parent-invites
   * Get all parent invites for a club
   */
  fastify.get('/api/clubs/:clubId/parent-invites', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'used', 'expired'] }
        }
      }
    }
  }, controller.getClubInvites.bind(controller));

  /**
   * DELETE /api/parent-invites/:inviteCode
   * Cancel an invite
   */
  fastify.delete('/api/parent-invites/:inviteCode', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          inviteCode: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['clubId'],
        properties: {
          clubId: { type: 'integer' }
        }
      }
    }
  }, controller.cancelInvite.bind(controller));

  /**
   * POST /api/parent-invites/:inviteCode/resend
   * Resend an invite email
   */
  fastify.post('/api/parent-invites/:inviteCode/resend', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          inviteCode: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['clubId'],
        properties: {
          clubId: { type: 'integer' }
        }
      }
    }
  }, controller.resendInvite.bind(controller));

  // ==================== PUBLIC ROUTES (Registration) ====================

  /**
   * GET /api/public/parent-invites/:inviteCode/validate
   * Validate an invite code (public)
   */
  fastify.get('/api/public/parent-invites/:inviteCode/validate', {
    schema: {
      params: {
        type: 'object',
        properties: {
          inviteCode: { type: 'string' }
        }
      }
    }
  }, controller.validateInvite.bind(controller));

  /**
   * GET /api/public/parent-invites/:inviteCode
   * Get invite details for registration page (public)
   */
  fastify.get('/api/public/parent-invites/:inviteCode', {
    schema: {
      params: {
        type: 'object',
        properties: {
          inviteCode: { type: 'string' }
        }
      }
    }
  }, controller.getInviteDetails.bind(controller));

  /**
   * POST /api/public/parent-invites/:inviteCode/complete
   * Complete registration using an invite code (public)
   */
  fastify.post('/api/public/parent-invites/:inviteCode/complete', {
    schema: {
      params: {
        type: 'object',
        properties: {
          inviteCode: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['parent', 'account'],
        properties: {
          parent: {
            type: 'object',
            required: ['firstName', 'lastName', 'email'],
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              address: { type: 'object' }
            }
          },
          account: {
            type: 'object',
            required: ['password'],
            properties: {
              password: { type: 'string', minLength: 8 }
            }
          },
          children: {
            type: 'array',
            items: {
              type: 'object',
              required: ['firstName', 'lastName', 'dateOfBirth'],
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                dateOfBirth: { type: 'string', format: 'date' },
                gender: { type: 'string' },
                schoolName: { type: 'string' },
                medicalInfo: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, controller.completeRegistration.bind(controller));
}
