import { OnboardingService } from '../services/index.js';

export class OnboardingController {
  constructor(db) {
    this.onboardingService = new OnboardingService(db);
  }

  /**
   * POST /api/onboarding/complete
   * Complete initial onboarding (first role)
   */
  async completeInitialOnboarding(request, reply) {
    try {
      const userId = request.user.id;
      const roleData = request.body;

      const result = await this.onboardingService.completeInitialOnboarding(userId, roleData);
      
      console.log('🔍 Controller - About to send result:', JSON.stringify(result, null, 2));
      console.log('🔍 Controller - result.user:', JSON.stringify(result.user, null, 2));
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error completing initial onboarding:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to complete onboarding'
      });
    }
  }

  /**
   * POST /api/onboarding/roles
   * Add additional role to existing user
   */
  async addUserRole(request, reply) {
    try {
      const userId = request.user.id;
      const roleData = request.body;

      const result = await this.onboardingService.addUserRole(userId, roleData);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error adding user role:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to add role'
      });
    }
  }

  /**
   * GET /api/onboarding/status
   * Get comprehensive user status
   */
  async getUserStatus(request, reply) {
    try {
      const userId = request.user.id;

      const result = await this.onboardingService.getUserStatus(userId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error getting user status:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to get user status'
      });
    }
  }

  /**
   * GET /api/onboarding/progress
   * Get detailed onboarding progress
   */
  async getOnboardingStatus(request, reply) {
    try {
      const userId = request.user.id;

      const result = await this.onboardingService.getOnboardingStatus(userId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error getting onboarding progress:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to get onboarding progress'
      });
    }
  }

  /**
   * PUT /api/onboarding/primary-role
   * Set primary role
   */
  async setPrimaryRole(request, reply) {
    try {
      const userId = request.user.id;
      const { role } = request.body;

      await this.onboardingService.setPrimaryRole(userId, role);

      reply.code(200).send({
        success: true,
        message: 'Primary role updated successfully'
      });
    } catch (error) {
      request.log.error('Error setting primary role:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to set primary role'
      });
    }
  }

  /**
   * DELETE /api/onboarding/roles/:role
   * Deactivate role
   */
  async deactivateRole(request, reply) {
    try {
      const userId = request.user.id;
      const { role } = request.params;
      const { clubId } = request.query;

      await this.onboardingService.deactivateRole(userId, role, clubId);

      reply.code(200).send({
        success: true,
        message: 'Role deactivated successfully'
      });
    } catch (error) {
      request.log.error('Error deactivating role:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to deactivate role'
      });
    }
  }

  /**
   * GET /api/onboarding/completion/:userId?
   * Get profile completion status
   */
  async getProfileCompletion(request, reply) {
    try {
      const userId = request.params.userId || request.user.id;

      const result = await this.onboardingService.getProfileCompletion(userId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error getting profile completion:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to get profile completion'
      });
    }
  }

  /**
   * POST /api/onboarding/completion/update
   * Update completion progress tracking
   */
  async updateCompletionProgress(request, reply) {
    try {
      const userId = request.user.id;
      const { step, role } = request.body;

      const result = await this.onboardingService.updateCompletionProgress(userId, step, role);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating completion progress:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update progress'
      });
    }
  }
}
