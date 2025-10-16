import { messageResponse, errorResponse } from '../schemas/authSchemas.js';

export function passwordResetRoutes(fastify, controller) {
  // POST /auth/forgot-password - Request password reset
  fastify.post('/auth/forgot-password', {
    schema: {
      description: 'Request password reset',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            description: 'Email address to send password reset link'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: errorResponse,
        404: errorResponse
      }
    }
  }, controller.forgotPassword.bind(controller));

  // POST /auth/reset-password - Reset password with token
  fastify.post('/auth/reset-password', {
    schema: {
      description: 'Reset password with token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: {
            type: 'string',
            description: 'Password reset token from email link'
          },
          password: {
            type: 'string',
            minLength: 6,
            description: 'New password'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: errorResponse,
        404: errorResponse
      }
    }
  }, controller.resetPassword.bind(controller));
}
