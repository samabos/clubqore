/**
 * Payment Mandate Service
 *
 * Manages Direct Debit mandates across different payment providers.
 * Handles mandate setup flows, status tracking, and cancellation.
 */

import { PaymentProviderFactory } from './PaymentProviderFactory.js';
import { PaymentCustomerService } from './PaymentCustomerService.js';
import { generateState, verifyState } from '../utils/encryption.js';
import { getConfig } from '../../config/index.js';

export class PaymentMandateService {
  constructor(db) {
    this.db = db;
    this.customerService = new PaymentCustomerService(db);
  }

  /**
   * Initiate mandate setup flow
   *
   * Creates a redirect URL for the user to complete mandate setup.
   *
   * @param {number} userId - User ID
   * @param {number} clubId - Club ID
   * @param {string} provider - Payment provider name
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Setup flow with redirect URL
   */
  async initiateSetupFlow(userId, clubId, provider, options = {}) {
    // Get or create payment customer
    const customer = await this.customerService.getOrCreateCustomer(userId, clubId, provider);

    // Get provider instance
    const providerInstance = PaymentProviderFactory.getProvider(provider);

    // Build redirect URLs
    const config = getConfig();
    const baseUrl = config.app?.frontendUrl || 'http://localhost:3001';

    // Create state token for CSRF protection
    const state = generateState({
      userId,
      clubId,
      provider,
      customerId: customer.id
    });

    const redirectUrls = {
      success: `${baseUrl}/billing/mandate/complete?state=${encodeURIComponent(state)}`,
      cancel: `${baseUrl}/billing/mandate/cancel?state=${encodeURIComponent(state)}`
    };

    // Create setup flow in provider
    const flow = await providerInstance.createMandateSetupFlow(
      customer.providerCustomerId,
      redirectUrls,
      options
    );

    // Store pending setup in database
    await this.db('payment_mandates').insert({
      payment_customer_id: customer.id,
      provider,
      provider_mandate_id: `pending_${flow.flowId}`, // Temporary ID until completed
      scheme: options.scheme || 'bacs',
      status: 'pending_setup',
      metadata: JSON.stringify({
        flowId: flow.flowId,
        setupInitiatedAt: new Date().toISOString()
      }),
      created_at: new Date(),
      updated_at: new Date()
    });

    return {
      authorisationUrl: flow.authorisationUrl,
      flowId: flow.flowId,
      expiresAt: flow.expiresAt,
      state
    };
  }

  /**
   * Complete mandate setup flow
   *
   * Called after user completes the hosted setup flow.
   *
   * @param {string} state - State token from redirect
   * @param {Object} queryParams - Query parameters from redirect
   * @returns {Promise<Object>} Completed mandate
   */
  async completeSetupFlow(state, queryParams = {}) {
    // Verify state token
    const stateData = verifyState(state);
    if (!stateData) {
      throw new Error('Invalid or expired setup session');
    }

    const { userId, clubId, provider, customerId } = stateData;

    // Get provider instance
    const providerInstance = PaymentProviderFactory.getProvider(provider);

    // Get the pending mandate record
    const pendingMandate = await this.db('payment_mandates')
      .where({ payment_customer_id: customerId, status: 'pending_setup' })
      .orderBy('created_at', 'desc')
      .first();

    if (!pendingMandate) {
      throw new Error('No pending mandate setup found');
    }

    const metadata = JSON.parse(pendingMandate.metadata || '{}');

    // Complete setup in provider
    const completedMandate = await providerInstance.completeMandateSetup(metadata.flowId);

    // Update mandate record
    const [mandate] = await this.db('payment_mandates')
      .where({ id: pendingMandate.id })
      .update({
        provider_mandate_id: completedMandate.providerMandateId,
        status: completedMandate.status,
        reference: completedMandate.reference,
        next_possible_charge_date: completedMandate.nextPossibleChargeDate,
        metadata: JSON.stringify({
          ...metadata,
          completedAt: new Date().toISOString()
        }),
        updated_at: new Date()
      })
      .returning('*');

    // Create payment method record
    await this.db('payment_methods').insert({
      user_id: userId,
      type: 'direct_debit',
      provider,
      payment_mandate_id: mandate.id,
      provider_payment_method_id: completedMandate.providerMandateId,
      is_default: true, // Set as default for now
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    return this.formatMandate(mandate);
  }

  /**
   * Get a mandate by ID
   *
   * @param {number} mandateId - Mandate ID
   * @returns {Promise<Object>} Mandate
   */
  async getMandate(mandateId) {
    const mandate = await this.db('payment_mandates')
      .where({ id: mandateId })
      .first();

    if (!mandate) {
      throw new Error('Mandate not found');
    }

    return this.formatMandate(mandate);
  }

  /**
   * Get a mandate by provider mandate ID
   *
   * @param {string} provider - Provider name
   * @param {string} providerMandateId - Provider's mandate ID
   * @returns {Promise<Object|null>} Mandate or null
   */
  async getMandateByProviderId(provider, providerMandateId) {
    const mandate = await this.db('payment_mandates')
      .where({ provider, provider_mandate_id: providerMandateId })
      .first();

    return mandate ? this.formatMandate(mandate) : null;
  }

  /**
   * Get all mandates for a user
   *
   * @param {number} userId - User ID
   * @param {string} provider - Optional provider filter
   * @returns {Promise<Array>} List of mandates
   */
  async getMandatesByUser(userId, provider = null) {
    const query = this.db('payment_mandates as pm')
      .join('payment_customers as pc', 'pm.payment_customer_id', 'pc.id')
      .where('pc.user_id', userId)
      .whereNot('pm.status', 'pending_setup')
      .select('pm.*');

    if (provider) {
      query.andWhere('pm.provider', provider);
    }

    const mandates = await query;
    return mandates.map(m => this.formatMandate(m));
  }

  /**
   * Get active mandates for a user at a club
   *
   * @param {number} userId - User ID
   * @param {number} clubId - Club ID
   * @returns {Promise<Array>} Active mandates
   */
  async getActiveMandates(userId, clubId) {
    const mandates = await this.db('payment_mandates as pm')
      .join('payment_customers as pc', 'pm.payment_customer_id', 'pc.id')
      .where({
        'pc.user_id': userId,
        'pc.club_id': clubId,
        'pm.status': 'active'
      })
      .select('pm.*');

    return mandates.map(m => this.formatMandate(m));
  }

  /**
   * Cancel a mandate
   *
   * @param {number} mandateId - Mandate ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object>} Cancelled mandate
   */
  async cancelMandate(mandateId, userId) {
    const mandate = await this.db('payment_mandates as pm')
      .join('payment_customers as pc', 'pm.payment_customer_id', 'pc.id')
      .where({ 'pm.id': mandateId, 'pc.user_id': userId })
      .select('pm.*')
      .first();

    if (!mandate) {
      throw new Error('Mandate not found');
    }

    if (mandate.status === 'cancelled') {
      return this.formatMandate(mandate);
    }

    // Cancel in provider
    const provider = PaymentProviderFactory.getProvider(mandate.provider);
    await provider.cancelMandate(mandate.provider_mandate_id);

    // Update local record
    const [updated] = await this.db('payment_mandates')
      .where({ id: mandateId })
      .update({
        status: 'cancelled',
        cancelled_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    // Update associated payment method
    await this.db('payment_methods')
      .where({ payment_mandate_id: mandateId })
      .update({
        status: 'revoked',
        updated_at: new Date()
      });

    return this.formatMandate(updated);
  }

  /**
   * Update mandate status from webhook
   *
   * @param {string} provider - Provider name
   * @param {string} providerMandateId - Provider's mandate ID
   * @param {string} newStatus - New status
   * @param {Object} additionalData - Additional data from webhook
   * @returns {Promise<Object|null>} Updated mandate or null
   */
  async updateMandateStatus(provider, providerMandateId, newStatus, additionalData = {}) {
    const mandate = await this.db('payment_mandates')
      .where({ provider, provider_mandate_id: providerMandateId })
      .first();

    if (!mandate) {
      return null;
    }

    const updatePayload = {
      status: newStatus,
      updated_at: new Date()
    };

    if (additionalData.reference) {
      updatePayload.reference = additionalData.reference;
    }

    if (additionalData.nextPossibleChargeDate) {
      updatePayload.next_possible_charge_date = additionalData.nextPossibleChargeDate;
    }

    if (newStatus === 'cancelled' || newStatus === 'failed' || newStatus === 'expired') {
      updatePayload.cancelled_at = new Date();

      // Also update payment method status
      await this.db('payment_methods')
        .where({ payment_mandate_id: mandate.id })
        .update({
          status: newStatus === 'cancelled' ? 'revoked' : 'expired',
          updated_at: new Date()
        });
    }

    const [updated] = await this.db('payment_mandates')
      .where({ id: mandate.id })
      .update(updatePayload)
      .returning('*');

    return this.formatMandate(updated);
  }

  /**
   * Sync mandate status from provider
   *
   * @param {number} mandateId - Mandate ID
   * @returns {Promise<Object>} Synced mandate
   */
  async syncMandate(mandateId) {
    const mandate = await this.db('payment_mandates')
      .where({ id: mandateId })
      .first();

    if (!mandate) {
      throw new Error('Mandate not found');
    }

    // Get current status from provider
    const provider = PaymentProviderFactory.getProvider(mandate.provider);
    const providerMandate = await provider.getMandate(mandate.provider_mandate_id);

    // Update local status if different
    if (providerMandate.status !== mandate.status) {
      return this.updateMandateStatus(
        mandate.provider,
        mandate.provider_mandate_id,
        providerMandate.status,
        {
          reference: providerMandate.reference,
          nextPossibleChargeDate: providerMandate.nextPossibleChargeDate
        }
      );
    }

    return this.formatMandate(mandate);
  }

  /**
   * Format mandate from database row
   * @private
   */
  formatMandate(mandate) {
    return {
      id: mandate.id,
      paymentCustomerId: mandate.payment_customer_id,
      provider: mandate.provider,
      providerMandateId: mandate.provider_mandate_id,
      scheme: mandate.scheme,
      status: mandate.status,
      reference: mandate.reference,
      nextPossibleChargeDate: mandate.next_possible_charge_date,
      cancelledAt: mandate.cancelled_at,
      createdAt: mandate.created_at,
      updatedAt: mandate.updated_at
    };
  }
}

export default PaymentMandateService;
