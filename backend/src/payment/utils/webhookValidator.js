/**
 * Webhook Signature Validation Utilities
 *
 * Provides secure webhook signature verification for various payment providers.
 * Uses timing-safe comparison to prevent timing attacks.
 */

import crypto from 'crypto';
import { getConfig } from '../../config/index.js';

/**
 * Verify GoCardless webhook signature
 *
 * GoCardless signs webhooks using HMAC-SHA256 with the webhook secret.
 * The signature is sent in the 'Webhook-Signature' header.
 *
 * @param {string} body - Raw request body (must be the exact string, not parsed JSON)
 * @param {string} signature - The signature from the 'Webhook-Signature' header
 * @param {string} secret - The webhook secret (optional, defaults to config)
 * @returns {boolean} True if signature is valid
 */
export function verifyGoCardlessSignature(body, signature, secret = null) {
  if (!body || !signature) {
    return false;
  }

  const config = getConfig();
  const webhookSecret = secret || config.gocardless?.webhookSecret || process.env.GOCARDLESS_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('GoCardless webhook secret is not configured');
  }

  try {
    const computed = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computed)
    );
  } catch {
    // If buffers are different lengths, timingSafeEqual throws
    return false;
  }
}

/**
 * Verify Stripe webhook signature
 *
 * Stripe uses a more complex signature scheme with timestamps.
 * The signature is in the 'Stripe-Signature' header.
 *
 * @param {string} body - Raw request body
 * @param {string} signatureHeader - The full 'Stripe-Signature' header value
 * @param {string} secret - The webhook secret (optional, defaults to config)
 * @param {number} tolerance - Tolerance in seconds for timestamp (default 300)
 * @returns {boolean} True if signature is valid
 */
export function verifyStripeSignature(body, signatureHeader, secret = null, tolerance = 300) {
  if (!body || !signatureHeader) {
    return false;
  }

  const config = getConfig();
  const webhookSecret = secret || config.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured');
  }

  try {
    // Parse the signature header
    const elements = signatureHeader.split(',');
    const signatureMap = {};

    for (const element of elements) {
      const [key, value] = element.split('=');
      signatureMap[key] = value;
    }

    const timestamp = parseInt(signatureMap.t, 10);
    const signatures = Object.entries(signatureMap)
      .filter(([key]) => key.startsWith('v1'))
      .map(([, value]) => value);

    if (!timestamp || signatures.length === 0) {
      return false;
    }

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // Check if any of the provided signatures match
    return signatures.some(sig => {
      try {
        return crypto.timingSafeEqual(
          Buffer.from(sig),
          Buffer.from(expectedSignature)
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Generic webhook signature verifier
 *
 * Routes to the appropriate provider-specific verifier.
 *
 * @param {string} provider - The payment provider name
 * @param {string} body - Raw request body
 * @param {string} signature - The signature header value
 * @param {Object} options - Provider-specific options
 * @returns {boolean} True if signature is valid
 */
export function verifyWebhookSignature(provider, body, signature, options = {}) {
  switch (provider.toLowerCase()) {
    case 'gocardless':
      return verifyGoCardlessSignature(body, signature, options.secret);
    case 'stripe':
      return verifyStripeSignature(body, signature, options.secret, options.tolerance);
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}

/**
 * Extract webhook event ID for idempotency checking
 *
 * @param {string} provider - The payment provider name
 * @param {Object} payload - The parsed webhook payload
 * @returns {string|null} The event ID or null if not found
 */
export function extractEventId(provider, payload) {
  switch (provider.toLowerCase()) {
    case 'gocardless':
      // GoCardless sends events in an array
      return payload?.events?.[0]?.id || payload?.id || null;
    case 'stripe':
      return payload?.id || null;
    default:
      return payload?.id || payload?.event_id || null;
  }
}

/**
 * Parse webhook payload into normalized event format
 *
 * @param {string} provider - The payment provider name
 * @param {Object} payload - The parsed webhook payload
 * @returns {Array<Object>} Array of normalized event objects
 */
export function parseWebhookEvents(provider, payload) {
  const events = [];

  switch (provider.toLowerCase()) {
    case 'gocardless':
      // GoCardless sends multiple events in one webhook
      for (const event of (payload?.events || [])) {
        // GoCardless uses plural resource_type (e.g., 'payments') but singular link keys (e.g., 'payment')
        const singularResourceType = event.resource_type?.replace(/s$/, '') || event.resource_type;
        events.push({
          id: event.id,
          resourceType: event.resource_type,
          action: event.action,
          resourceId: event.links?.[singularResourceType] || event.links?.[event.resource_type] || null,
          createdAt: event.created_at,
          details: event.details || {},
          raw: event
        });
      }
      break;

    case 'stripe':
      // Stripe sends one event per webhook
      events.push({
        id: payload.id,
        resourceType: payload.data?.object?.object || payload.type?.split('.')[0],
        action: payload.type?.split('.').slice(1).join('.') || payload.type,
        resourceId: payload.data?.object?.id || null,
        createdAt: new Date(payload.created * 1000).toISOString(),
        details: payload.data?.object || {},
        raw: payload
      });
      break;

    default:
      // Generic fallback
      events.push({
        id: payload.id || payload.event_id,
        resourceType: payload.resource_type || payload.type,
        action: payload.action || 'unknown',
        resourceId: payload.resource_id || null,
        createdAt: payload.created_at || new Date().toISOString(),
        details: payload,
        raw: payload
      });
  }

  return events;
}

/**
 * Get the header name for webhook signature based on provider
 *
 * @param {string} provider - The payment provider name
 * @returns {string} The header name (lowercase)
 */
export function getSignatureHeaderName(provider) {
  switch (provider.toLowerCase()) {
    case 'gocardless':
      return 'webhook-signature';
    case 'stripe':
      return 'stripe-signature';
    default:
      return 'x-webhook-signature';
  }
}

export default {
  verifyGoCardlessSignature,
  verifyStripeSignature,
  verifyWebhookSignature,
  extractEventId,
  parseWebhookEvents,
  getSignatureHeaderName
};
