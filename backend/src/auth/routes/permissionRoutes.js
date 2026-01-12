import { requireRole } from '../permissionMiddleware.js';

/**
 * Permission Routes - Super Admin only endpoints for managing resources and role permissions
 */
export function permissionRoutes(fastify, permissionController, authenticate) {
  // Super admin role check for all permission routes
  const requireSuperAdmin = requireRole(['super_admin']);

  // ===== RESOURCES =====

  // Get all resources
  fastify.get('/auth/resources', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Get all resources (super admin only)',
      description: 'Fetch all resources/pages/features for permission management',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  display_name: { type: 'string' },
                  type: { type: 'string', enum: ['page', 'menu', 'feature', 'api'] },
                  path: { type: ['string', 'null'] },
                  parent_id: { type: ['integer', 'null'] },
                  icon: { type: ['string', 'null'] },
                  sort_order: { type: 'integer' },
                  is_active: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }, permissionController.getResources.bind(permissionController));

  // Get a single resource
  fastify.get('/auth/resources/:id', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Get a single resource by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      }
    }
  }, permissionController.getResourceById.bind(permissionController));

  // Create a resource
  fastify.post('/auth/resources', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Create a new resource',
      body: {
        type: 'object',
        required: ['name', 'display_name', 'type'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          display_name: { type: 'string', maxLength: 255 },
          type: { type: 'string', enum: ['page', 'menu', 'feature', 'api'] },
          path: { type: ['string', 'null'], maxLength: 255 },
          parent_id: { type: ['integer', 'null'] },
          icon: { type: ['string', 'null'], maxLength: 100 },
          sort_order: { type: 'integer', default: 0 },
          is_active: { type: 'boolean', default: true }
        }
      }
    }
  }, permissionController.createResource.bind(permissionController));

  // Update a resource
  fastify.put('/auth/resources/:id', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Update a resource',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 100 },
          display_name: { type: 'string', maxLength: 255 },
          type: { type: 'string', enum: ['page', 'menu', 'feature', 'api'] },
          path: { type: ['string', 'null'], maxLength: 255 },
          parent_id: { type: ['integer', 'null'] },
          icon: { type: ['string', 'null'], maxLength: 100 },
          sort_order: { type: 'integer' },
          is_active: { type: 'boolean' }
        }
      }
    }
  }, permissionController.updateResource.bind(permissionController));

  // Delete a resource
  fastify.delete('/auth/resources/:id', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Delete a resource',
      description: 'Delete a resource. Will fail if there are existing permissions or child resources.',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      }
    }
  }, permissionController.deleteResource.bind(permissionController));

  // ===== ROLES =====

  // Get all roles
  fastify.get('/auth/roles', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Get all roles',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  display_name: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  is_active: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }, permissionController.getRoles.bind(permissionController));

  // ===== PERMISSIONS =====

  // Get permission matrix (all roles x all resources)
  fastify.get('/auth/permissions/matrix', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Get full permission matrix',
      description: 'Returns all roles with their permissions for all resources'
    }
  }, permissionController.getPermissionMatrix.bind(permissionController));

  // Get permissions for a specific role
  fastify.get('/auth/roles/:roleId/permissions', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Get permissions for a role',
      params: {
        type: 'object',
        properties: {
          roleId: { type: 'integer' }
        },
        required: ['roleId']
      }
    }
  }, permissionController.getRolePermissions.bind(permissionController));

  // Update a single role-resource permission
  fastify.put('/auth/roles/:roleId/permissions/:resourceId', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Update a single role permission',
      params: {
        type: 'object',
        properties: {
          roleId: { type: 'integer' },
          resourceId: { type: 'integer' }
        },
        required: ['roleId', 'resourceId']
      },
      body: {
        type: 'object',
        properties: {
          can_view: { type: 'boolean' },
          can_create: { type: 'boolean' },
          can_edit: { type: 'boolean' },
          can_delete: { type: 'boolean' },
          is_active: { type: 'boolean' }
        }
      }
    }
  }, permissionController.updateRolePermission.bind(permissionController));

  // Bulk update permissions for a role
  fastify.put('/auth/roles/:roleId/permissions', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Bulk update role permissions',
      description: 'Update multiple resource permissions for a role at once',
      params: {
        type: 'object',
        properties: {
          roleId: { type: 'integer' }
        },
        required: ['roleId']
      },
      body: {
        type: 'object',
        required: ['permissions'],
        properties: {
          permissions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['resource_id'],
              properties: {
                resource_id: { type: 'integer' },
                can_view: { type: 'boolean' },
                can_create: { type: 'boolean' },
                can_edit: { type: 'boolean' },
                can_delete: { type: 'boolean' },
                is_active: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, permissionController.updateRolePermissions.bind(permissionController));

  // Delete a role permission
  fastify.delete('/auth/roles/:roleId/permissions/:resourceId', {
    preHandler: [authenticate, requireSuperAdmin],
    schema: {
      tags: ['Admin - Permissions'],
      summary: 'Delete a role permission',
      params: {
        type: 'object',
        properties: {
          roleId: { type: 'integer' },
          resourceId: { type: 'integer' }
        },
        required: ['roleId', 'resourceId']
      }
    }
  }, permissionController.deleteRolePermission.bind(permissionController));
}
