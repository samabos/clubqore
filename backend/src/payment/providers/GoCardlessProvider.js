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
      throw new Error('GoCardless access token is required');
    }

    this.accessToken = config.accessToken;
    this.environment = config.environment || 'sandbox';
    this.webhookSecret = config.webhookSecret;

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
      const error = new Error(responseData.error?.message || 'GoCardless API error');
      error.code = responseData.error?.type;
      error.details = responseData.error?.errors;
      error.status = response.status;
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

    if (billingRequest.status !== 'fulfilled') {
      throw new Error(`Billing request not fulfilled. Status: ${billingRequest.status}`);
    }

    // Get the created mandate
    const mandateId = billingRequest.links?.mandate_request_mandate;
    if (!mandateId) {
      throw new Error('No mandate was created');
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
    return providerStatus;
  }
}

export default GoCardlessProvider;
