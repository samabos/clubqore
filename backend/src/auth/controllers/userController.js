import { UserService } from '../services/userService.js';
import { AppError } from '../../errors/AppError.js';

export class UserController {
  constructor(db) {
    this.userService = new UserService(db);
  }

  async getProfile(request, reply) {
    try {
      const user = await this.userService.getUserById(request.user.id);
      return reply.send({ user });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ error: error.message });
      }
      request.log.error('Get profile error:', error);
      return reply.code(500).send({ error: 'An error occurred while retrieving profile' });
    }
  }

  async updateProfile(request, reply) {
    try {
      const updates = request.body;

      // Validate account type
      if (updates.accountType && !['member', 'parent', 'club'].includes(updates.accountType)) {
        return reply.code(400).send({ error: 'Invalid account type' });
      }

      const user = await this.userService.updateUser(request.user.id, updates);
      return reply.send({
        user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ error: error.message });
      }
      request.log.error('Update profile error:', error);
      return reply.code(500).send({ error: 'An error occurred while updating profile' });
    }
  }

  async deleteProfile(request, reply) {
    try {
      await this.userService.deleteUser(request.user.id);
      return reply.send({ message: 'User deleted successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ error: error.message });
      }
      request.log.error('Delete profile error:', error);
      return reply.code(500).send({ error: 'An error occurred while deleting profile' });
    }
  }

  // Role management methods
  async getUserRoles(request, reply) {
    try {
      const roles = await this.userService.getUserRoles(request.user.id);
      return reply.send(roles);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ error: error.message });
      }
      request.log.error('Get user roles error:', error);
      return reply.code(500).send({ error: 'An error occurred while retrieving user roles' });
    }
  }
}
