/**
 * Payment Routes Index
 *
 * Main router for all payment-related routes.
 */

import { membershipTierRoutes } from './membershipTierRoutes.js';
import { subscriptionRoutes } from './subscriptionRoutes.js';
import { parentSubscriptionRoutes } from './parentSubscriptionRoutes.js';
import { parentPaymentRoutes } from './parentPaymentRoutes.js';
import { webhookRoutes } from './webhookRoutes.js';

/**
 * Register all payment routes
 *
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Route options
 * @param {Function} options.authenticate - Authentication middleware
 */
export async function registerPaymentRoutes(fastify, options) {
  const { authenticate } = options;

  // Club Manager Routes (prefix: /api/club)
  await fastify.register(async (clubRoutes) => {
    // Membership Tiers: /api/club/membership-tiers
    await clubRoutes.register(membershipTierRoutes, {
      prefix: '/membership-tiers',
      authenticate
    });

    // Subscriptions: /api/club/subscriptions
    await clubRoutes.register(subscriptionRoutes, {
      prefix: '/subscriptions',
      authenticate
    });
  }, { prefix: '/club' });

  // Parent Routes (prefix: /api/parent)
  await fastify.register(async (parentRoutes) => {
    // Subscriptions: /api/parent/subscriptions
    await parentRoutes.register(parentSubscriptionRoutes, {
      prefix: '/subscriptions',
      authenticate
    });

    // Payment Methods: /api/parent/payment-methods
    await parentRoutes.register(parentPaymentRoutes, {
      prefix: '/payment-methods',
      authenticate
    });
  }, { prefix: '/parent' });

  // Webhook Routes (prefix: /api/webhooks)
  // Note: Webhooks do NOT require authentication
  await fastify.register(webhookRoutes, {
    prefix: '/webhooks'
  });
}

export default registerPaymentRoutes;
