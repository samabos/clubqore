import { RoleController } from '../controllers/RoleController.js';

export function roleRoutes(fastify, options) {
  const { authenticate } = options;
  const roleController = new RoleController(fastify.db);

  // Get all roles
  fastify.get('/', {
    preHandler: [authenticate],
    schema: {
      description: 'Get all roles',
      tags: ['roles']
    }
  }, async (request, reply) => {
    await roleController.getAllRoles(request, reply);
  });

  // Get role by ID
  fastify.get('/:id', {
    preHandler: [authenticate],
    schema: {
      description: 'Get role by ID',
      tags: ['roles']
    }
  }, async (request, reply) => {
    await roleController.getRoleById(request, reply);
  });

  // Create new role
  fastify.post('/', {
    preHandler: [authenticate],
    schema: {
      description: 'Create new role',
      tags: ['roles']
    }
  }, async (request, reply) => {
    await roleController.createRole(request, reply);
  });

  // Update role
  fastify.put('/:id', {
    preHandler: [authenticate],
    schema: {
      description: 'Update role',
      tags: ['roles']
    }
  }, async (request, reply) => {
    await roleController.updateRole(request, reply);
  });

  // Delete role
  fastify.delete('/:id', {
    preHandler: [authenticate],
    schema: {
      description: 'Delete role',
      tags: ['roles']
    }
  }, async (request, reply) => {
    await roleController.deleteRole(request, reply);
  });
}
