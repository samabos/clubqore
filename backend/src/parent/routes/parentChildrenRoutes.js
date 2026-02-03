/**
 * Parent Children Routes
 * Routes for parents to view and manage their children's information
 */

export async function parentChildrenRoutes(fastify, options) {
  const { parentChildrenController, authenticate } = options;

  // Get all children with enriched data
  fastify.get('/', {
    preHandler: [authenticate],
    handler: (request, reply) => parentChildrenController.getChildren(request, reply)
  });

  // Create a new child
  fastify.post('/', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'dateOfBirth'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          position: { type: 'string', nullable: true },
          medicalInfo: { type: 'string', nullable: true },
          emergencyContact: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          address: { type: 'string', nullable: true }
        }
      }
    },
    handler: (request, reply) => parentChildrenController.createChild(request, reply)
  });

  // Get detailed information for a specific child
  fastify.get('/:childId', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          childId: { type: 'integer' }
        },
        required: ['childId']
      }
    },
    handler: (request, reply) => parentChildrenController.getChildDetails(request, reply)
  });

  // Update child information
  fastify.patch('/:childId', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          childId: { type: 'integer' }
        },
        required: ['childId']
      },
      body: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          position: { type: 'string' },
          medicalInfo: { type: 'string' },
          emergencyContact: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' }
        }
      }
    },
    handler: (request, reply) => parentChildrenController.updateChild(request, reply)
  });
}
