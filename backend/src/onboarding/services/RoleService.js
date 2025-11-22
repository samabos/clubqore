export class RoleService {
  constructor(db) {
    this.db = db;
    this.roleCache = null;
    this.roleMapByName = null;
    this.roleMapById = null;
  }

  /**
   * Initialize and cache all roles from database
   */
  async initializeCache() {
    if (this.roleCache) return;

    const roles = await this.db('roles')
      .select('id', 'name', 'display_name', 'is_active')
      .where({ is_active: true });

    this.roleCache = roles;
    this.roleMapByName = {};
    this.roleMapById = {};

    roles.forEach(role => {
      this.roleMapByName[role.name] = role;
      this.roleMapById[role.id] = role;
    });
  }

  /**
   * Get role ID by role name
   * @param {string} roleName - Role name (e.g., 'club_manager')
   * @returns {Promise<number>} Role ID
   */
  async getRoleIdByName(roleName) {
    await this.initializeCache();

    const role = this.roleMapByName[roleName];
    if (!role) {
      throw new Error(`Role "${roleName}" not found`);
    }

    return role.id;
  }

  /**
   * Get role name by role ID
   * @param {number} roleId - Role ID
   * @returns {Promise<string>} Role name
   */
  async getRoleNameById(roleId) {
    await this.initializeCache();

    const role = this.roleMapById[roleId];
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }

    return role.name;
  }

  /**
   * Get complete role object by name
   * @param {string} roleName - Role name
   * @returns {Promise<Object>} Role object
   */
  async getRoleByName(roleName) {
    await this.initializeCache();

    const role = this.roleMapByName[roleName];
    if (!role) {
      throw new Error(`Role "${roleName}" not found`);
    }

    return role;
  }

  /**
   * Get multiple role IDs by names
   * @param {Array<string>} roleNames - Array of role names
   * @returns {Promise<Array<number>>} Array of role IDs
   */
  async getRoleIdsByNames(roleNames) {
    await this.initializeCache();

    return roleNames.map(name => {
      const role = this.roleMapByName[name];
      if (!role) {
        throw new Error(`Role "${name}" not found`);
      }
      return role.id;
    });
  }

  /**
   * Get multiple role names by IDs
   * @param {Array<number>} roleIds - Array of role IDs
   * @returns {Promise<Array<string>>} Array of role names
   */
  async getRoleNamesByIds(roleIds) {
    await this.initializeCache();

    return roleIds.map(id => {
      const role = this.roleMapById[id];
      if (!role) {
        throw new Error(`Role with ID ${id} not found`);
      }
      return role.name;
    });
  }

  /**
   * Check if a role exists
   * @param {string} roleName - Role name to check
   * @returns {Promise<boolean>} True if role exists
   */
  async roleExists(roleName) {
    await this.initializeCache();
    return !!this.roleMapByName[roleName];
  }

  /**
   * Clear the cache (useful for testing or when roles are updated)
   */
  clearCache() {
    this.roleCache = null;
    this.roleMapByName = null;
    this.roleMapById = null;
  }

  /**
   * Get all roles
   */
  async getAllRoles() {
    try {
      const roles = await this.db('roles')
        .select('*')
        .orderBy('name', 'asc');

      return roles;
    } catch (error) {
      console.error('Error getting all roles:', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId) {
    try {
      const role = await this.db('roles')
        .where({ id: roleId })
        .first();

      if (!role) {
        throw new Error('Role not found');
      }

      return role;
    } catch (error) {
      console.error('Error getting role by ID:', error);
      throw error;
    }
  }

  /**
   * Create new role
   */
  async createRole(roleData) {
    try {
      if (!roleData.name || !roleData.display_name) {
        throw new Error('Role name and display name are required');
      }

      const newRole = {
        name: roleData.name,
        display_name: roleData.display_name,
        description: roleData.description || null,
        is_active: roleData.is_active !== undefined ? roleData.is_active : true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [roleId] = await this.db('roles').insert(newRole);
      return await this.getRoleById(roleId);
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(roleId, updateData) {
    try {
      const existingRole = await this.db('roles')
        .where({ id: roleId })
        .first();

      if (!existingRole) {
        throw new Error('Role not found');
      }

      const updateFields = {
        updated_at: new Date()
      };

      if (updateData.name) updateFields.name = updateData.name;
      if (updateData.display_name) updateFields.display_name = updateData.display_name;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.is_active !== undefined) updateFields.is_active = updateData.is_active;

      await this.db('roles')
        .where({ id: roleId })
        .update(updateFields);

      return await this.getRoleById(roleId);
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(roleId) {
    try {
      const existingRole = await this.db('roles')
        .where({ id: roleId })
        .first();

      if (!existingRole) {
        throw new Error('Role not found');
      }

      await this.db('roles')
        .where({ id: roleId })
        .del();

      return { success: true, message: 'Role deleted successfully' };
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }
}
