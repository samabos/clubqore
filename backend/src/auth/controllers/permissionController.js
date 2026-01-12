import { PermissionService } from '../services/permissionService.js';

/**
 * PermissionController - API handlers for managing resources and role permissions
 * Super Admin only endpoints
 */
export class PermissionController {
  constructor(db) {
    this.db = db;
    this.permissionService = new PermissionService(db);
  }

  // ===== RESOURCES =====

  /**
   * Get all resources
   * GET /api/auth/admin/resources
   */
  async getResources(request, reply) {
    try {
      const resources = await this.permissionService.getAllResources();
      reply.code(200).send({
        success: true,
        data: resources,
      });
    } catch (error) {
      request.log.error('Error fetching resources:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch resources',
      });
    }
  }

  /**
   * Get a single resource by ID
   * GET /api/auth/admin/resources/:id
   */
  async getResourceById(request, reply) {
    try {
      const id = parseInt(request.params.id);
      const resource = await this.permissionService.getResourceById(id);

      if (!resource) {
        return reply.code(404).send({
          success: false,
          message: 'Resource not found',
        });
      }

      reply.code(200).send({
        success: true,
        data: resource,
      });
    } catch (error) {
      request.log.error('Error fetching resource:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch resource',
      });
    }
  }

  /**
   * Create a new resource
   * POST /api/auth/admin/resources
   */
  async createResource(request, reply) {
    try {
      const data = request.body;

      // Validate required fields
      if (!data.name || !data.display_name || !data.type) {
        return reply.code(400).send({
          success: false,
          message: 'name, display_name, and type are required',
        });
      }

      // Validate type
      const validTypes = ['page', 'menu', 'feature', 'api'];
      if (!validTypes.includes(data.type)) {
        return reply.code(400).send({
          success: false,
          message: `type must be one of: ${validTypes.join(', ')}`,
        });
      }

      const resource = await this.permissionService.createResource(data);
      reply.code(201).send({
        success: true,
        data: resource,
      });
    } catch (error) {
      request.log.error('Error creating resource:', error);
      const status = error.message.includes('already exists') ? 409 : 400;
      reply.code(status).send({
        success: false,
        message: error.message || 'Failed to create resource',
      });
    }
  }

  /**
   * Update a resource
   * PUT /api/auth/admin/resources/:id
   */
  async updateResource(request, reply) {
    try {
      const id = parseInt(request.params.id);
      const data = request.body;

      // Validate type if provided
      if (data.type) {
        const validTypes = ['page', 'menu', 'feature', 'api'];
        if (!validTypes.includes(data.type)) {
          return reply.code(400).send({
            success: false,
            message: `type must be one of: ${validTypes.join(', ')}`,
          });
        }
      }

      const resource = await this.permissionService.updateResource(id, data);
      reply.code(200).send({
        success: true,
        data: resource,
      });
    } catch (error) {
      request.log.error('Error updating resource:', error);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('already exists') ? 409 : 400;
      reply.code(status).send({
        success: false,
        message: error.message || 'Failed to update resource',
      });
    }
  }

  /**
   * Delete a resource
   * DELETE /api/auth/admin/resources/:id
   */
  async deleteResource(request, reply) {
    try {
      const id = parseInt(request.params.id);
      await this.permissionService.deleteResource(id);
      reply.code(200).send({
        success: true,
        message: 'Resource deleted successfully',
      });
    } catch (error) {
      request.log.error('Error deleting resource:', error);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('Cannot delete') ? 409 : 400;
      reply.code(status).send({
        success: false,
        message: error.message || 'Failed to delete resource',
      });
    }
  }

  // ===== ROLES =====

  /**
   * Get all roles
   * GET /api/auth/admin/roles
   */
  async getRoles(request, reply) {
    try {
      const roles = await this.permissionService.getAllRoles();
      reply.code(200).send({
        success: true,
        data: roles,
      });
    } catch (error) {
      request.log.error('Error fetching roles:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch roles',
      });
    }
  }

  // ===== ROLE PERMISSIONS =====

  /**
   * Get permission matrix (all roles x all resources)
   * GET /api/auth/admin/permissions/matrix
   */
  async getPermissionMatrix(request, reply) {
    try {
      const matrix = await this.permissionService.getPermissionMatrix();
      reply.code(200).send({
        success: true,
        data: matrix,
      });
    } catch (error) {
      request.log.error('Error fetching permission matrix:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch permission matrix',
      });
    }
  }

  /**
   * Get permissions for a specific role
   * GET /api/auth/admin/roles/:roleId/permissions
   */
  async getRolePermissions(request, reply) {
    try {
      const roleId = parseInt(request.params.roleId);

      // Verify role exists
      const role = await this.permissionService.getRoleById(roleId);
      if (!role) {
        return reply.code(404).send({
          success: false,
          message: 'Role not found',
        });
      }

      const permissions = await this.permissionService.getRolePermissions(roleId);
      reply.code(200).send({
        success: true,
        data: {
          role,
          permissions,
        },
      });
    } catch (error) {
      request.log.error('Error fetching role permissions:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch role permissions',
      });
    }
  }

  /**
   * Update a single role-resource permission
   * PUT /api/auth/admin/roles/:roleId/permissions/:resourceId
   */
  async updateRolePermission(request, reply) {
    try {
      const roleId = parseInt(request.params.roleId);
      const resourceId = parseInt(request.params.resourceId);
      const permissions = request.body;

      const result = await this.permissionService.updateRolePermission(
        roleId,
        resourceId,
        permissions
      );

      reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      request.log.error('Error updating role permission:', error);
      const status = error.message.includes('not found') ? 404 : 400;
      reply.code(status).send({
        success: false,
        message: error.message || 'Failed to update role permission',
      });
    }
  }

  /**
   * Bulk update permissions for a role
   * PUT /api/auth/admin/roles/:roleId/permissions
   */
  async updateRolePermissions(request, reply) {
    try {
      const roleId = parseInt(request.params.roleId);
      const { permissions } = request.body;

      if (!Array.isArray(permissions)) {
        return reply.code(400).send({
          success: false,
          message: 'permissions must be an array',
        });
      }

      // Validate each permission has resource_id
      for (const perm of permissions) {
        if (!perm.resource_id) {
          return reply.code(400).send({
            success: false,
            message: 'Each permission must have a resource_id',
          });
        }
      }

      const results = await this.permissionService.bulkUpdateRolePermissions(
        roleId,
        permissions
      );

      reply.code(200).send({
        success: true,
        data: results,
        message: `Updated ${results.length} permissions`,
      });
    } catch (error) {
      request.log.error('Error updating role permissions:', error);
      const status = error.message.includes('not found') ? 404 : 400;
      reply.code(status).send({
        success: false,
        message: error.message || 'Failed to update role permissions',
      });
    }
  }

  /**
   * Delete a role permission
   * DELETE /api/auth/admin/roles/:roleId/permissions/:resourceId
   */
  async deleteRolePermission(request, reply) {
    try {
      const roleId = parseInt(request.params.roleId);
      const resourceId = parseInt(request.params.resourceId);

      await this.permissionService.deleteRolePermission(roleId, resourceId);
      reply.code(200).send({
        success: true,
        message: 'Role permission deleted successfully',
      });
    } catch (error) {
      request.log.error('Error deleting role permission:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to delete role permission',
      });
    }
  }
}
