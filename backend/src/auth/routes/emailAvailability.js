export function emailAvailabilityRoutes(fastify, controller) {
  // Public endpoint to check email availability
  fastify.get('/auth/email-available', {
    schema: {
      description: 'Check if an email is available for registration/member creation',
      tags: ['auth'],
      querystring: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' }
        },
        required: ['email']
      },
      response: {
        200: {
          type: 'object',
          properties: { available: { type: 'boolean' } }
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => controller.isEmailAvailable(request, reply));
}


