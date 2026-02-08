import { InvoiceService } from '../services/InvoiceService.js';
import { ClubService } from '../../club/services/ClubService.js';
import { emailService } from '../../shared/services/emailService.js';

/**
 * Billing Controller
 *
 * Note: Bulk invoicing and billing settings have been removed.
 * Invoices are now auto-generated via GoCardless webhooks when payments are created.
 * This controller handles viewing and managing existing invoices only.
 */
export class BillingController {
  constructor(db) {
    this.db = db;
    this.invoiceService = new InvoiceService(db);
    this.clubService = new ClubService(db);
  }

  // ==================== INVOICE ROUTES ====================
  // Note: Manual invoice creation removed - invoices auto-generated via GoCardless webhooks

  /**
   * Get all invoices for a club
   * GET /billing/invoices
   */
  async getInvoices(request, reply) {
    try {
      const filters = request.query;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const invoices = await this.invoiceService.getInvoicesByClub(clubId, filters);

      reply.code(200).send({
        success: true,
        invoices
      });
    } catch (error) {
      request.log.error('Error fetching invoices:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch invoices'
      });
    }
  }

  /**
   * Get invoice by ID
   * GET /billing/invoices/:invoiceId
   */
  async getInvoice(request, reply) {
    try {
      const { invoiceId } = request.params;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const invoice = await this.invoiceService.getInvoiceById(invoiceId, clubId);

      reply.code(200).send({
        success: true,
        invoice
      });
    } catch (error) {
      request.log.error('Error fetching invoice:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch invoice'
      });
    }
  }

  /**
   * Update invoice
   * PUT /club/:clubId/billing/invoices/:invoiceId
   */
  async updateInvoice(request, reply) {
    try {
      const { invoiceId } = request.params;
      const invoiceData = request.body;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const result = await this.invoiceService.updateInvoice(invoiceId, clubId, invoiceData);

      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating invoice:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update invoice'
      });
    }
  }

  /**
   * Delete invoice
   * DELETE /club/:clubId/billing/invoices/:invoiceId
   */
  async deleteInvoice(request, reply) {
    try {
      const { invoiceId } = request.params;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const result = await this.invoiceService.deleteInvoice(invoiceId, clubId);

      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error deleting invoice:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to delete invoice'
      });
    }
  }

  /**
   * Publish invoice
   * POST /club/:clubId/billing/invoices/:invoiceId/publish
   */
  async publishInvoice(request, reply) {
    try {
      const { invoiceId } = request.params;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const result = await this.invoiceService.publishInvoice(invoiceId, clubId);

      // Send email notification to parent
      try {
        // Fetch complete invoice with items
        const invoice = await this.invoiceService.getInvoiceById(invoiceId, clubId);

        // Get parent data via user_children relationship
        const parent = await this.db('users')
          .join('user_children', 'users.id', 'user_children.parent_id')
          .where('user_children.child_id', invoice.user_id)
          .select('users.*')
          .first();

        if (parent && parent.email) {
          // Get member and club data
          const member = await this.db('users')
            .where('id', invoice.user_id)
            .first();

          const club = await this.db('clubs')
            .where('id', clubId)
            .first();

          // Send email notification
          await emailService.sendInvoiceNotification({
            invoiceData: invoice,
            parentData: parent,
            memberData: member,
            clubData: club
          });

          request.log.info(`Invoice notification sent to parent ${parent.email} for invoice ${invoice.invoice_number}`);
        } else {
          request.log.warn(`No parent found for member ${invoice.user_id}, skipping email notification`);
        }
      } catch (emailError) {
        // Don't fail the request if email fails
        request.log.error('Failed to send invoice email notification:', emailError);
      }

      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error publishing invoice:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to publish invoice'
      });
    }
  }

  /**
   * Mark invoice as paid
   * POST /club/:clubId/billing/invoices/:invoiceId/paid
   */
  async markInvoiceAsPaid(request, reply) {
    try {
      const { invoiceId } = request.params;
      const paymentData = request.body;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const result = await this.invoiceService.markInvoiceAsPaid(
        invoiceId,
        clubId,
        paymentData,
        userId
      );

      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error marking invoice as paid:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to mark invoice as paid'
      });
    }
  }

  /**
   * Cancel invoice
   * POST /club/:clubId/billing/invoices/:invoiceId/cancel
   */
  async cancelInvoice(request, reply) {
    try {
      const { invoiceId } = request.params;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const result = await this.invoiceService.cancelInvoice(invoiceId, clubId);

      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error cancelling invoice:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to cancel invoice'
      });
    }
  }

  /**
   * Get invoices for a specific user
   * GET /club/:clubId/billing/users/:userId/invoices
   */
  async getUserInvoices(request, reply) {
    try {
      const { userId } = request.params;
      const requestUserId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(requestUserId);
      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const invoices = await this.invoiceService.getInvoicesByUser(clubId, userId);

      reply.code(200).send({
        success: true,
        invoices
      });
    } catch (error) {
      request.log.error('Error fetching user invoices:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch user invoices'
      });
    }
  }

  /**
   * Get billing summary
   * GET /club/:clubId/billing/summary
   */
  async getBillingSummary(request, reply) {
    try {
      // clubId derived from authenticated user
      const filters = request.query;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const summary = await this.invoiceService.getBillingSummary(clubId, filters);

      reply.code(200).send({
        success: true,
        summary
      });
    } catch (error) {
      request.log.error('Error fetching billing summary:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch billing summary'
      });
    }
  }

  // Note: Billing settings and scheduled jobs routes removed
  // These were used for bulk invoicing which has been replaced by subscription-based billing
}
