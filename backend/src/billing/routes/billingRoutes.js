import { requireRole, requireScope } from '../../auth/permissionMiddleware.js';

/**
 * Billing Routes
 *
 * Note: Manual invoice creation has been removed.
 * Invoices are now auto-generated via GoCardless webhooks when payments are created.
 * These routes handle viewing and managing existing invoices only.
 *
 * Authorization: Uses both role-based (club_manager) and scope-based (billing:*) checks.
 */
export async function billingRoutes(fastify, options) {
  const { billingController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Role-based check (legacy, for backward compatibility)
  const requireClubManager = requireRole(['club_manager', 'admin', 'super_admin']);

  // Scope-based checks (defense in depth)
  const viewScope = requireScope('billing', 'view');
  const editScope = requireScope('billing', 'edit');
  const deleteScope = requireScope('billing', 'delete');

  // Invoice routes - clubId is derived from authenticated user
  // Note: Invoice creation removed - invoices auto-generated via GoCardless webhooks

  // LIST - Club manager can view all invoices
  fastify.get('/billing/invoices', {
    preHandler: [requireClubManager, viewScope],
    schema: {
      tags: ['Billing'],
      summary: 'Get all invoices for the user\'s club',
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'] },
          season_id: { type: 'integer' },
          user_id: { type: 'integer' },
          invoice_type: { type: 'string', enum: ['seasonal', 'adhoc'] },
          from_date: { type: 'string', format: 'date' },
          to_date: { type: 'string', format: 'date' },
          search: { type: 'string' }
        }
      }
    }
  }, billingController.getInvoices.bind(billingController));

  // GET SINGLE - Club manager can view invoice details
  fastify.get('/billing/invoices/:invoiceId', {
    preHandler: [requireClubManager, viewScope],
    schema: {
      tags: ['Billing'],
      summary: 'Get invoice by ID',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'integer' }
        },
        required: ['invoiceId']
      }
    }
  }, billingController.getInvoice.bind(billingController));

  // UPDATE - Requires club manager
  fastify.put('/billing/invoices/:invoiceId', {
    preHandler: [requireClubManager, editScope],
    schema: {
      tags: ['Billing'],
      summary: 'Update invoice (draft only)',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'integer' }
        },
        required: ['invoiceId']
      }
    }
  }, billingController.updateInvoice.bind(billingController));

  // DELETE - Requires club manager
  fastify.delete('/billing/invoices/:invoiceId', {
    preHandler: [requireClubManager, deleteScope],
    schema: {
      tags: ['Billing'],
      summary: 'Delete invoice (draft only)',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'integer' }
        },
        required: ['invoiceId']
      }
    }
  }, billingController.deleteInvoice.bind(billingController));

  // PUBLISH - Requires club manager
  fastify.post('/billing/invoices/:invoiceId/publish', {
    preHandler: [requireClubManager, editScope],
    schema: {
      tags: ['Billing'],
      summary: 'Publish invoice (draft -> pending)',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'integer' }
        },
        required: ['invoiceId']
      }
    }
  }, billingController.publishInvoice.bind(billingController));

  // MARK PAID - Requires club manager
  fastify.post('/billing/invoices/:invoiceId/paid', {
    preHandler: [requireClubManager, editScope],
    schema: {
      tags: ['Billing'],
      summary: 'Mark invoice as paid',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'integer' }
        },
        required: ['invoiceId']
      },
      body: {
        type: 'object',
        properties: {
          payment_date: { type: 'string', format: 'date' },
          payment_method: { type: 'string', enum: ['cash', 'bank_transfer', 'card', 'online'] },
          reference_number: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    }
  }, billingController.markInvoiceAsPaid.bind(billingController));

  // CANCEL - Requires club manager
  fastify.post('/billing/invoices/:invoiceId/cancel', {
    preHandler: [requireClubManager, editScope],
    schema: {
      tags: ['Billing'],
      summary: 'Cancel invoice',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'integer' }
        },
        required: ['invoiceId']
      }
    }
  }, billingController.cancelInvoice.bind(billingController));

  // GET USER INVOICES - Club manager only
  fastify.get('/billing/users/:userId/invoices', {
    preHandler: [requireClubManager, viewScope],
    schema: {
      tags: ['Billing'],
      summary: 'Get invoices for a specific user',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'integer' }
        },
        required: ['userId']
      }
    }
  }, billingController.getUserInvoices.bind(billingController));

  // SUMMARY - Club manager only
  fastify.get('/billing/summary', {
    preHandler: [requireClubManager, viewScope],
    schema: {
      tags: ['Billing'],
      summary: 'Get billing summary statistics for the user\'s club',
      querystring: {
        type: 'object',
        properties: {
          season_id: { type: 'integer' },
          from_date: { type: 'string', format: 'date' },
          to_date: { type: 'string', format: 'date' }
        }
      }
    }
  }, billingController.getBillingSummary.bind(billingController));

  // Note: Billing settings and scheduled jobs routes removed
  // Invoices are now auto-generated via GoCardless webhooks
}
