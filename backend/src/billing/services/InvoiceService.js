export class InvoiceService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Generate unique invoice number
   * Format: {YEAR}-{SEQUENCE}-{SUFFIX}
   *
   * Uses a 4-character random suffix to guarantee uniqueness
   * even when multiple invoices are created concurrently.
   *
   * @param {number} clubId - Club ID
   * @param {Object} trx - Knex transaction (optional, uses this.db if not provided)
   */
  async generateInvoiceNumber(clubId, trx = null) {
    const db = trx || this.db;
    const year = new Date().getFullYear();
    const prefix = `${year}-`;

    // Get the count of invoices for this year and club for sequential numbering
    const result = await db('invoices')
      .where('club_id', clubId)
      .where('invoice_number', 'like', `${prefix}%`)
      .count('* as count')
      .first();

    const sequence = (parseInt(result?.count) || 0) + 1;

    // Add random 4-char suffix to guarantee uniqueness
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `${prefix}${String(sequence).padStart(4, '0')}-${suffix}`;
  }

  /**
   * Calculate invoice totals from items
   */
  calculateInvoiceTotals(items, taxAmount = 0, discountAmount = 0) {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const total = subtotal + taxAmount - discountAmount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }

  /**
   * Create a new invoice with line items
   * Includes retry logic for concurrent invoice number generation
   */
  async createInvoice(clubId, invoiceData, userId, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const trx = await this.db.transaction();

      try {
        // Validate and parse user_id
        const parsedUserId = parseInt(invoiceData.user_id);
        if (isNaN(parsedUserId) || parsedUserId <= 0) {
          throw new Error(`Invalid user_id: "${invoiceData.user_id}". Must be a valid positive integer.`);
        }

        // Validate user exists
        const user = await trx('user_children')
          .select('parent_user_id', 'child_user_id')
          .where('child_user_id', parsedUserId)
          .first();

        if (!user) {
          throw new Error(`User not found with id: ${parsedUserId}`);
        }

        const parentUserId = user.parent_user_id;
        const childUserId = user.child_user_id;

        // Calculate totals
        const { subtotal, total } = this.calculateInvoiceTotals(
          invoiceData.items,
          invoiceData.tax_amount || 0,
          invoiceData.discount_amount || 0
        );

        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber(clubId, trx);

        // Insert invoice
        const invoiceStatus = invoiceData.status || 'draft';

        const [result] = await trx('invoices')
          .insert({
            club_id: clubId,
            parent_user_id: parentUserId,
            child_user_id: childUserId,
            season_id: invoiceData.season_id || null,
            invoice_number: invoiceNumber,
            invoice_type: invoiceData.invoice_type,
            status: invoiceStatus,
            issue_date: invoiceData.issue_date,
            due_date: invoiceData.due_date,
            subtotal,
            tax_amount: invoiceData.tax_amount || 0,
            discount_amount: invoiceData.discount_amount || 0,
            total_amount: total,
            amount_paid: 0,
            notes: invoiceData.notes || null,
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning('id');

        const invoiceId = typeof result === 'object' ? result.id : result;

        // Insert invoice items
        const itemsToInsert = invoiceData.items.map(item => ({
          invoice_id: invoiceId,
          description: item.description,
          category: item.category || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price,
          total_price: (item.quantity || 1) * item.unit_price,
          created_at: new Date(),
          updated_at: new Date()
        }));

        await trx('invoice_items').insert(itemsToInsert);

        await trx.commit();

        return {
          success: true,
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          message: 'Invoice created successfully'
        };
      } catch (error) {
        await trx.rollback();
        lastError = error;

        // Check if it's a duplicate key error - retry if so
        if (error.code === '23505' && error.constraint === 'invoices_invoice_number_unique') {
          console.log(`Invoice number conflict on attempt ${attempt}, retrying...`);
          // Small random delay to reduce collision probability
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
          continue;
        }

        // For other errors, don't retry
        console.error('Error creating invoice:', error);
        throw error;
      }
    }

    // All retries exhausted
    console.error('Failed to create invoice after all retries:', lastError);
    throw lastError;
  }

  /**
   * Get invoice by ID with items
   */
  async getInvoiceById(invoiceId, clubId) {
    try {
      const invoice = await this.db('invoices')
        .select(
          'invoices.*',
          // Child information
          'child_users.email as child_email',
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.child_user_id)
            ) as child_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              ''
            ) as child_last_name
          `),
          // Parent information
          'parent_users.email as parent_email',
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.parent_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.parent_user_id)
            ) as parent_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.parent_user_id),
              ''
            ) as parent_last_name
          `),
          // Keep old field names for backward compatibility (use child info)
          'child_users.email as user_email',
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.child_user_id)
            ) as user_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              ''
            ) as user_last_name
          `),
          'seasons.name as season_name'
        )
        .leftJoin('users as child_users', 'invoices.child_user_id', 'child_users.id')
        .leftJoin('users as parent_users', 'invoices.parent_user_id', 'parent_users.id')
        .leftJoin('seasons', 'invoices.season_id', 'seasons.id')
        .where('invoices.id', invoiceId)
        .where('invoices.club_id', clubId)
        .first();

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get invoice items
      const items = await this.db('invoice_items')
        .select('*')
        .where('invoice_id', invoiceId)
        .orderBy('id', 'asc');

      // Get payments
      const payments = await this.db('payments')
        .select('*')
        .where('invoice_id', invoiceId)
        .orderBy('payment_date', 'desc');

      // Convert numeric fields to proper numbers
      return {
        ...invoice,
        subtotal: parseFloat(invoice.subtotal) || 0,
        tax_amount: parseFloat(invoice.tax_amount) || 0,
        discount_amount: parseFloat(invoice.discount_amount) || 0,
        total_amount: parseFloat(invoice.total_amount) || 0,
        amount_paid: parseFloat(invoice.amount_paid) || 0,
        items: items.map(item => ({
          ...item,
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          total_price: parseFloat(item.total_price) || 0
        })),
        payments
      };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  /**
   * Get all invoices for a club with filters
   */
  async getInvoicesByClub(clubId, filters = {}) {
    try {
      let query = this.db('invoices')
        .select(
          'invoices.*',
          // Child information
          'child_users.email as child_email',
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.child_user_id)
            ) as child_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              ''
            ) as child_last_name
          `),
          // Parent information
          'parent_users.email as parent_email',
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.parent_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.parent_user_id)
            ) as parent_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.parent_user_id),
              ''
            ) as parent_last_name
          `),
          // Keep old field names for backward compatibility (use child info)
          'child_users.email as user_email',
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.child_user_id)
            ) as user_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              ''
            ) as user_last_name
          `),
          'seasons.name as season_name'
        )
        .leftJoin('users as child_users', 'invoices.child_user_id', 'child_users.id')
        .leftJoin('users as parent_users', 'invoices.parent_user_id', 'parent_users.id')
        .leftJoin('seasons', 'invoices.season_id', 'seasons.id')
        .where('invoices.club_id', clubId);

      // Apply filters
      if (filters.status) {
        query = query.where('invoices.status', filters.status);
      }

      if (filters.season_id) {
        query = query.where('invoices.season_id', filters.season_id);
      }

      if (filters.user_id) {
        // Support filtering by either parent or child user ID
        query = query.where(function() {
          this.where('invoices.parent_user_id', filters.user_id)
            .orWhere('invoices.child_user_id', filters.user_id);
        });
      }

      if (filters.invoice_type) {
        query = query.where('invoices.invoice_type', filters.invoice_type);
      }

      if (filters.from_date) {
        query = query.where('invoices.issue_date', '>=', filters.from_date);
      }

      if (filters.to_date) {
        query = query.where('invoices.issue_date', '<=', filters.to_date);
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('invoices.invoice_number', 'ilike', `%${filters.search}%`)
            .orWhereRaw(`
              EXISTS (
                SELECT 1 FROM users u
                LEFT JOIN user_profiles up ON up.user_id = u.id
                WHERE u.id = invoices.child_user_id
                AND (
                  up.first_name ILIKE ? OR
                  up.last_name ILIKE ? OR
                  u.email ILIKE ?
                )
              )
            `, [`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`]);
        });
      }

      const invoices = await query.orderBy('invoices.created_at', 'desc');

      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoices for a specific user (for club view)
   */
  async getInvoicesByUser(clubId, userId) {
    try {
      const invoices = await this.db('invoices')
        .select(
          'invoices.*',
          'seasons.name as season_name'
        )
        .leftJoin('seasons', 'invoices.season_id', 'seasons.id')
        .where('invoices.club_id', clubId)
        .where(function() {
          // Support filtering by either parent or child user ID
          this.where('invoices.parent_user_id', userId)
            .orWhere('invoices.child_user_id', userId);
        })
        .orderBy('invoices.created_at', 'desc');

      return invoices;
    } catch (error) {
      console.error('Error fetching user invoices:', error);
      throw error;
    }
  }

  /**
   * Update invoice (only draft status)
   */
  async updateInvoice(invoiceId, clubId, invoiceData) {
    const trx = await this.db.transaction();

    try {
      // Check invoice exists and is draft
      const invoice = await trx('invoices')
        .where('id', invoiceId)
        .where('club_id', clubId)
        .where('status', 'draft')
        .first();

      if (!invoice) {
        throw new Error('Invoice not found or cannot be edited');
      }

      // Calculate new totals if items provided
      const updateData = {
        ...invoiceData,
        updated_at: new Date()
      };

      if (invoiceData.items) {
        const { subtotal, total } = this.calculateInvoiceTotals(
          invoiceData.items,
          invoiceData.tax_amount || invoice.tax_amount,
          invoiceData.discount_amount || invoice.discount_amount
        );

        updateData.subtotal = subtotal;
        updateData.total_amount = total;

        // Delete old items and insert new ones
        await trx('invoice_items').where('invoice_id', invoiceId).del();

        const itemsToInsert = invoiceData.items.map(item => ({
          invoice_id: invoiceId,
          description: item.description,
          category: item.category || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price,
          total_price: (item.quantity || 1) * item.unit_price,
          created_at: new Date(),
          updated_at: new Date()
        }));

        await trx('invoice_items').insert(itemsToInsert);

        delete updateData.items;
      }

      // Update invoice
      await trx('invoices')
        .where('id', invoiceId)
        .update(updateData);

      await trx.commit();

      return {
        success: true,
        message: 'Invoice updated successfully'
      };
    } catch (error) {
      await trx.rollback();
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Delete invoice (only draft status)
   */
  async deleteInvoice(invoiceId, clubId) {
    try {
      // Check invoice exists and is draft
      const invoice = await this.db('invoices')
        .where('id', invoiceId)
        .where('club_id', clubId)
        .where('status', 'draft')
        .first();

      if (!invoice) {
        throw new Error('Invoice not found or cannot be deleted');
      }

      // Delete invoice (cascade will delete items and payments)
      await this.db('invoices')
        .where('id', invoiceId)
        .del();

      return {
        success: true,
        message: 'Invoice deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  /**
   * Publish invoice (draft -> pending)
   */
  async publishInvoice(invoiceId, clubId) {
    try {
      const invoice = await this.db('invoices')
        .where('id', invoiceId)
        .where('club_id', clubId)
        .where('status', 'draft')
        .first();

      if (!invoice) {
        throw new Error('Invoice not found or already published');
      }

      await this.db('invoices')
        .where('id', invoiceId)
        .update({
          status: 'pending',
          updated_at: new Date()
        });

      return {
        success: true,
        message: 'Invoice published successfully'
      };
    } catch (error) {
      console.error('Error publishing invoice:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(invoiceId, clubId, paymentData, userId) {
    const trx = await this.db.transaction();

    try {
      const query = trx('invoices')
        .where('id', invoiceId)
        .whereIn('status', ['draft', 'pending', 'sent', 'overdue']);

      // Only filter by clubId if provided (internal calls may not have it)
      if (clubId) {
        query.where('club_id', clubId);
      }

      const invoice = await query.first();

      if (!invoice) {
        throw new Error('Invoice not found or cannot be marked as paid');
      }

      // Use provided userId or fall back to invoice's parent_user_id for system payments
      const paymentCreator = userId || invoice.parent_user_id;

      // Record payment
      await trx('payments').insert({
        invoice_id: invoiceId,
        amount: invoice.total_amount,
        payment_method: paymentData.payment_method || null,
        payment_date: paymentData.payment_date || new Date(),
        reference_number: paymentData.reference_number || null,
        notes: paymentData.notes || null,
        created_by: paymentCreator,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Update invoice
      await trx('invoices')
        .where('id', invoiceId)
        .update({
          status: 'paid',
          paid_date: paymentData.payment_date || new Date(),
          amount_paid: invoice.total_amount,
          updated_at: new Date()
        });

      await trx.commit();

      return {
        success: true,
        message: 'Invoice marked as paid successfully'
      };
    } catch (error) {
      await trx.rollback();
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId, clubId) {
    try {
      const invoice = await this.db('invoices')
        .where('id', invoiceId)
        .where('club_id', clubId)
        .whereIn('status', ['draft', 'pending', 'overdue'])
        .first();

      if (!invoice) {
        throw new Error('Invoice not found or cannot be cancelled');
      }

      await this.db('invoices')
        .where('id', invoiceId)
        .update({
          status: 'cancelled',
          updated_at: new Date()
        });

      return {
        success: true,
        message: 'Invoice cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      throw error;
    }
  }

  /**
   * Mark overdue invoices
   */
  async markOverdueInvoices(clubId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const result = await this.db('invoices')
        .where('club_id', clubId)
        .where('status', 'pending')
        .where('due_date', '<', today)
        .update({
          status: 'overdue',
          updated_at: new Date()
        });

      return {
        success: true,
        count: result,
        message: `${result} invoice(s) marked as overdue`
      };
    } catch (error) {
      console.error('Error marking overdue invoices:', error);
      throw error;
    }
  }

  // Note: generateSeasonalInvoices method removed - invoices auto-generated via GoCardless webhooks

  /**
   * Get billing summary for a club
   */
  async getBillingSummary(clubId, filters = {}) {
    try {
      let query = this.db('invoices')
        .where('club_id', clubId);

      // Apply filters
      if (filters.season_id) {
        query = query.where('season_id', filters.season_id);
      }

      if (filters.from_date) {
        query = query.where('issue_date', '>=', filters.from_date);
      }

      if (filters.to_date) {
        query = query.where('issue_date', '<=', filters.to_date);
      }

      const invoices = await query.select('status', 'total_amount', 'amount_paid');

      const summary = {
        total_invoices: invoices.length,
        total_amount: 0,
        total_paid: 0,
        total_outstanding: 0,
        overdue_count: 0,
        overdue_amount: 0,
        by_status: {
          draft: 0,
          pending: 0,
          paid: 0,
          overdue: 0,
          cancelled: 0
        }
      };

      invoices.forEach(invoice => {
        summary.total_amount += parseFloat(invoice.total_amount);
        summary.total_paid += parseFloat(invoice.amount_paid);
        summary.by_status[invoice.status]++;

        if (invoice.status === 'overdue') {
          summary.overdue_count++;
          summary.overdue_amount += parseFloat(invoice.total_amount - invoice.amount_paid);
        }

        if (['pending', 'overdue'].includes(invoice.status)) {
          summary.total_outstanding += parseFloat(invoice.total_amount - invoice.amount_paid);
        }
      });

      return summary;
    } catch (error) {
      console.error('Error fetching billing summary:', error);
      throw error;
    }
  }

  /**
   * Get invoices for a parent (their children only)
   */
  async getInvoicesForParent(parentUserId, filters = {}) {
    try {
      // Direct query using parent_user_id - much simpler!
      let query = this.db('invoices')
        .select(
          'invoices.*',
          // Child information
          'child_users.email as child_email',
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.child_user_id)
            ) as child_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              ''
            ) as child_last_name
          `),
          // Parent information
          'parent_users.email as parent_email',
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.parent_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.parent_user_id)
            ) as parent_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.parent_user_id),
              ''
            ) as parent_last_name
          `),
          // Keep old field names for backward compatibility (use child info)
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.child_user_id)
            ) as user_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              ''
            ) as user_last_name
          `),
          'child_users.email as user_email',
          'seasons.name as season_name',
          'clubs.name as club_name'
        )
        .leftJoin('users as child_users', 'invoices.child_user_id', 'child_users.id')
        .leftJoin('users as parent_users', 'invoices.parent_user_id', 'parent_users.id')
        .leftJoin('seasons', 'invoices.season_id', 'seasons.id')
        .leftJoin('clubs', 'invoices.club_id', 'clubs.id')
        .where('invoices.parent_user_id', parentUserId);  // Direct filter - no user_children JOIN needed!

      // Apply filters
      if (filters.status) {
        query = query.where('invoices.status', filters.status);
      }

      if (filters.child_user_id || filters.user_id) {
        // Support both old and new field names
        const childId = filters.child_user_id || filters.user_id;
        query = query.where('invoices.child_user_id', childId);
      }

      const invoices = await query.orderBy('invoices.created_at', 'desc');

      return invoices;
    } catch (error) {
      console.error('Error fetching parent invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice for parent (verify ownership)
   */
  async getInvoiceForParent(invoiceId, parentUserId) {
    try {
      // Direct query using parent_user_id - much simpler!
      const invoice = await this.db('invoices')
        .select(
          'invoices.*',
          // Child information
          'child_users.email as child_email',
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.child_user_id)
            ) as child_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              ''
            ) as child_last_name
          `),
          // Parent information
          'parent_users.email as parent_email',
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.parent_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.parent_user_id)
            ) as parent_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.parent_user_id),
              ''
            ) as parent_last_name
          `),
          // Keep old field names for backward compatibility (use child info)
          this.db.raw(`
            COALESCE(
              (SELECT up.first_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              (SELECT split_part(u.email, '@', 1) FROM users u WHERE u.id = invoices.child_user_id)
            ) as user_first_name
          `),
          this.db.raw(`
            COALESCE(
              (SELECT up.last_name FROM user_profiles up WHERE up.user_id = invoices.child_user_id),
              ''
            ) as user_last_name
          `),
          'child_users.email as user_email',
          'seasons.name as season_name',
          'clubs.name as club_name'
        )
        .leftJoin('users as child_users', 'invoices.child_user_id', 'child_users.id')
        .leftJoin('users as parent_users', 'invoices.parent_user_id', 'parent_users.id')
        .leftJoin('seasons', 'invoices.season_id', 'seasons.id')
        .leftJoin('clubs', 'invoices.club_id', 'clubs.id')
        .where('invoices.id', invoiceId)
        .where('invoices.parent_user_id', parentUserId)  // Direct ownership check!
        .first();

      if (!invoice) {
        throw new Error('Invoice not found or access denied');
      }

      // Get invoice items
      const items = await this.db('invoice_items')
        .select('*')
        .where('invoice_id', invoiceId)
        .orderBy('id', 'asc');

      // Get payments
      const payments = await this.db('payments')
        .select('*')
        .where('invoice_id', invoiceId)
        .orderBy('payment_date', 'desc');

      return {
        ...invoice,
        items,
        payments
      };
    } catch (error) {
      console.error('Error fetching parent invoice:', error);
      throw error;
    }
  }
}
