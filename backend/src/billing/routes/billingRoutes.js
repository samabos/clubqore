import { requireRole } from '../../auth/permissionMiddleware.js';

export async function billingRoutes(fastify, options) {
  const { billingController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Club manager role check for billing management (write operations)
  const requireClubManager = requireRole(['club_manager', 'admin', 'super_admin']);

  // Invoice routes - clubId is derived from authenticated user

  // CREATE - Requires club manager
  fastify.post('/billing/invoices', {
    preHandler: [requireClubManager],
    schema: {
      tags: ['Billing'],
      summary: 'Create a new invoice',
      body: {
        type: 'object',
        required: ['user_id', 'invoice_type', 'issue_date', 'due_date', 'items'],
        properties: {
          user_id: { type: 'integer' },
          season_id: { type: ['integer', 'null'] },
          invoice_type: { type: 'string', enum: ['seasonal', 'adhoc'] },
          issue_date: { type: 'string', format: 'date' },
          due_date: { type: 'string', format: 'date' },
          tax_amount: { type: 'number', minimum: 0 },
          discount_amount: { type: 'number', minimum: 0 },
          notes: { type: 'string' },
          items: {
            type: 'array',
            minItems: 1,
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
  }, billingController.createInvoice.bind(billingController));

  // LIST - Club manager can view all invoices
  fastify.get('/billing/invoices', {
    preHandler: [requireClubManager],
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
    preHandler: [requireClubManager],
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
    preHandler: [requireClubManager],
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
    preHandler: [requireClubManager],
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
    preHandler: [requireClubManager],
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
    preHandler: [requireClubManager],
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
    preHandler: [requireClubManager],
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
    preHandler: [requireClubManager],
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

  // BULK GENERATE - Requires club manager
  fastify.post('/billing/invoices/bulk/seasonal', {
    preHandler: [requireClubManager],
    schema: {
      tags: ['Billing'],
      summary: 'Generate seasonal invoices in bulk',
      body: {
        type: 'object',
        required: ['season_id', 'user_ids', 'items', 'issue_date', 'due_date'],
        properties: {
          season_id: { type: 'integer' },
          user_ids: {
            type: 'array',
            minItems: 1,
            items: { type: 'integer' }
          },
          issue_date: { type: 'string', format: 'date' },
          due_date: { type: 'string', format: 'date' },
          notes: { type: 'string' },
          items: {
            type: 'array',
            minItems: 1,
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
  }, billingController.generateSeasonalInvoices.bind(billingController));

  // SUMMARY - Club manager only
  fastify.get('/billing/summary', {
    preHandler: [requireClubManager],
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

  // Billing settings routes - Club manager only
  fastify.get('/billing/settings', {
    preHandler: [requireClubManager],
    schema: {
      tags: ['Billing Settings'],
      summary: 'Get billing settings for the user\'s club'
    }
  }, billingController.getSettings.bind(billingController));

  fastify.put('/billing/settings', {
    preHandler: [requireClubManager],
    schema: {
      tags: ['Billing Settings'],
      summary: 'Update billing settings',
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
  }, billingController.updateSettings.bind(billingController));

  // Scheduled jobs routes - Club manager only
  fastify.get('/billing/scheduled-jobs', {
    preHandler: [requireClubManager],
    schema: {
      tags: ['Scheduled Invoice Jobs'],
      summary: 'Get scheduled invoice jobs for the user\'s club',
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
          season_id: { type: 'integer' }
        }
      }
    }
  }, billingController.getScheduledJobs.bind(billingController));
}
