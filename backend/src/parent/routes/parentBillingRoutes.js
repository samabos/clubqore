export async function parentBillingRoutes(fastify, options) {
  const { parentBillingController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Get all invoices for parent's children
  fastify.get('/invoices', {
    schema: {
      tags: ['Parent Billing'],
      summary: 'Get all invoices for parent\'s children',
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'] },
          user_id: { type: 'integer' }
        }
      }
    }
  }, parentBillingController.getInvoices.bind(parentBillingController));

  // Get invoice by ID (verify parent owns it)
  fastify.get('/invoices/:invoiceId', {
    schema: {
      tags: ['Parent Billing'],
      summary: 'Get invoice details',
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'integer' }
        },
        required: ['invoiceId']
      }
    }
  }, parentBillingController.getInvoice.bind(parentBillingController));

  // Get invoices for a specific child
  fastify.get('/children/:childUserId/invoices', {
    schema: {
      tags: ['Parent Billing'],
      summary: 'Get invoices for a specific child',
      params: {
        type: 'object',
        properties: {
          childUserId: { type: 'integer' }
        },
        required: ['childUserId']
      }
    }
  }, parentBillingController.getChildInvoices.bind(parentBillingController));
}
