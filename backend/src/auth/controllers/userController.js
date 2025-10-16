import { UserService } from '../services/userService.js';

export class UserController {
  constructor(db) {
    this.userService = new UserService(db);
  }

  async getProfile(request, reply) {
    try {
      const user = await this.userService.getUserById(request.user.id);
      return reply.send({ user });
    } catch (error) {
      if (error.message === 'User not found') {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  }

  async updateProfile(request, reply) {
    try {
      const updates = request.body;
      
      // Validate role changes (basic validation - can be expanded)
      if (updates.primaryRole && !['member', 'parent', 'club_manager', 'admin'].includes(updates.primaryRole)) {
        return reply.code(400).send({ error: 'Invalid primary role' });
      }
      
      if (updates.accountType && !['member', 'parent', 'club'].includes(updates.accountType)) {
        return reply.code(400).send({ error: 'Invalid account type' });
      }

      const user = await this.userService.updateUser(request.user.id, updates);
      return reply.send({ 
        user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      if (error.message === 'Email already taken' || error.message === 'User not found') {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  }

  async deleteProfile(request, reply) {
    try {
      await this.userService.deleteUser(request.user.id);
      return reply.send({ message: 'User deleted successfully' });
    } catch (error) {
      if (error.message === 'User not found') {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  }

  // Role management methods
  async getUserRoles(request, reply) {
    try {
      const roles = await this.userService.getUserRoles(request.user.id);
      return reply.send(roles);
    } catch (error) {
      if (error.message === 'User not found') {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  }

  async updateUserRole(request, reply) {
    try {
      const { primaryRole } = request.body;
      const result = await this.userService.updateUserRole(request.user.id, primaryRole);
      
      return reply.send({
        message: 'Primary role updated successfully',
        user: result
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return reply.code(404).send({ error: error.message });
      }
      if (error.message.includes('not authorized') || error.message.includes('Invalid role')) {
        return reply.code(403).send({ error: error.message });
      }
      return reply.code(400).send({ error: error.message });
    }
  }

  async assignUserRole(request, reply) {
    try {
      const { userId, role } = request.body;
      
      // Check if current user is admin
      const currentUser = await this.userService.getUserById(request.user.id);
      if (!currentUser.roles.includes('admin') && currentUser.primaryRole !== 'admin') {
        return reply.code(403).send({ error: 'Only admins can assign roles to other users' });
      }
      
      const result = await this.userService.assignRoleToUser(userId, role);
      
      return reply.send({
        message: 'Role assigned successfully',
        user: result
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return reply.code(404).send({ error: error.message });
      }
      if (error.message.includes('not authorized') || error.message.includes('Invalid role')) {
        return reply.code(403).send({ error: error.message });
      }
      return reply.code(400).send({ error: error.message });
    }
  }
}
