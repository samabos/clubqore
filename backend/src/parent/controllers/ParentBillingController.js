import { InvoiceService } from '../../club/services/InvoiceService.js';

export class ParentBillingController {
  constructor(db) {
    this.db = db;
    this.invoiceService = new InvoiceService(db);
  }

  /**
   * Get all invoices for parent's children
   * GET /parent/billing/invoices
   */
  async getInvoices(request, reply) {
    try {
      const parentUserId = request.user.id;
      const filters = request.query;

      const invoices = await this.invoiceService.getInvoicesForParent(parentUserId, filters);

      reply.code(200).send({
        success: true,
        invoices
      });
    } catch (error) {
      request.log.error('Error fetching parent invoices:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch invoices'
      });
    }
  }

  /**
   * Get invoice by ID (verify parent owns it)
   * GET /parent/billing/invoices/:invoiceId
   */
  async getInvoice(request, reply) {
    try {
      const { invoiceId } = request.params;
      const parentUserId = request.user.id;

      const invoice = await this.invoiceService.getInvoiceForParent(invoiceId, parentUserId);

      reply.code(200).send({
        success: true,
        invoice
      });
    } catch (error) {
      request.log.error('Error fetching parent invoice:', error);
      reply.code(error.message.includes('not found') || error.message.includes('access denied') ? 404 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch invoice'
      });
    }
  }

  /**
   * Get invoices for a specific child
   * GET /parent/billing/children/:childUserId/invoices
   */
  async getChildInvoices(request, reply) {
    try {
      const { childUserId } = request.params;
      const parentUserId = request.user.id;

      // Verify parent-child relationship
      const relationship = await this.db('user_children')
        .where('parent_user_id', parentUserId)
        .where('child_user_id', childUserId)
        .first();

      if (!relationship) {
        return reply.code(403).send({
          success: false,
          message: 'Unauthorized to access this child\'s invoices'
        });
      }

      const invoices = await this.invoiceService.getInvoicesForParent(parentUserId, {
        child_user_id: parseInt(childUserId)
      });

      reply.code(200).send({
        success: true,
        invoices
      });
    } catch (error) {
      request.log.error('Error fetching child invoices:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch child invoices'
      });
    }
  }
}
