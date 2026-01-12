/**
 * Payment Method Service
 *
 * Manages stored payment methods for users (Direct Debit mandates, cards).
 */

import { PaymentMandateService } from './PaymentMandateService.js';

export class PaymentMethodService {
  constructor(db) {
    this.db = db;
    this.mandateService = new PaymentMandateService(db);
  }

  /**
   * Get all payment methods for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of payment methods
   */
  async getPaymentMethods(userId) {
    const methods = await this.db('payment_methods as pm')
      .leftJoin('payment_mandates as mand', 'pm.payment_mandate_id', 'mand.id')
      .where('pm.user_id', userId)
      .whereNot('pm.status', 'revoked')
      .select(
        'pm.*',
        'mand.scheme',
        'mand.reference',
        'mand.status as mandate_status'
      )
      .orderBy([
        { column: 'pm.is_default', order: 'desc' },
        { column: 'pm.created_at', order: 'desc' }
      ]);

    return methods.map(m => this.formatPaymentMethod(m));
  }

  /**
   * Get a payment method by ID
   *
   * @param {number} paymentMethodId - Payment method ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object>} Payment method
   */
  async getPaymentMethod(paymentMethodId, userId) {
    const method = await this.db('payment_methods as pm')
      .leftJoin('payment_mandates as mand', 'pm.payment_mandate_id', 'mand.id')
      .where({ 'pm.id': paymentMethodId, 'pm.user_id': userId })
      .select(
        'pm.*',
        'mand.scheme',
        'mand.reference',
        'mand.status as mandate_status'
      )
      .first();

    if (!method) {
      const error = new Error('Payment method not found');
      error.statusCode = 404;
      throw error;
    }

    return this.formatPaymentMethod(method);
  }

  /**
   * Get the default payment method for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Default payment method or null
   */
  async getDefaultPaymentMethod(userId) {
    const method = await this.db('payment_methods as pm')
      .leftJoin('payment_mandates as mand', 'pm.payment_mandate_id', 'mand.id')
      .where({ 'pm.user_id': userId, 'pm.is_default': true, 'pm.status': 'active' })
      .select(
        'pm.*',
        'mand.scheme',
        'mand.reference',
        'mand.status as mandate_status'
      )
      .first();

    return method ? this.formatPaymentMethod(method) : null;
  }

  /**
   * Set a payment method as default
   *
   * @param {number} paymentMethodId - Payment method ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated payment method
   */
  async setDefaultPaymentMethod(paymentMethodId, userId) {
    // Verify ownership
    const method = await this.db('payment_methods')
      .where({ id: paymentMethodId, user_id: userId })
      .first();

    if (!method) {
      const error = new Error('Payment method not found');
      error.statusCode = 404;
      throw error;
    }

    // Unset current default
    await this.db('payment_methods')
      .where({ user_id: userId, is_default: true })
      .update({ is_default: false, updated_at: new Date() });

    // Set new default
    const [updated] = await this.db('payment_methods')
      .where({ id: paymentMethodId })
      .update({ is_default: true, updated_at: new Date() })
      .returning('*');

    return this.formatPaymentMethod(updated);
  }

  /**
   * Remove a payment method
   *
   * @param {number} paymentMethodId - Payment method ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Removed payment method
   */
  async removePaymentMethod(paymentMethodId, userId) {
    // Verify ownership
    const method = await this.db('payment_methods')
      .where({ id: paymentMethodId, user_id: userId })
      .first();

    if (!method) {
      const error = new Error('Payment method not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if used by active subscriptions
    const activeSubscriptions = await this.db('subscriptions')
      .where({ payment_mandate_id: method.payment_mandate_id })
      .whereIn('status', ['active', 'paused'])
      .count('id as count')
      .first();

    if (parseInt(activeSubscriptions.count) > 0) {
      const error = new Error(
        'Cannot remove payment method with active subscriptions. ' +
        'Please cancel subscriptions first or set up a new payment method.'
      );
      error.statusCode = 400;
      throw error;
    }

    // Cancel mandate if it's a direct debit
    if (method.type === 'direct_debit' && method.payment_mandate_id) {
      try {
        await this.mandateService.cancelMandate(method.payment_mandate_id, userId);
      } catch (error) {
        // Log but don't fail - mandate might already be cancelled
        console.error('Error cancelling mandate:', error.message);
      }
    }

    // Remove payment method
    const [removed] = await this.db('payment_methods')
      .where({ id: paymentMethodId })
      .update({ status: 'revoked', updated_at: new Date() })
      .returning('*');

    // If was default, set another as default
    if (method.is_default) {
      const nextDefault = await this.db('payment_methods')
        .where({ user_id: userId, status: 'active' })
        .orderBy('created_at', 'desc')
        .first();

      if (nextDefault) {
        await this.db('payment_methods')
          .where({ id: nextDefault.id })
          .update({ is_default: true, updated_at: new Date() });
      }
    }

    return this.formatPaymentMethod(removed);
  }

  /**
   * Initiate mandate setup (delegates to MandateService)
   *
   * @param {number} userId - User ID
   * @param {number} clubId - Club ID
   * @param {string} provider - Payment provider
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Setup flow with redirect URL
   */
  async initiateMandateSetup(userId, clubId, provider, options = {}) {
    return this.mandateService.initiateSetupFlow(userId, clubId, provider, options);
  }

  /**
   * Complete mandate setup (delegates to MandateService)
   *
   * @param {string} state - State token
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<Object>} Completed mandate
   */
  async completeMandateSetup(state, queryParams = {}) {
    return this.mandateService.completeSetupFlow(state, queryParams);
  }

  /**
   * Get payment methods summary
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Summary of payment methods
   */
  async getPaymentMethodsSummary(userId) {
    const methods = await this.getPaymentMethods(userId);

    const directDebits = methods.filter(m => m.type === 'direct_debit');
    const cards = methods.filter(m => m.type === 'card');
    const defaultMethod = methods.find(m => m.isDefault);

    return {
      total: methods.length,
      directDebits: directDebits.length,
      cards: cards.length,
      hasDefault: !!defaultMethod,
      defaultMethod: defaultMethod || null,
      methods
    };
  }

  /**
   * Format payment method from database row
   * @private
   */
  formatPaymentMethod(method) {
    const formatted = {
      id: method.id,
      userId: method.user_id,
      type: method.type,
      provider: method.provider,
      isDefault: method.is_default,
      status: method.status,
      createdAt: method.created_at,
      updatedAt: method.updated_at
    };

    if (method.type === 'card') {
      formatted.card = {
        brand: method.card_brand,
        last4: method.card_last4,
        expMonth: method.card_exp_month,
        expYear: method.card_exp_year
      };
    }

    if (method.type === 'direct_debit') {
      formatted.directDebit = {
        mandateId: method.payment_mandate_id,
        scheme: method.scheme,
        reference: method.reference,
        mandateStatus: method.mandate_status
      };
    }

    return formatted;
  }
}

export default PaymentMethodService;
