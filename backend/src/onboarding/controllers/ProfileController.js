import { OnboardingService } from '../services/index.js';

export class ProfileController {
  constructor(db) {
    this.onboardingService = new OnboardingService(db);
  }

  /**
   * PUT /api/profile
   * Update user profile
   */
  async updateUserProfile(request, reply) {
    try {
      const userId = request.user.id;
      const profileData = request.body;

      const result = await this.onboardingService.updateUserProfile(userId, profileData);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating user profile:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }

  /**
   * GET /api/profile/:userId?
   * Get user profile
   */
  async getUserProfile(request, reply) {
    try {
      const userId = request.params.userId || request.user.id;

      const result = await this.onboardingService.getUserProfile(userId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error getting user profile:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  }

  /**
   * PUT /api/profile/preferences
   * Update user preferences
   */
  async updateUserPreferences(request, reply) {
    try {
      const userId = request.user.id;
      const preferencesData = request.body;

      const result = await this.onboardingService.updateUserPreferences(userId, preferencesData);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating user preferences:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update preferences'
      });
    }
  }

  /**
   * GET /api/profile/preferences
   * Get user preferences
   */
  async getUserPreferences(request, reply) {
    try {
      const userId = request.user.id;

      const result = await this.onboardingService.getUserPreferences(userId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error getting user preferences:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to get user preferences'
      });
    }
  }

  /**
   * POST /api/profile/avatar
   * Upload and set user avatar (base64 data)
   */
  async uploadAvatar(request, reply) {
    try {
      const userId = request.user.id;
      const { avatarData } = request.body;

      if (!avatarData) {
        return reply.code(400).send({
          success: false,
          message: 'Avatar data is required'
        });
      }

      // Validate base64 data format
      if (!avatarData.startsWith('data:image/')) {
        return reply.code(400).send({
          success: false,
          message: 'Invalid avatar format. Expected base64 image data.'
        });
      }

      // Check file size (limit to 2MB for base64)
      const base64Size = (avatarData.length * 3) / 4;
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      if (base64Size > maxSize) {
        return reply.code(400).send({
          success: false,
          message: 'Avatar file too large. Maximum size is 2MB.'
        });
      }

      const result = await this.onboardingService.uploadAvatar(userId, avatarData);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error uploading avatar:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to upload avatar'
      });
    }
  }

  /**
   * GET /api/profile/children
   * Get user children (for parents)
   */
  async getUserChildren(request, reply) {
    try {
      const userId = request.user.id;

      const result = await this.onboardingService.getUserChildren(userId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error getting user children:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to get user children'
      });
    }
  }

  /**
   * POST /api/profile/children
   * Add child for parent user
   */
  async addUserChild(request, reply) {
    try {
      const userId = request.user.id;
      const childData = request.body;

      const result = await this.onboardingService.addUserChild(userId, childData);
      
      reply.code(201).send(result);
    } catch (error) {
      request.log.error('Error adding user child:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to add child'
      });
    }
  }
}
