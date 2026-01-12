import { InvoiceService } from '../services/InvoiceService.js';
import { BillingSettingsService } from '../services/BillingSettingsService.js';
import { ScheduledInvoiceJobService } from '../services/ScheduledInvoiceJobService.js';
import { ClubService } from '../services/ClubService.js';
import { emailService } from '../../services/emailService.js';

export class BillingController {
  constructor(db) {
    this.db = db;
    this.invoiceService = new InvoiceService(db);
    this.billingSettingsService = new BillingSettingsService(db);
    this.scheduledJobService = new ScheduledInvoiceJobService(db);
    this.clubService = new ClubService(db);
  }

  /**
   * Check if user has super_admin role
   */
  async isSuperAdmin(userId) {
    try {
      const userRoles = await this.db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('user_roles.user_id', userId)
        .select('roles.name');

      return userRoles.some(role => role.name === 'super_admin');
    } catch (error) {
      console.error('Error checking super admin role:', error);
      return false;
    }
  }

  // ==================== INVOICE ROUTES ====================

  /**
   * Create a new invoice
   * POST /billing/invoices
   */
  async createInvoice(request, reply) {
    try {
      const invoiceData = request.body;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Apply service charge if enabled
      const itemsWithCharge = await this.billingSettingsService.applyServiceCharge(
        clubId,
        invoiceData.items
      );

      const result = await this.invoiceService.createInvoice(
        clubId,
        { ...invoiceData, items: itemsWithCharge },
        userId
      );

      reply.code(201).send(result);
    } catch (error) {
      request.log.error('Error creating invoice:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to create invoice'
      });
    }
  }

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

      // Apply service charge if items provided
      if (invoiceData.items) {
        const itemsWithCharge = await this.billingSettingsService.applyServiceCharge(
          clubId,
          invoiceData.items
        );
        invoiceData.items = itemsWithCharge;
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
   * Generate seasonal invoices in bulk
   * POST /club/:clubId/billing/invoices/bulk/seasonal
   */
  async generateSeasonalInvoices(request, reply) {
    try {
      // clubId derived from authenticated user
      const bulkData = request.body;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Apply service charge to items
      const itemsWithCharge = await this.billingSettingsService.applyServiceCharge(
        clubId,
        bulkData.items
      );

      const result = await this.invoiceService.generateSeasonalInvoices(
        clubId,
        { ...bulkData, items: itemsWithCharge },
        userId
      );

      // Send email notifications to parents for published invoices
      if (result.success && result.invoices && result.invoices.length > 0) {
        try {
          const club = await this.db('clubs').where('id', clubId).first();

          for (const invoice of result.invoices) {
            // Only send emails for published invoices
            if (invoice.status === 'pending') {
              try {
                // Get parent data via user_children relationship
                const parent = await this.db('users')
                  .join('user_children', 'users.id', 'user_children.parent_id')
                  .where('user_children.child_id', invoice.user_id)
                  .select('users.*')
                  .first();

                if (parent && parent.email) {
                  // Get member data
                  const member = await this.db('users')
                    .where('id', invoice.user_id)
                    .first();

                  // Send email notification
                  await emailService.sendInvoiceNotification({
                    invoiceData: invoice,
                    parentData: parent,
                    memberData: member,
                    clubData: club
                  });

                  request.log.info(`Bulk invoice notification sent to parent ${parent.email} for invoice ${invoice.invoice_number}`);
                }
              } catch (emailError) {
                // Log but don't fail for individual email errors
                request.log.error(`Failed to send email for invoice ${invoice.invoice_number}:`, emailError);
              }
            }
          }
        } catch (emailError) {
          // Log but don't fail the request if bulk email sending fails
          request.log.error('Failed to send bulk invoice email notifications:', emailError);
        }
      }

      reply.code(201).send(result);
    } catch (error) {
      request.log.error('Error generating seasonal invoices:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to generate seasonal invoices'
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

  // ==================== BILLING SETTINGS ROUTES ====================

  /**
   * Get billing settings
   * GET /club/:clubId/billing/settings
   */
  async getSettings(request, reply) {
    try {
      // clubId derived from authenticated user
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const settings = await this.billingSettingsService.getSettings(clubId);

      reply.code(200).send({
        success: true,
        settings
      });
    } catch (error) {
      request.log.error('Error fetching billing settings:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch billing settings'
      });
    }
  }

  /**
   * Update billing settings
   * PUT /club/:clubId/billing/settings
   */
  async updateSettings(request, reply) {
    try {
      // clubId derived from authenticated user
      const settingsData = request.body;
      const userId = request.user.id;

      // Get user's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Check if user is super admin
      const isSuperAdmin = await this.isSuperAdmin(userId);

      // If NOT super admin, strip out service charge fields
      const allowedData = { ...settingsData };
      if (!isSuperAdmin) {
        delete allowedData.service_charge_enabled;
        delete allowedData.service_charge_type;
        delete allowedData.service_charge_value;
        delete allowedData.service_charge_description;
      }

      const result = await this.billingSettingsService.updateSettings(clubId, allowedData);

      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating billing settings:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update billing settings'
      });
    }
  }

  // ==================== SCHEDULED JOBS ROUTES ====================

  /**
   * Get scheduled invoice jobs
   * GET /club/:clubId/billing/scheduled-jobs
   */
  async getScheduledJobs(request, reply) {
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

      const jobs = await this.scheduledJobService.getJobsByClub(clubId, filters);

      reply.code(200).send({
        success: true,
        jobs
      });
    } catch (error) {
      request.log.error('Error fetching scheduled jobs:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch scheduled jobs'
      });
    }
  }
}
