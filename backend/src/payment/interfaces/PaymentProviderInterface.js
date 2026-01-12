/**
 * Payment Provider Interface
 *
 * Abstract base class that defines the contract for all payment providers.
 * All payment provider implementations (GoCardless, Stripe, etc.) must extend
 * this class and implement all methods.
 *
 * This interface-based design allows:
 * - Easy addition of new payment providers
 * - Consistent API across different providers
 * - Provider-agnostic business logic in services
 */

export class PaymentProviderInterface {
  /**
   * Create a new payment provider instance
   *
   * @param {Object} config - Provider-specific configuration
   */
  constructor(config) {
    if (new.target === PaymentProviderInterface) {
      throw new Error('PaymentProviderInterface is abstract and cannot be instantiated directly');
    }
    this.config = config;
    this.providerName = 'abstract';
  }

  /**
   * Get the provider name
   *
   * @returns {string} The provider name (e.g., 'gocardless', 'stripe')
   */
  getProviderName() {
    return this.providerName;
  }

  // ==========================================
  // Customer Management
  // ==========================================

  /**
   * Create a customer in the payment provider
   *
   * @param {Object} customerData - Customer data
   * @param {string} customerData.email - Customer email
   * @param {string} customerData.firstName - Customer first name
   * @param {string} customerData.lastName - Customer last name
   * @param {string} customerData.phone - Customer phone (optional)
   * @param {Object} customerData.address - Customer address (optional)
   * @param {Object} customerData.metadata - Additional metadata (optional)
   * @returns {Promise<Object>} Created customer with provider_customer_id
   */
  async createCustomer(customerData) {
    throw new Error('createCustomer() must be implemented by provider');
  }

  /**
   * Get a customer from the payment provider
   *
   * @param {string} providerCustomerId - The provider's customer ID
   * @returns {Promise<Object>} Customer data
   */
  async getCustomer(providerCustomerId) {
    throw new Error('getCustomer() must be implemented by provider');
  }

  /**
   * Update a customer in the payment provider
   *
   * @param {string} providerCustomerId - The provider's customer ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated customer data
   */
  async updateCustomer(providerCustomerId, updateData) {
    throw new Error('updateCustomer() must be implemented by provider');
  }

  // ==========================================
  // Mandate / Payment Method Setup
  // ==========================================

  /**
   * Create a mandate setup flow (redirect-based)
   *
   * Used for setting up Direct Debit mandates via hosted flow.
   *
   * @param {string} providerCustomerId - The provider's customer ID
   * @param {Object} redirectUrls - Redirect URLs
   * @param {string} redirectUrls.success - URL to redirect on success
   * @param {string} redirectUrls.cancel - URL to redirect on cancel
   * @param {Object} options - Additional options (scheme, description, etc.)
   * @returns {Promise<Object>} Setup flow with redirect URL
   */
  async createMandateSetupFlow(providerCustomerId, redirectUrls, options = {}) {
    throw new Error('createMandateSetupFlow() must be implemented by provider');
  }

  /**
   * Complete a mandate setup flow
   *
   * Called after user completes the hosted flow and is redirected back.
   *
   * @param {string} flowId - The flow/session ID from the setup
   * @returns {Promise<Object>} Completed mandate data
   */
  async completeMandateSetup(flowId) {
    throw new Error('completeMandateSetup() must be implemented by provider');
  }

  /**
   * Get a mandate from the payment provider
   *
   * @param {string} providerMandateId - The provider's mandate ID
   * @returns {Promise<Object>} Mandate data
   */
  async getMandate(providerMandateId) {
    throw new Error('getMandate() must be implemented by provider');
  }

  /**
   * Cancel a mandate
   *
   * @param {string} providerMandateId - The provider's mandate ID
   * @returns {Promise<Object>} Cancelled mandate data
   */
  async cancelMandate(providerMandateId) {
    throw new Error('cancelMandate() must be implemented by provider');
  }

  /**
   * List all mandates for a customer
   *
   * @param {string} providerCustomerId - The provider's customer ID
   * @returns {Promise<Array>} List of mandates
   */
  async listMandates(providerCustomerId) {
    throw new Error('listMandates() must be implemented by provider');
  }

  // ==========================================
  // Payment Operations
  // ==========================================

  /**
   * Create a payment
   *
   * @param {string} providerMandateId - The provider's mandate ID
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.amount - Amount in smallest currency unit (pence)
   * @param {string} paymentData.currency - Currency code (default: GBP)
   * @param {string} paymentData.description - Payment description
   * @param {Date} paymentData.chargeDate - Desired charge date (optional)
   * @param {Object} paymentData.metadata - Additional metadata (optional)
   * @returns {Promise<Object>} Created payment with provider_payment_id
   */
  async createPayment(providerMandateId, paymentData) {
    throw new Error('createPayment() must be implemented by provider');
  }

  /**
   * Get a payment from the payment provider
   *
   * @param {string} providerPaymentId - The provider's payment ID
   * @returns {Promise<Object>} Payment data
   */
  async getPayment(providerPaymentId) {
    throw new Error('getPayment() must be implemented by provider');
  }

  /**
   * Cancel a pending payment
   *
   * @param {string} providerPaymentId - The provider's payment ID
   * @returns {Promise<Object>} Cancelled payment data
   */
  async cancelPayment(providerPaymentId) {
    throw new Error('cancelPayment() must be implemented by provider');
  }

  /**
   * Retry a failed payment
   *
   * @param {string} providerPaymentId - The provider's payment ID
   * @param {Object} options - Retry options
   * @returns {Promise<Object>} New payment data
   */
  async retryPayment(providerPaymentId, options = {}) {
    throw new Error('retryPayment() must be implemented by provider');
  }

  /**
   * List payments for a mandate
   *
   * @param {string} providerMandateId - The provider's mandate ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of payments
   */
  async listPayments(providerMandateId, filters = {}) {
    throw new Error('listPayments() must be implemented by provider');
  }

  // ==========================================
  // Refund Operations
  // ==========================================

  /**
   * Create a refund for a payment
   *
   * @param {string} providerPaymentId - The provider's payment ID
   * @param {Object} refundData - Refund data
   * @param {number} refundData.amount - Amount to refund (optional, defaults to full)
   * @param {Object} refundData.metadata - Additional metadata (optional)
   * @returns {Promise<Object>} Created refund
   */
  async createRefund(providerPaymentId, refundData = {}) {
    throw new Error('createRefund() must be implemented by provider');
  }

  // ==========================================
  // Webhook Handling
  // ==========================================

  /**
   * Verify a webhook signature
   *
   * @param {string} body - Raw request body
   * @param {string} signature - Signature header value
   * @returns {boolean} True if signature is valid
   */
  verifyWebhookSignature(body, signature) {
    throw new Error('verifyWebhookSignature() must be implemented by provider');
  }

  /**
   * Parse webhook payload into normalized events
   *
   * @param {Object} payload - Parsed webhook payload
   * @returns {Array<Object>} Array of normalized event objects
   */
  parseWebhookEvents(payload) {
    throw new Error('parseWebhookEvents() must be implemented by provider');
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  /**
   * Convert amount from decimal to provider's format
   *
   * Most providers use smallest currency unit (pence/cents)
   *
   * @param {number} amount - Amount in decimal (e.g., 10.50)
   * @param {string} currency - Currency code
   * @returns {number} Amount in smallest unit
   */
  formatAmount(amount, currency = 'GBP') {
    // Most currencies have 2 decimal places
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from provider's format to decimal
   *
   * @param {number} amount - Amount in smallest unit
   * @param {string} currency - Currency code
   * @returns {number} Amount in decimal
   */
  parseAmount(amount, currency = 'GBP') {
    return amount / 100;
  }

  /**
   * Map provider-specific status to normalized status
   *
   * @param {string} resourceType - Type of resource (mandate, payment)
   * @param {string} providerStatus - Provider's status value
   * @returns {string} Normalized status
   */
  normalizeStatus(resourceType, providerStatus) {
    throw new Error('normalizeStatus() must be implemented by provider');
  }

  /**
   * Check if the provider is in test/sandbox mode
   *
   * @returns {boolean} True if in test mode
   */
  isTestMode() {
    return this.config.environment !== 'live';
  }
}

export default PaymentProviderInterface;
