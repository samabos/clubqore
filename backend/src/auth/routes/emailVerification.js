import { messageResponse, errorResponse } from '../schemas/authSchemas.js';

export function emailVerificationRoutes(fastify, controller, authenticate) {
  // Get /auth/is-email-available
  fastify.get('/auth/is-email-available/:email', {
    schema: {
      description: 'Check if email is available',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' }
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            available: { type: 'boolean' }
          }
        },
        400: errorResponse,
        401: errorResponse
      }
    },
    preHandler: authenticate
  }, controller.isEmailAvailable.bind(controller));

  // POST /auth/verify-email - Send email verification
  fastify.post('/auth/verify-email', {
    schema: {
      description: 'Send email verification link',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            description: 'Email to verify (optional, defaults to user\'s current email)'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            email: { type: 'string' }
          }
        },
        400: errorResponse,
        401: errorResponse
      }
    },
    preHandler: authenticate
  }, controller.sendEmailVerification.bind(controller));

  // POST /auth/verify-email/confirm - Confirm email verification
  fastify.post('/auth/verify-email/confirm', {
    schema: {
      description: 'Confirm email verification with token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: {
            type: 'string',
            description: 'Email verification token from email link'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                emailVerified: { type: 'boolean' }
              }
            }
          }
        },
        400: errorResponse,
        404: errorResponse
      }
    }
  }, controller.confirmEmailVerification.bind(controller));

  // POST /auth/resend-verification - Resend verification email (authenticated)
  fastify.post('/auth/resend-verification', {
    schema: {
      description: 'Resend email verification link',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email to resend verification to (optional, defaults to user\'s current email)'
          }
        },
        additionalProperties: false
      },
      response: {
        200: messageResponse,
        400: errorResponse,
        401: errorResponse,
        429: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            retryAfter: { type: 'integer' }
          }
        }
      }
    },
    preHandler: authenticate
  }, controller.resendEmailVerification.bind(controller));

  // POST /auth/resend-verification-public - Resend verification email (public, no auth required)
  fastify.post('/auth/resend-verification-public', {
    schema: {
      description: 'Resend email verification link (public - requires email)',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address to send verification to'
          }
        }
      },
      response: {
        200: messageResponse,
        400: errorResponse,
        429: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            retryAfter: { type: 'integer' }
          }
        }
      }
    },
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '5 minutes'
      }
    }
  }, controller.resendEmailVerificationPublic.bind(controller));
}
