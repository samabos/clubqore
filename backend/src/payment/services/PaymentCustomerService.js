/**
 * Payment Customer Service
 *
 * Manages payment customers across different payment providers.
 * Links users to their provider-specific customer records.
 */

import { PaymentProviderFactory } from './PaymentProviderFactory.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export class PaymentCustomerService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get or create a payment customer for a user
   *
   * @param {number} userId - User ID
   * @param {number} clubId - Club ID
   * @param {string} provider - Payment provider name
   * @param {Object} userData - User data for creating customer
   * @returns {Promise<Object>} Payment customer record
   */
  async getOrCreateCustomer(userId, clubId, provider, userData = {}) {
    // Check if customer already exists
    const customer = await this.db('payment_customers')
      .where({ user_id: userId, club_id: clubId, provider })
      .first();

    if (customer) {
      return this.formatCustomer(customer);
    }

    // Get user data if not provided
    if (!userData.email) {
      const user = await this.db('users')
        .join('user_profiles', 'users.id', 'user_profiles.user_id')
        .where('users.id', userId)
        .select('users.email', 'user_profiles.first_name', 'user_profiles.last_name')
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      userData = {
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        ...userData
      };
    }

    // Create customer in payment provider
    const providerInstance = PaymentProviderFactory.getProvider(provider);
    const providerCustomer = await providerInstance.createCustomer(userData);

    // Store in database
    const [newCustomer] = await this.db('payment_customers')
      .insert({
        user_id: userId,
        club_id: clubId,
        provider,
        provider_customer_id: providerCustomer.providerCustomerId,
        email: userData.email,
        given_name: userData.firstName,
        family_name: userData.lastName,
        metadata: userData.metadata ? encrypt(JSON.stringify(userData.metadata)) : null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return this.formatCustomer(newCustomer);
  }

  /**
   * Get a payment customer by ID
   *
   * @param {number} customerId - Payment customer ID
   * @returns {Promise<Object>} Payment customer
   */
  async getCustomer(customerId) {
    const customer = await this.db('payment_customers')
      .where({ id: customerId })
      .first();

    if (!customer) {
      throw new Error('Payment customer not found');
    }

    return this.formatCustomer(customer);
  }

  /**
   * Get payment customer for a user at a club
   *
   * @param {number} userId - User ID
   * @param {number} clubId - Club ID
   * @param {string} provider - Payment provider name
   * @returns {Promise<Object|null>} Payment customer or null
   */
  async getCustomerByUser(userId, clubId, provider) {
    const customer = await this.db('payment_customers')
      .where({ user_id: userId, club_id: clubId, provider })
      .first();

    return customer ? this.formatCustomer(customer) : null;
  }

  /**
   * Get all payment customers for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of payment customers
   */
  async getCustomersByUser(userId) {
    const customers = await this.db('payment_customers')
      .where({ user_id: userId });

    return customers.map(c => this.formatCustomer(c));
  }

  /**
   * Update payment customer
   *
   * @param {number} customerId - Payment customer ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated customer
   */
  async updateCustomer(customerId, updateData) {
    const customer = await this.db('payment_customers')
      .where({ id: customerId })
      .first();

    if (!customer) {
      throw new Error('Payment customer not found');
    }

    // Update in provider if email or name changed
    if (updateData.email || updateData.firstName || updateData.lastName) {
      const provider = PaymentProviderFactory.getProvider(customer.provider);
      await provider.updateCustomer(customer.provider_customer_id, updateData);
    }

    const updatePayload = { updated_at: new Date() };
    if (updateData.email) updatePayload.email = updateData.email;
    if (updateData.firstName) updatePayload.given_name = updateData.firstName;
    if (updateData.lastName) updatePayload.family_name = updateData.lastName;
    if (updateData.metadata) {
      updatePayload.metadata = encrypt(JSON.stringify(updateData.metadata));
    }

    const [updated] = await this.db('payment_customers')
      .where({ id: customerId })
      .update(updatePayload)
      .returning('*');

    return this.formatCustomer(updated);
  }

  /**
   * Format customer from database row
   * @private
   */
  formatCustomer(customer) {
    let metadata = null;
    if (customer.metadata) {
      try {
        metadata = JSON.parse(decrypt(customer.metadata));
      } catch {
        metadata = customer.metadata;
      }
    }

    return {
      id: customer.id,
      userId: customer.user_id,
      clubId: customer.club_id,
      provider: customer.provider,
      providerCustomerId: customer.provider_customer_id,
      email: customer.email,
      givenName: customer.given_name,
      familyName: customer.family_name,
      metadata,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };
  }
}

export default PaymentCustomerService;
