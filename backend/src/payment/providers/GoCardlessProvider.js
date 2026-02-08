/**
 * GoCardless Payment Provider Implementation
 *
 * Implements the PaymentProviderInterface for GoCardless Direct Debit payments.
 * Supports BACS (UK), SEPA (EU), and other Direct Debit schemes.
 *
 * GoCardless API Documentation: https://developer.gocardless.com/
 */

import { PaymentProviderInterface } from '../interfaces/PaymentProviderInterface.js';
import { verifyGoCardlessSignature, parseWebhookEvents } from '../utils/webhookValidator.js';

// GoCardless status mappings
const MANDATE_STATUS_MAP = {
  'pending_customer_approval': 'pending',
  'pending_submission': 'pending',
  'submitted': 'submitted',
  'active': 'active',
  'cancelled': 'cancelled',
  'failed': 'failed',
  'expired': 'expired'
};

const PAYMENT_STATUS_MAP = {
  'pending_customer_approval': 'pending',
  'pending_submission': 'pending',
  'submitted': 'submitted',
  'confirmed': 'confirmed',
  'paid_out': 'paid_out',
  'cancelled': 'cancelled',
  'customer_approval_denied': 'failed',
  'failed': 'failed',
  'charged_back': 'charged_back'
};

const SUBSCRIPTION_STATUS_MAP = {
  'pending_customer_approval': 'pending',
  'customer_approval_denied': 'cancelled',
  'active': 'active',
  'finished': 'finished',
  'cancelled': 'cancelled',
  'paused': 'paused'
};

export class GoCardlessProvider extends PaymentProviderInterface {
  /**
   * Create a new GoCardless provider instance
   *
   * @param {Object} config - Configuration options
   * @param {string} config.accessToken - GoCardless API access token
   * @param {string} config.environment - 'sandbox' or 'live'
   * @param {string} config.webhookSecret - Webhook signing secret
   */
  constructor(config) {
    super(config);
    this.providerName = 'gocardless';

    if (!config.accessToken) {
      throw new Error('GoCardless access token is required. Please set GOCARDLESS_ACCESS_TOKEN in your environment.');
    }

    this.accessToken = config.accessToken;
    this.environment = config.environment || 'sandbox';
    this.webhookSecret = config.webhookSecret;

    // Validate token matches environment
    const tokenPrefix = this.accessToken.split('_')[0];
    if (this.environment === 'sandbox' && tokenPrefix === 'live') {
      throw new Error(
        'GoCardless configuration error: You are using a LIVE access token with SANDBOX environment. ' +
        'Either change GOCARDLESS_ENVIRONMENT to "live" or use a sandbox access token.'
      );
    }
    if (this.environment === 'live' && tokenPrefix === 'sandbox') {
      throw new Error(
        'GoCardless configuration error: You are using a SANDBOX access token with LIVE environment. ' +
        'Either change GOCARDLESS_ENVIRONMENT to "sandbox" or use a live access token.'
      );
    }

    // Set API base URL based on environment
    this.baseUrl = this.environment === 'live'
      ? 'https://api.gocardless.com'
      : 'https://api-sandbox.gocardless.com';
  }

  /**
   * Make an API request to GoCardless
   *
   * @private
   */
  async _request(method, path, data = null) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'GoCardless-Version': '2015-07-06',
      'Content-Type': 'application/json'
    };

    const options = {
      method,
      headers
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      // Log the full error response for debugging
      console.error('[GoCardless API Error]', {
        method,
        path,
        statusCode: response.status,
        statusText: response.statusText,
        requestData: data,
        responseData,
        errorType: responseData.error?.type,
        errorMessage: responseData.error?.message,
        errorDetails: responseData.error?.errors,
        errorDocumentationUrl: responseData.error?.documentation_url,
        errorRequestId: responseData.error?.request_id
      });

      let message = responseData.error?.message || 'GoCardless API error';

      // Provide helpful messages for common errors
      if (response.status === 401) {
        message = 'GoCardless authentication failed. Please check your access token is valid and matches the environment (sandbox/live).';
      } else if (response.status === 403) {
        message = 'GoCardless access denied. Your access token may not have permission for this operation.';
      } else if (response.status === 404) {
        message = 'GoCardless resource not found. The requested customer, mandate, or payment does not exist.';
      } else if (response.status === 422) {
        const details = responseData.error?.errors?.map(e => `${e.field}: ${e.message}`).join('; ');
        message = `GoCardless validation error: ${details || message}`;
      } else if (response.status === 409) {
        const details = responseData.error?.errors?.map(e => e.message).join(', ');
        message = `GoCardless conflict: ${details || message}`;
      }

      const error = new Error(message);
      error.code = responseData.error?.type;
      error.type = responseData.error?.type;
      error.details = responseData.error?.errors;
      error.errors = responseData.error?.errors;
      error.statusCode = response.status;
      error.requestId = responseData.error?.request_id;
      error.response = { status: response.status, data: responseData };
      throw error;
    }

    return responseData;
  }

  // ==========================================
  // Customer Management
  // ==========================================

  async createCustomer(customerData) {
    const payload = {
      customers: {
        email: customerData.email,
        given_name: customerData.firstName,
        family_name: customerData.lastName,
        metadata: customerData.metadata || {}
      }
    };

    if (customerData.phone) {
      payload.customers.phone_number = customerData.phone;
    }

    if (customerData.address) {
      payload.customers.address_line1 = customerData.address.line1;
      payload.customers.address_line2 = customerData.address.line2;
      payload.customers.city = customerData.address.city;
      payload.customers.postal_code = customerData.address.postalCode;
      payload.customers.country_code = customerData.address.countryCode || 'GB';
    }

    const response = await this._request('POST', '/customers', payload);

    return {
      providerCustomerId: response.customers.id,
      email: response.customers.email,
      givenName: response.customers.given_name,
      familyName: response.customers.family_name,
      createdAt: response.customers.created_at,
      raw: response.customers
    };
  }

  async getCustomer(providerCustomerId) {
    const response = await this._request('GET', `/customers/${providerCustomerId}`);

    return {
      providerCustomerId: response.customers.id,
      email: response.customers.email,
      givenName: response.customers.given_name,
      familyName: response.customers.family_name,
      createdAt: response.customers.created_at,
      raw: response.customers
    };
  }

  async updateCustomer(providerCustomerId, updateData) {
    const payload = { customers: {} };

    if (updateData.email) payload.customers.email = updateData.email;
    if (updateData.firstName) payload.customers.given_name = updateData.firstName;
    if (updateData.lastName) payload.customers.family_name = updateData.lastName;
    if (updateData.phone) payload.customers.phone_number = updateData.phone;
    if (updateData.metadata) payload.customers.metadata = updateData.metadata;

    const response = await this._request('PUT', `/customers/${providerCustomerId}`, payload);

    return {
      providerCustomerId: response.customers.id,
      email: response.customers.email,
      givenName: response.customers.given_name,
      familyName: response.customers.family_name,
      raw: response.customers
    };
  }

  // ==========================================
  // Mandate / Payment Method Setup
  // ==========================================

  async createMandateSetupFlow(providerCustomerId, redirectUrls, options = {}) {
    // Use Billing Request Flow for modern mandate setup
    const payload = {
      billing_request_flows: {
        redirect_uri: redirectUrls.success,
        exit_uri: redirectUrls.cancel,
        links: {
          billing_request: null // Will be set after creating billing request
        }
      }
    };

    // First, create a billing request
    const billingRequestPayload = {
      billing_requests: {
        mandate_request: {
          scheme: options.scheme || 'bacs',
          currency: options.currency || 'GBP',
          verify: options.verify || 'when_available'
        },
        links: {
          customer: providerCustomerId
        },
        metadata: options.metadata || {}
      }
    };

    if (options.description) {
      billingRequestPayload.billing_requests.mandate_request.description = options.description;
    }

    const billingRequest = await this._request('POST', '/billing_requests', billingRequestPayload);

    // Now create the flow
    payload.billing_request_flows.links.billing_request = billingRequest.billing_requests.id;

    if (options.lockCustomerDetails !== undefined) {
      payload.billing_request_flows.lock_customer_details = options.lockCustomerDetails;
    }

    if (options.lockBankAccount !== undefined) {
      payload.billing_request_flows.lock_bank_account = options.lockBankAccount;
    }

    const flowResponse = await this._request('POST', '/billing_request_flows', payload);

    return {
      flowId: billingRequest.billing_requests.id,
      authorisationUrl: flowResponse.billing_request_flows.authorisation_url,
      expiresAt: flowResponse.billing_request_flows.expires_at,
      raw: {
        billingRequest: billingRequest.billing_requests,
        flow: flowResponse.billing_request_flows
      }
    };
  }

  async completeMandateSetup(flowId) {
    // Get the billing request to check its status
    const response = await this._request('GET', `/billing_requests/${flowId}`);
    const billingRequest = response.billing_requests;

    console.log('Billing request status:', billingRequest.status, 'links:', billingRequest.links);

    // Check for terminal failure states
    if (billingRequest.status === 'cancelled') {
      throw new Error('The Direct Debit setup was cancelled.');
    }

    if (billingRequest.status === 'failed') {
      throw new Error('The Direct Debit setup failed. Please try again.');
    }

    // For pending states, the mandate might still be created
    if (billingRequest.status !== 'fulfilled' && billingRequest.status !== 'pending') {
      throw new Error(`Billing request not fulfilled. Status: ${billingRequest.status}`);
    }

    // Get the created mandate - check multiple possible link names
    const mandateId = billingRequest.links?.mandate_request_mandate ||
                      billingRequest.links?.mandate ||
                      billingRequest.mandate_request?.links?.mandate;

    if (!mandateId) {
      // If no mandate yet but status is pending, it might still be processing
      if (billingRequest.status === 'pending') {
        throw new Error('Your Direct Debit is still being processed. Please check back in a few minutes.');
      }
      throw new Error('No mandate was created. Please try the setup again.');
    }

    const mandate = await this.getMandate(mandateId);

    return {
      providerMandateId: mandate.providerMandateId,
      status: mandate.status,
      scheme: mandate.scheme,
      reference: mandate.reference,
      nextPossibleChargeDate: mandate.nextPossibleChargeDate,
      raw: mandate.raw
    };
  }

  async getMandate(providerMandateId) {
    const response = await this._request('GET', `/mandates/${providerMandateId}`);

    return {
      providerMandateId: response.mandates.id,
      providerCustomerId: response.mandates.links?.customer,
      scheme: response.mandates.scheme,
      status: this.normalizeStatus('mandate', response.mandates.status),
      reference: response.mandates.reference,
      nextPossibleChargeDate: response.mandates.next_possible_charge_date,
      createdAt: response.mandates.created_at,
      raw: response.mandates
    };
  }

  async cancelMandate(providerMandateId) {
    const response = await this._request('POST', `/mandates/${providerMandateId}/actions/cancel`);

    return {
      providerMandateId: response.mandates.id,
      status: this.normalizeStatus('mandate', response.mandates.status),
      raw: response.mandates
    };
  }

  async listMandates(providerCustomerId) {
    const response = await this._request('GET', `/mandates?customer=${providerCustomerId}`);

    return (response.mandates || []).map(mandate => ({
      providerMandateId: mandate.id,
      scheme: mandate.scheme,
      status: this.normalizeStatus('mandate', mandate.status),
      reference: mandate.reference,
      nextPossibleChargeDate: mandate.next_possible_charge_date,
      createdAt: mandate.created_at,
      raw: mandate
    }));
  }

  // ==========================================
  // Payment Operations
  // ==========================================

  async createPayment(providerMandateId, paymentData) {
    const payload = {
      payments: {
        amount: this.formatAmount(paymentData.amount, paymentData.currency),
        currency: paymentData.currency || 'GBP',
        links: {
          mandate: providerMandateId
        },
        metadata: paymentData.metadata || {}
      }
    };

    if (paymentData.description) {
      payload.payments.description = paymentData.description;
    }

    if (paymentData.chargeDate) {
      // Format as YYYY-MM-DD
      const date = new Date(paymentData.chargeDate);
      payload.payments.charge_date = date.toISOString().split('T')[0];
    }

    if (paymentData.reference) {
      payload.payments.reference = paymentData.reference;
    }

    // Idempotency key for safe retries
    const headers = {};
    if (paymentData.idempotencyKey) {
      headers['Idempotency-Key'] = paymentData.idempotencyKey;
    }

    const response = await this._request('POST', '/payments', payload);

    return {
      providerPaymentId: response.payments.id,
      providerMandateId: response.payments.links?.mandate,
      amount: this.parseAmount(response.payments.amount, response.payments.currency),
      currency: response.payments.currency,
      status: this.normalizeStatus('payment', response.payments.status),
      chargeDate: response.payments.charge_date,
      description: response.payments.description,
      createdAt: response.payments.created_at,
      raw: response.payments
    };
  }

  async getPayment(providerPaymentId) {
    const response = await this._request('GET', `/payments/${providerPaymentId}`);

    return {
      providerPaymentId: response.payments.id,
      providerMandateId: response.payments.links?.mandate,
      amount: this.parseAmount(response.payments.amount, response.payments.currency),
      currency: response.payments.currency,
      status: this.normalizeStatus('payment', response.payments.status),
      chargeDate: response.payments.charge_date,
      description: response.payments.description,
      createdAt: response.payments.created_at,
      raw: response.payments
    };
  }

  async cancelPayment(providerPaymentId) {
    const response = await this._request('POST', `/payments/${providerPaymentId}/actions/cancel`);

    return {
      providerPaymentId: response.payments.id,
      status: this.normalizeStatus('payment', response.payments.status),
      raw: response.payments
    };
  }

  async retryPayment(providerPaymentId, options = {}) {
    const response = await this._request('POST', `/payments/${providerPaymentId}/actions/retry`, {
      data: {
        charge_date: options.chargeDate,
        metadata: options.metadata
      }
    });

    return {
      providerPaymentId: response.payments.id,
      status: this.normalizeStatus('payment', response.payments.status),
      chargeDate: response.payments.charge_date,
      raw: response.payments
    };
  }

  async listPayments(providerMandateId, filters = {}) {
    let path = `/payments?mandate=${providerMandateId}`;

    if (filters.status) {
      path += `&status=${filters.status}`;
    }
    if (filters.limit) {
      path += `&limit=${filters.limit}`;
    }

    const response = await this._request('GET', path);

    return (response.payments || []).map(payment => ({
      providerPaymentId: payment.id,
      amount: this.parseAmount(payment.amount, payment.currency),
      currency: payment.currency,
      status: this.normalizeStatus('payment', payment.status),
      chargeDate: payment.charge_date,
      description: payment.description,
      createdAt: payment.created_at,
      raw: payment
    }));
  }

  // ==========================================
  // Refund Operations
  // ==========================================

  async createRefund(providerPaymentId, refundData = {}) {
    const payload = {
      refunds: {
        links: {
          payment: providerPaymentId
        },
        metadata: refundData.metadata || {}
      }
    };

    // If amount specified, it's a partial refund
    if (refundData.amount) {
      payload.refunds.amount = this.formatAmount(refundData.amount);
    }

    if (refundData.reference) {
      payload.refunds.reference = refundData.reference;
    }

    const response = await this._request('POST', '/refunds', payload);

    return {
      providerRefundId: response.refunds.id,
      providerPaymentId: response.refunds.links?.payment,
      amount: this.parseAmount(response.refunds.amount, response.refunds.currency),
      currency: response.refunds.currency,
      createdAt: response.refunds.created_at,
      raw: response.refunds
    };
  }

  // ==========================================
  // Subscription Operations (Recurring Payments)
  // ==========================================

  /**
   * Create a subscription for recurring payments
   * GoCardless will automatically create payments on the schedule
   *
   * @param {string} providerMandateId - The mandate to charge
   * @param {Object} subscriptionData - Subscription details
   * @param {number} subscriptionData.amount - Amount in currency units (e.g., 25.00 for £25)
   * @param {string} subscriptionData.currency - Currency code (default: GBP)
   * @param {string} subscriptionData.intervalUnit - weekly, monthly, or yearly
   * @param {number} subscriptionData.interval - Interval multiplier (e.g., 2 for every 2 months)
   * @param {number} subscriptionData.dayOfMonth - Day of month to charge (1-28 or -1 for last)
   * @param {string} subscriptionData.startDate - When to start (YYYY-MM-DD)
   * @param {number} subscriptionData.count - Number of payments (optional, for fixed term)
   * @param {string} subscriptionData.name - Name for the subscription
   * @param {Object} subscriptionData.metadata - Custom metadata
   */
  async createSubscription(providerMandateId, subscriptionData) {
    const payload = {
      subscriptions: {
        amount: this.formatAmount(subscriptionData.amount, subscriptionData.currency),
        currency: subscriptionData.currency || 'GBP',
        interval_unit: subscriptionData.intervalUnit || 'monthly',
        links: {
          mandate: providerMandateId
        },
        metadata: subscriptionData.metadata || {}
      }
    };

    // Interval (e.g., 2 for every 2 months)
    if (subscriptionData.interval) {
      payload.subscriptions.interval = subscriptionData.interval;
    }

    // Day of month (1-28 or -1 for last day)
    // Note: For yearly subscriptions, GoCardless requires BOTH month AND day_of_month,
    // or neither. Since we typically only have day_of_month, we skip it for yearly.
    const intervalUnit = subscriptionData.intervalUnit || 'monthly';
    if (subscriptionData.dayOfMonth && intervalUnit !== 'yearly') {
      payload.subscriptions.day_of_month = subscriptionData.dayOfMonth;
    }

    // For yearly subscriptions, if we have both month and day_of_month, include them
    if (intervalUnit === 'yearly' && subscriptionData.month && subscriptionData.dayOfMonth) {
      payload.subscriptions.month = subscriptionData.month;
      payload.subscriptions.day_of_month = subscriptionData.dayOfMonth;
    }

    // Start date
    if (subscriptionData.startDate) {
      const date = new Date(subscriptionData.startDate);
      payload.subscriptions.start_date = date.toISOString().split('T')[0];
    }

    // Fixed number of payments (optional)
    if (subscriptionData.count) {
      payload.subscriptions.count = subscriptionData.count;
    }

    // Subscription name
    if (subscriptionData.name) {
      payload.subscriptions.name = subscriptionData.name;
    }

    const response = await this._request('POST', '/subscriptions', payload);

    return {
      providerSubscriptionId: response.subscriptions.id,
      providerMandateId: response.subscriptions.links?.mandate,
      amount: this.parseAmount(response.subscriptions.amount, response.subscriptions.currency),
      currency: response.subscriptions.currency,
      status: this.normalizeStatus('subscription', response.subscriptions.status),
      intervalUnit: response.subscriptions.interval_unit,
      interval: response.subscriptions.interval,
      dayOfMonth: response.subscriptions.day_of_month,
      startDate: response.subscriptions.start_date,
      endDate: response.subscriptions.end_date,
      upcomingPayments: response.subscriptions.upcoming_payments,
      createdAt: response.subscriptions.created_at,
      raw: response.subscriptions
    };
  }

  /**
   * Get a subscription by ID
   */
  async getSubscription(providerSubscriptionId) {
    const response = await this._request('GET', `/subscriptions/${providerSubscriptionId}`);

    return {
      providerSubscriptionId: response.subscriptions.id,
      providerMandateId: response.subscriptions.links?.mandate,
      amount: this.parseAmount(response.subscriptions.amount, response.subscriptions.currency),
      currency: response.subscriptions.currency,
      status: this.normalizeStatus('subscription', response.subscriptions.status),
      intervalUnit: response.subscriptions.interval_unit,
      interval: response.subscriptions.interval,
      dayOfMonth: response.subscriptions.day_of_month,
      startDate: response.subscriptions.start_date,
      endDate: response.subscriptions.end_date,
      upcomingPayments: response.subscriptions.upcoming_payments,
      createdAt: response.subscriptions.created_at,
      raw: response.subscriptions
    };
  }

  /**
   * Update a subscription (e.g., change amount for tier change)
   * Note: Changes apply to future payments only
   *
   * @param {string} providerSubscriptionId - The subscription to update
   * @param {Object} updateData - Fields to update
   * @param {number} updateData.amount - New amount in currency units
   * @param {string} updateData.name - New name
   * @param {Object} updateData.metadata - Updated metadata
   */
  async updateSubscription(providerSubscriptionId, updateData) {
    const payload = { subscriptions: {} };

    if (updateData.amount !== undefined) {
      payload.subscriptions.amount = this.formatAmount(updateData.amount, updateData.currency);
    }

    if (updateData.name) {
      payload.subscriptions.name = updateData.name;
    }

    if (updateData.metadata) {
      payload.subscriptions.metadata = updateData.metadata;
    }

    const response = await this._request('PUT', `/subscriptions/${providerSubscriptionId}`, payload);

    return {
      providerSubscriptionId: response.subscriptions.id,
      amount: this.parseAmount(response.subscriptions.amount, response.subscriptions.currency),
      currency: response.subscriptions.currency,
      status: this.normalizeStatus('subscription', response.subscriptions.status),
      raw: response.subscriptions
    };
  }

  /**
   * Cancel a subscription
   * Stops future payments from being created
   *
   * @param {string} providerSubscriptionId - The subscription to cancel
   * @param {Object} options - Cancel options
   * @param {Object} options.metadata - Metadata to add to cancellation
   */
  async cancelSubscription(providerSubscriptionId, options = {}) {
    const payload = { subscriptions: {} };

    if (options.metadata) {
      payload.subscriptions.metadata = options.metadata;
    }

    const response = await this._request('POST', `/subscriptions/${providerSubscriptionId}/actions/cancel`, payload);

    return {
      providerSubscriptionId: response.subscriptions.id,
      status: this.normalizeStatus('subscription', response.subscriptions.status),
      raw: response.subscriptions
    };
  }

  /**
   * Pause a subscription
   * Temporarily stops payments from being created
   *
   * @param {string} providerSubscriptionId - The subscription to pause
   * @param {Object} options - Pause options
   * @param {string} options.pauseCycles - Number of cycles to pause (optional)
   * @param {Object} options.metadata - Metadata to add
   */
  async pauseSubscription(providerSubscriptionId, options = {}) {
    const payload = { subscriptions: {} };

    if (options.pauseCycles) {
      payload.subscriptions.pause_cycles = options.pauseCycles;
    }

    if (options.metadata) {
      payload.subscriptions.metadata = options.metadata;
    }

    const response = await this._request('POST', `/subscriptions/${providerSubscriptionId}/actions/pause`, payload);

    return {
      providerSubscriptionId: response.subscriptions.id,
      status: this.normalizeStatus('subscription', response.subscriptions.status),
      raw: response.subscriptions
    };
  }

  /**
   * Resume a paused subscription
   *
   * @param {string} providerSubscriptionId - The subscription to resume
   * @param {Object} options - Resume options
   * @param {Object} options.metadata - Metadata to add
   */
  async resumeSubscription(providerSubscriptionId, options = {}) {
    const payload = { subscriptions: {} };

    if (options.metadata) {
      payload.subscriptions.metadata = options.metadata;
    }

    const response = await this._request('POST', `/subscriptions/${providerSubscriptionId}/actions/resume`, payload);

    return {
      providerSubscriptionId: response.subscriptions.id,
      status: this.normalizeStatus('subscription', response.subscriptions.status),
      raw: response.subscriptions
    };
  }

  /**
   * List subscriptions for a mandate
   *
   * @param {string} providerMandateId - The mandate to list subscriptions for
   * @param {Object} filters - Optional filters
   * @param {string} filters.status - Filter by status
   */
  async listSubscriptions(providerMandateId, filters = {}) {
    let path = `/subscriptions?mandate=${providerMandateId}`;

    if (filters.status) {
      path += `&status=${filters.status}`;
    }

    const response = await this._request('GET', path);

    return (response.subscriptions || []).map(subscription => ({
      providerSubscriptionId: subscription.id,
      providerMandateId: subscription.links?.mandate,
      amount: this.parseAmount(subscription.amount, subscription.currency),
      currency: subscription.currency,
      status: this.normalizeStatus('subscription', subscription.status),
      intervalUnit: subscription.interval_unit,
      interval: subscription.interval,
      dayOfMonth: subscription.day_of_month,
      startDate: subscription.start_date,
      endDate: subscription.end_date,
      createdAt: subscription.created_at,
      raw: subscription
    }));
  }

  // ==========================================
  // Webhook Handling
  // ==========================================

  verifyWebhookSignature(body, signature) {
    return verifyGoCardlessSignature(body, signature, this.webhookSecret);
  }

  parseWebhookEvents(payload) {
    return parseWebhookEvents('gocardless', payload);
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  normalizeStatus(resourceType, providerStatus) {
    if (resourceType === 'mandate') {
      return MANDATE_STATUS_MAP[providerStatus] || providerStatus;
    }
    if (resourceType === 'payment') {
      return PAYMENT_STATUS_MAP[providerStatus] || providerStatus;
    }
    if (resourceType === 'subscription') {
      return SUBSCRIPTION_STATUS_MAP[providerStatus] || providerStatus;
    }
    return providerStatus;
  }
}

export default GoCardlessProvider;
