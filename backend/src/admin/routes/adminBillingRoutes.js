import { requireRole, requireScope } from '../../auth/permissionMiddleware.js';

/**
 * Admin Billing Routes
 *
 * Note: Billing settings, manual billing, and payment retry routes have been removed.
 * GoCardless now handles payment scheduling and retries natively via Subscriptions API.
 * These routes handle worker monitoring and admin invoice viewing.
 */
export async function adminBillingRoutes(fastify, options) {
  const { adminBillingController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Super admin role check for all admin routes
  const requireSuperAdmin = requireRole(['super_admin']);

  // Scope middleware for admin-invoices resource
  const invoiceViewScope = requireScope('admin-invoices', 'view');

  // ============================================
  // Invoice Management (Super Admin Only)
  // ============================================

  // Get all invoices with pagination and filters
  fastify.get('/admin/invoices', {
    preHandler: [requireSuperAdmin, invoiceViewScope],
    schema: {
      tags: ['Admin - Invoices'],
      summary: 'List all invoices (super admin only)',
      description: 'View all invoices across all clubs with pagination and filtering',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1, minimum: 1 },
          limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          status: { type: 'string', enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'] },
          clubId: { type: 'integer' },
          search: { type: 'string' },
          fromDate: { type: 'string', format: 'date' },
          toDate: { type: 'string', format: 'date' }
        }
      }
    }
  }, adminBillingController.getAllInvoices.bind(adminBillingController));

  // Get invoice details
  fastify.get('/admin/invoices/:invoiceId', {
    preHandler: [requireSuperAdmin, invoiceViewScope],
    schema: {
      tags: ['Admin - Invoices'],
      summary: 'Get invoice details (super admin only)',
      description: 'View detailed invoice information including items and payments',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'integer' }
        },
        required: ['invoiceId']
      }
    }
  }, adminBillingController.getInvoiceDetails.bind(adminBillingController));

  // Get all clubs (for dropdown)
  fastify.get('/admin/clubs', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin'],
      summary: 'Get all clubs (super admin only)',
      description: 'Fetch all active clubs',
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

  // ============================================
  // Worker Status & Management (Super Admin Only)
  // ============================================

  // Get all workers status
  fastify.get('/admin/billing/workers/status', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Background Jobs'],
      summary: 'Get status of all background workers (super admin only)',
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
      tags: ['Admin - Background Jobs'],
      summary: 'Get execution history for all workers (super admin only)',
      description: 'View recent execution history across all background workers',
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
      tags: ['Admin - Background Jobs'],
      summary: 'Get execution history for a specific worker (super admin only)',
      description: 'View recent execution history for a background worker',
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

  // ============================================
  // Subscription Management (Super Admin Only)
  // ============================================

  // Get all subscriptions with pagination and filters
  fastify.get('/admin/billing/subscriptions', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Subscriptions'],
      summary: 'List all subscriptions (super admin only)',
      description: 'View all subscriptions across all clubs with pagination and filtering',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1, minimum: 1 },
          limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          status: { type: 'string', enum: ['pending', 'active', 'paused', 'cancelled', 'suspended'] },
          clubId: { type: 'integer' },
          search: { type: 'string' },
          hasProviderSubscription: { type: 'string', enum: ['true', 'false'] }
        }
      }
    }
  }, adminBillingController.getAllSubscriptions.bind(adminBillingController));

  // Subscription sync diagnostic
  fastify.get('/admin/billing/subscriptions/diagnostic', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Background Jobs'],
      summary: 'Debug subscription sync issues (super admin only)',
      description: 'View all subscriptions and why they do or do not need syncing to GoCardless'
    }
  }, adminBillingController.getSubscriptionDiagnostic.bind(adminBillingController));

  // Trigger a specific worker manually
  fastify.post('/admin/billing/workers/:name/trigger', {
    preHandler: [requireSuperAdmin],
    schema: {
      tags: ['Admin - Background Jobs'],
      summary: 'Manually trigger a specific worker (super admin only)',
      description: 'Run a background worker immediately instead of waiting for scheduled time',
      params: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: ['subscription_sync', 'notification_retry'],
            description: 'Worker name to trigger'
          }
        },
        required: ['name']
      }
    }
  }, adminBillingController.triggerWorker.bind(adminBillingController));
}
