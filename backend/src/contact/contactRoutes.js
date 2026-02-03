/**
 * Contact Form Routes
 *
 * Handles public contact form submissions from the landing page.
 */

export function registerContactRoutes(fastify, options, done) {
  const db = fastify.db;

  /**
   * Submit contact form
   * POST /contact
   * Public endpoint - no authentication required
   */
  fastify.post('/contact', {
    schema: {
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'message'],
        properties: {
          firstName: { type: 'string', minLength: 1, maxLength: 100 },
          lastName: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email', maxLength: 255 },
          clubName: { type: 'string', maxLength: 255 },
          estimatedMembers: { type: 'integer', minimum: 1 },
          message: { type: 'string', minLength: 1 }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { firstName, lastName, email, clubName, estimatedMembers, message } = request.body;

      await db('contact_submissions').insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        club_name: clubName || null,
        estimated_members: estimatedMembers || null,
        message: message,
        status: 'new',
        created_at: new Date()
      });

      fastify.log.info(`New contact form submission from ${email}`);

      return reply.status(201).send({
        success: true,
        message: 'Thank you for your message. We will get back to you within 24 hours.'
      });
    } catch (error) {
      fastify.log.error('Contact form submission error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to submit contact form. Please try again later.'
      });
    }
  });

  done();
}

export default registerContactRoutes;
