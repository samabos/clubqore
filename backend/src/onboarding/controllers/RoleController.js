import { RoleService } from '../services/RoleService.js';

export class RoleController {
  constructor(db) {
    this.roleService = new RoleService(db);
  }

  /**
   * Get all roles
   */
  async getAllRoles(req, res) {
    try {
      const roles = await this.roleService.getAllRoles();
      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Error getting all roles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get roles',
        error: error.message
      });
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const role = await this.roleService.getRoleById(id);
      
      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      console.error('Error getting role by ID:', error);
      if (error.message === 'Role not found') {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to get role',
        error: error.message
      });
    }
  }

  /**
   * Create new role
   */
  async createRole(req, res) {
    try {
      const role = await this.roleService.createRole(req.body);

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create role',
        error: error.message
      });
    }
  }

  /**
   * Update role
   */
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const role = await this.roleService.updateRole(id, req.body);

      res.json({
        success: true,
        message: 'Role updated successfully',
        data: role
      });
    } catch (error) {
      console.error('Error updating role:', error);
      if (error.message === 'Role not found') {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update role',
        error: error.message
      });
    }
  }

  /**
   * Delete role
   */
  async deleteRole(req, res) {
    try {
      const { id } = req.params;
      const result = await this.roleService.deleteRole(id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      if (error.message === 'Role not found') {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete role',
        error: error.message
      });
    }
  }
}
