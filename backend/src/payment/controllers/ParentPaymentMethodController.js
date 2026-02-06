/**
 * Parent Payment Method Controller
 *
 * Handles HTTP requests for payment method management by parents.
 * Includes Direct Debit mandate setup and payment method management.
 */

import { PaymentMethodService } from '../services/PaymentMethodService.js';

export class ParentPaymentMethodController {
  constructor(db) {
    this.db = db;
    this.paymentMethodService = new PaymentMethodService(db);
  }

  /**
   * Get all payment methods for the authenticated parent
   *
   * GET /payment-methods
   */
  async getPaymentMethods(request, reply) {
    try {
      const userId = request.user.id;

      const summary = await this.paymentMethodService.getPaymentMethodsSummary(userId);

      return reply.send({
        success: true,
        data: summary
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get a single payment method
   *
   * GET /payment-methods/:paymentMethodId
   */
  async getPaymentMethod(request, reply) {
    try {
      const userId = request.user.id;
      const { paymentMethodId } = request.params;

      const method = await this.paymentMethodService.getPaymentMethod(paymentMethodId, userId);

      return reply.send({
        success: true,
        data: method
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Initiate Direct Debit mandate setup
   *
   * POST /payment-methods/mandate/setup
   */
  async initiateMandateSetup(request, reply) {
    try {
      const userId = request.user.id;
      const { clubId, provider = 'gocardless', scheme = 'bacs' } = request.body;

      if (!clubId) {
        return reply.status(400).send({
          success: false,
          error: 'clubId is required'
        });
      }

      const setupFlow = await this.paymentMethodService.initiateMandateSetup(
        userId,
        clubId,
        provider,
        { scheme }
      );

      return reply.send({
        success: true,
        data: {
          authorisationUrl: setupFlow.authorisationUrl,
          expiresAt: setupFlow.expiresAt
        }
      });
    } catch (error) {
      request.log.error('Mandate setup error:', error);

      // Determine appropriate status code
      let status = error.statusCode || 500;
      let message = error.message || 'Failed to initiate mandate setup';

      // Check for configuration errors
      if (message.includes('configuration error') || message.includes('access token')) {
        status = 503; // Service Unavailable
        message = 'Payment service is not properly configured. Please contact support.';
      }

      return reply.status(status).send({
        success: false,
        error: message
      });
    }
  }

  /**
   * Complete Direct Debit mandate setup (callback handler)
   *
   * GET /payment-methods/mandate/complete
   */
  async completeMandateSetup(request, reply) {
    try {
      const { state } = request.query;

      if (!state) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid callback - missing state parameter'
        });
      }

      const mandate = await this.paymentMethodService.completeMandateSetup(
        state,
        request.query
      );

      return reply.send({
        success: true,
        data: mandate,
        message: 'Direct Debit mandate setup completed successfully'
      });
    } catch (error) {
      console.error('Mandate completion error:', error.message);
      console.error('Stack:', error.stack);

      let status = error.statusCode || 500;
      let message = error.message || 'Failed to complete mandate setup';

      // Provide user-friendly messages for known errors
      if (message.includes('Invalid or expired')) {
        status = 400;
        message = 'Your setup session has expired. Please start the Direct Debit setup again.';
      } else if (message.includes('No pending mandate')) {
        status = 404;
        message = 'No pending setup found. Please start the Direct Debit setup again.';
      } else if (message.includes('not fulfilled')) {
        status = 400;
        message = 'The Direct Debit authorization was not completed. Please try again.';
      }

      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Set a payment method as default
   *
   * PUT /payment-methods/:paymentMethodId/default
   */
  async setDefaultPaymentMethod(request, reply) {
    try {
      const userId = request.user.id;
      const { paymentMethodId } = request.params;

      const method = await this.paymentMethodService.setDefaultPaymentMethod(
        paymentMethodId,
        userId
      );

      return reply.send({
        success: true,
        data: method
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Remove a payment method
   *
   * DELETE /payment-methods/:paymentMethodId
   */
  async removePaymentMethod(request, reply) {
    try {
      const userId = request.user.id;
      const { paymentMethodId } = request.params;

      const method = await this.paymentMethodService.removePaymentMethod(
        paymentMethodId,
        userId
      );

      return reply.send({
        success: true,
        data: method,
        message: 'Payment method removed successfully'
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }
}

export default ParentPaymentMethodController;
