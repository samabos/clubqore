import { OnboardingService } from '../services/index.js';

export class InviteController {
  constructor(db) {
    this.onboardingService = new OnboardingService(db);
  }

  /**
   * POST /api/invites/validate
   * Validate invite code
   */
  async validateInviteCode(request, reply) {
    try {
      const { code } = request.body;

      if (!code) {
        return reply.code(400).send({
          success: false,
          message: 'Invite code is required'
        });
      }

      const result = await this.onboardingService.validateInviteCode(code);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error validating invite code:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Invalid invite code'
      });
    }
  }

  /**
   * POST /api/invites/preview
   * Preview invite code without using it
   */
  async previewInviteCode(request, reply) {
    try {
      const { code } = request.body;
      const userId = request.user.id;

      if (!code) {
        return reply.code(400).send({
          success: false,
          message: 'Invite code is required'
        });
      }

      const result = await this.onboardingService.previewInviteCode(code, userId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error previewing invite code:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Invalid invite code'
      });
    }
  }
}
