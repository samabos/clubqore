export class RoleService {
  constructor(db) {
    this.db = db;
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
