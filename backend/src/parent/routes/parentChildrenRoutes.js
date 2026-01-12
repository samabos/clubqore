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
}
