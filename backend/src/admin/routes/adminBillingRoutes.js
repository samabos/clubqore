import { requireRole } from '../../auth/permissionMiddleware.js';

export async function adminBillingRoutes(fastify, options) {
  const { adminBillingController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Super admin role check for all admin routes
  const requireSuperAdmin = requireRole(['super_admin']);

  // Get all clubs (for dropdown)
  fastify.get('/admin/clubs', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing'],
      summary: 'Get all clubs (super admin only)',
      description: 'Fetch all active clubs for super admin billing settings management',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            clubs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  club_type: { type: 'string' },
                  verified: { type: 'boolean' },
                  created_at: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, adminBillingController.getAllClubs.bind(adminBillingController));

  // Get billing settings for specific club
  fastify.get('/admin/clubs/:clubId/billing/settings', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing'],
      summary: 'Get billing settings for any club (super admin only)',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        },
        required: ['clubId']
      }
    }
  }, adminBillingController.getClubBillingSettings.bind(adminBillingController));

  // Update billing settings for specific club
  fastify.put('/admin/clubs/:clubId/billing/settings', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing'],
      summary: 'Update billing settings for any club (super admin only)',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        },
        required: ['clubId']
      },
      body: {
        type: 'object',
        properties: {
          service_charge_enabled: { type: 'boolean' },
          service_charge_type: { type: 'string', enum: ['percentage', 'fixed'] },
          service_charge_value: { type: 'number', minimum: 0 },
          service_charge_description: { type: 'string', maxLength: 255 },
          auto_generation_enabled: { type: 'boolean' },
          days_before_season: { type: 'integer', minimum: 0, maximum: 90 },
          default_invoice_items: {
            type: ['array', 'null'],
            items: {
              type: 'object',
              required: ['description', 'unit_price'],
              properties: {
                description: { type: 'string', maxLength: 255 },
                category: { type: 'string', enum: ['membership', 'training', 'equipment', 'tournament', 'other'] },
                quantity: { type: 'integer', minimum: 1, default: 1 },
                unit_price: { type: 'number', minimum: 0 }
              }
            }
          }
        }
      }
    }
  }, adminBillingController.updateClubBillingSettings.bind(adminBillingController));

  // ============================================
  // Billing Job Management (Super Admin Only)
  // ============================================

  // Get subscriptions due for billing
  fastify.get('/admin/billing/due-subscriptions', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing Jobs'],
      summary: 'Get subscriptions due for billing (super admin only)',
      description: 'View all subscriptions that are due for billing today or earlier',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            count: { type: 'integer' },
            subscriptions: { type: 'array' }
          }
        }
      }
    }
  }, adminBillingController.getDueSubscriptions.bind(adminBillingController));

  // Trigger billing manually
  fastify.post('/admin/billing/trigger-billing', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing Jobs'],
      summary: 'Manually trigger subscription billing (super admin only)',
      description: 'Process billing for all due subscriptions or a specific subscription',
      body: {
        type: 'object',
        properties: {
          subscriptionId: { type: 'integer', description: 'Optional: specific subscription to bill' }
        }
      }
    }
  }, adminBillingController.triggerBilling.bind(adminBillingController));

  // Get failed payments
  fastify.get('/admin/billing/failed-payments', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing Jobs'],
      summary: 'Get failed payments eligible for retry (super admin only)',
      description: 'View all failed payments that can be retried',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            count: { type: 'integer' },
            payments: { type: 'array' }
          }
        }
      }
    }
  }, adminBillingController.getFailedPayments.bind(adminBillingController));

  // Retry a failed payment
  fastify.post('/admin/billing/retry-payment', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing Jobs'],
      summary: 'Manually retry a failed payment (super admin only)',
      description: 'Retry a specific failed payment',
      body: {
        type: 'object',
        required: ['paymentId'],
        properties: {
          paymentId: { type: 'integer', description: 'The payment ID to retry' }
        }
      }
    }
  }, adminBillingController.retryPayment.bind(adminBillingController));

  // ============================================
  // Worker Status & Management (Super Admin Only)
  // ============================================

  // Get all workers status
  fastify.get('/admin/billing/workers/status', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing Jobs'],
      summary: 'Get status of all billing workers (super admin only)',
      description: 'View status and last execution time for all background workers',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            workers: { type: 'array' }
          }
        }
      }
    }
  }, adminBillingController.getWorkersStatus.bind(adminBillingController));

  // Get all workers execution history (must be before :name/history to avoid route conflict)
  fastify.get('/admin/billing/workers/history', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing Jobs'],
      summary: 'Get execution history for all workers (super admin only)',
      description: 'View recent execution history across all billing workers',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 50, maximum: 100 }
        }
      }
    }
  }, adminBillingController.getAllWorkerHistory.bind(adminBillingController));

  // Get worker execution history
  fastify.get('/admin/billing/workers/:name/history', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing Jobs'],
      summary: 'Get execution history for a specific worker (super admin only)',
      description: 'View recent execution history for a billing worker',
      params: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Worker name' }
        },
        required: ['name']
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 50, maximum: 100 }
        }
      }
    }
  }, adminBillingController.getWorkerHistory.bind(adminBillingController));

  // Trigger a specific worker manually
  fastify.post('/admin/billing/workers/:name/trigger', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Billing Jobs'],
      summary: 'Manually trigger a specific worker (super admin only)',
      description: 'Run a billing worker immediately instead of waiting for scheduled time',
      params: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: ['subscription_billing', 'payment_retry', 'invoice_scheduler', 'subscription_notification'],
            description: 'Worker name to trigger'
          }
        },
        required: ['name']
      }
    }
  }, adminBillingController.triggerWorker.bind(adminBillingController));
}
