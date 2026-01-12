/**
 * Webhook Controller
 *
 * Handles incoming webhooks from payment providers.
 * Verifies signatures and delegates to WebhookProcessorService.
 */

import { WebhookProcessorService } from '../services/WebhookProcessorService.js';
import { getSignatureHeaderName } from '../utils/webhookValidator.js';

export class WebhookController {
  constructor(db) {
    this.db = db;
    this.webhookProcessor = new WebhookProcessorService(db);
  }

  /**
   * Handle GoCardless webhook
   *
   * POST /webhooks/gocardless
   */
  async handleGoCardlessWebhook(request, reply) {
    return this._handleWebhook('gocardless', request, reply);
  }

  /**
   * Handle Stripe webhook (future)
   *
   * POST /webhooks/stripe
   */
  async handleStripeWebhook(request, reply) {
    return this._handleWebhook('stripe', request, reply);
  }

  /**
   * Generic webhook handler
   *
   * @private
   */
  async _handleWebhook(provider, request, reply) {
    try {
      // Get signature from appropriate header
      const signatureHeader = getSignatureHeaderName(provider);
      const signature = request.headers[signatureHeader];

      if (!signature) {
        console.warn(`Missing signature header for ${provider} webhook`);
        return reply.status(400).send({
          success: false,
          error: 'Missing signature'
        });
      }

      // Get raw body
      // Note: Fastify needs to be configured to preserve raw body for webhooks
      const rawBody = request.rawBody || JSON.stringify(request.body);

      // Process the webhook
      const result = await this.webhookProcessor.processWebhook(
        provider,
        rawBody,
        signature
      );

      // Return 200 quickly - webhook processing should not delay response
      return reply.status(200).send({
        success: true,
        received: true,
        eventsProcessed: result.eventsProcessed
      });
    } catch (error) {
      console.error(`Webhook error (${provider}):`, error);

      // Still return 200 for signature verification failures to prevent retries
      // (invalid webhooks should not be retried)
      if (error.message === 'Invalid webhook signature') {
        return reply.status(200).send({
          success: false,
          error: 'Invalid signature',
          received: true
        });
      }

      // For other errors, return 500 so the provider will retry
      return reply.status(500).send({
        success: false,
        error: 'Internal error processing webhook'
      });
    }
  }
}

export default WebhookController;
