/**
 * PermissionService - Business logic for managing resources and role permissions
 * Used by Super Admin to configure RBAC
 */
export class PermissionService {
  constructor(db) {
    this.db = db;
  }

  // ===== RESOURCES =====

  /**
   * Get all resources ordered by sort_order
   */
  async getAllResources() {
    return this.db('resources')
      .select('*')
      .orderBy('sort_order');
  }

  /**
   * Get a single resource by ID
   */
  async getResourceById(id) {
    return this.db('resources').where({ id }).first();
  }

  /**
   * Get a single resource by name
   */
  async getResourceByName(name) {
    return this.db('resources').where({ name }).first();
  }

  /**
   * Create a new resource
   */
  async createResource(data) {
    // Check for duplicate name
    const existing = await this.getResourceByName(data.name);
    if (existing) {
      throw new Error(`Resource with name '${data.name}' already exists`);
    }

    const [resource] = await this.db('resources')
      .insert({
        name: data.name,
        display_name: data.display_name,
        type: data.type,
        path: data.path || null,
        parent_id: data.parent_id || null,
        icon: data.icon || null,
        sort_order: data.sort_order || 0,
        is_active: data.is_active !== undefined ? data.is_active : true,
      })
      .returning('*');
    return resource;
  }

  /**
   * Update an existing resource
   */
  async updateResource(id, data) {
    // Check resource exists
    const existing = await this.getResourceById(id);
    if (!existing) {
      throw new Error('Resource not found');
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.getResourceByName(data.name);
      if (duplicate) {
        throw new Error(`Resource with name '${data.name}' already exists`);
      }
    }

    const updateData = {
      updated_at: this.db.fn.now(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.display_name !== undefined) updateData.display_name = data.display_name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.path !== undefined) updateData.path = data.path;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const [resource] = await this.db('resources')
      .where({ id })
      .update(updateData)
      .returning('*');
    return resource;
  }

  /**
   * Delete a resource (only if no permissions reference it)
   */
  async deleteResource(id) {
    // Check resource exists
    const existing = await this.getResourceById(id);
    if (!existing) {
      throw new Error('Resource not found');
    }

    // Check for role_permissions referencing this resource
    const permCount = await this.db('role_permissions')
      .where({ resource_id: id })
      .count('id as count')
      .first();

    if (parseInt(permCount.count) > 0) {
      throw new Error('Cannot delete resource with existing permissions. Remove permissions first.');
    }

    // Check for child resources
    const childCount = await this.db('resources')
      .where({ parent_id: id })
      .count('id as count')
      .first();

    if (parseInt(childCount.count) > 0) {
      throw new Error('Cannot delete resource with child resources. Delete children first.');
    }

    return this.db('resources').where({ id }).del();
  }

  // ===== ROLES =====

  /**
   * Get all roles
   */
  async getAllRoles() {
    return this.db('roles')
      .select('id', 'name', 'display_name', 'description', 'is_active')
      .orderBy('name');
  }

  /**
   * Get a single role by ID
   */
  async getRoleById(id) {
    return this.db('roles').where({ id }).first();
  }

  // ===== ROLE PERMISSIONS =====

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(roleId) {
    return this.db('role_permissions')
      .join('resources', 'role_permissions.resource_id', 'resources.id')
      .where('role_permissions.role_id', roleId)
      .select(
        'role_permissions.id',
        'role_permissions.role_id',
        'role_permissions.resource_id',
        'role_permissions.can_view',
        'role_permissions.can_create',
        'role_permissions.can_edit',
        'role_permissions.can_delete',
        'role_permissions.is_active',
        'resources.name as resource_name',
        'resources.display_name as resource_display_name',
        'resources.type as resource_type',
        'resources.path as resource_path',
        'resources.icon as resource_icon'
      )
      .orderBy('resources.sort_order');
  }

  /**
   * Get the full permission matrix (all roles x all resources)
   */
  async getPermissionMatrix() {
    const roles = await this.getAllRoles();
    const resources = await this.getAllResources();
    const permissions = await this.db('role_permissions').select('*');

    // Build matrix - for each role, map all resources with their permissions
    const matrix = roles.map(role => ({
      role,
      permissions: resources.map(resource => {
        const perm = permissions.find(
          p => p.role_id === role.id && p.resource_id === resource.id
        );
        return {
          resource_id: resource.id,
          resource_name: resource.name,
          resource_display_name: resource.display_name,
          resource_type: resource.type,
          can_view: perm?.can_view || false,
          can_create: perm?.can_create || false,
          can_edit: perm?.can_edit || false,
          can_delete: perm?.can_delete || false,
          is_active: perm?.is_active || false,
        };
      }),
    }));

    return { roles, resources, matrix };
  }

  /**
   * Update a single role-resource permission (upsert)
   */
  async updateRolePermission(roleId, resourceId, permissions) {
    // Validate role and resource exist
    const role = await this.getRoleById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    const resource = await this.getResourceById(resourceId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    // Check if permission already exists
    const existing = await this.db('role_permissions')
      .where({ role_id: roleId, resource_id: resourceId })
      .first();

    const permData = {
      can_view: permissions.can_view || false,
      can_create: permissions.can_create || false,
      can_edit: permissions.can_edit || false,
      can_delete: permissions.can_delete || false,
      is_active: permissions.is_active !== undefined ? permissions.is_active : true,
    };

    if (existing) {
      // Update existing
      const [updated] = await this.db('role_permissions')
        .where({ id: existing.id })
        .update({
          ...permData,
          updated_at: this.db.fn.now(),
        })
        .returning('*');
      return updated;
    } else {
      // Insert new
      const [created] = await this.db('role_permissions')
        .insert({
          role_id: roleId,
          resource_id: resourceId,
          ...permData,
        })
        .returning('*');
      return created;
    }
  }

  /**
   * Bulk update permissions for a role
   */
  async bulkUpdateRolePermissions(roleId, permissionsArray) {
    // Validate role exists
    const role = await this.getRoleById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Use transaction for atomic update
    return this.db.transaction(async trx => {
      const results = [];
      for (const perm of permissionsArray) {
        // Check if permission already exists
        const existing = await trx('role_permissions')
          .where({ role_id: roleId, resource_id: perm.resource_id })
          .first();

        const permData = {
          can_view: perm.can_view || false,
          can_create: perm.can_create || false,
          can_edit: perm.can_edit || false,
          can_delete: perm.can_delete || false,
          is_active: perm.is_active !== undefined ? perm.is_active : true,
        };

        if (existing) {
          const [updated] = await trx('role_permissions')
            .where({ id: existing.id })
            .update({
              ...permData,
              updated_at: trx.fn.now(),
            })
            .returning('*');
          results.push(updated);
        } else {
          const [created] = await trx('role_permissions')
            .insert({
              role_id: roleId,
              resource_id: perm.resource_id,
              ...permData,
            })
            .returning('*');
          results.push(created);
        }
      }
      return results;
    });
  }

  /**
   * Delete a role permission
   */
  async deleteRolePermission(roleId, resourceId) {
    return this.db('role_permissions')
      .where({ role_id: roleId, resource_id: resourceId })
      .del();
  }
}
