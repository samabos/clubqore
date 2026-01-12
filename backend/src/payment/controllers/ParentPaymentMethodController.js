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
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
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
      const status = error.statusCode || 500;
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
