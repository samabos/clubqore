export class InvoiceService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Generate unique invoice number
   * Format: INV-{YEAR}-{SEQUENCE}
   */
  async generateInvoiceNumber(clubId) {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Get the highest sequence number for this year and club
    const lastInvoice = await this.db('invoices')
      .where('club_id', clubId)
      .where('invoice_number', 'like', `${prefix}%`)
      .orderBy('invoice_number', 'desc')
      .first();

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoice_number.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
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
   */
  async createInvoice(clubId, invoiceData, userId) {
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

      const parentUserId = user.parent_user_id;  // Parent/guardian responsible for payment (or self)
      const childUserId = user.child_user_id;  // The member/child the invoice is for

      // Calculate totals
      const { subtotal, total } = this.calculateInvoiceTotals(
        invoiceData.items,
        invoiceData.tax_amount || 0,
        invoiceData.discount_amount || 0
      );

      // Check if user is a child (has a parent)
     // const parentRelationship = await trx('user_children')
     //   .where('child_user_id', parsedUserId)
     //   .first();

     // if (parentRelationship) {
     //   // If user is a child, set parent as responsible party
     //   parentUserId = parentRelationship.parent_user_id;
     // }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(clubId);

      // Insert invoice
      const [result] = await trx('invoices')
        .insert({
          club_id: clubId,
          parent_user_id: parentUserId,  // Parent/guardian responsible for payment (or self)
          child_user_id: childUserId,     // The member/child the invoice is for
          season_id: invoiceData.season_id || null,
          invoice_number: invoiceNumber,
          invoice_type: invoiceData.invoice_type,
          status: 'draft',
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

      // Extract the actual ID (handle both object and direct value)
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
      console.error('Error creating invoice:', error);
      throw error;
    }
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
      let updateData = {
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
      const invoice = await trx('invoices')
        .where('id', invoiceId)
        .where('club_id', clubId)
        .whereIn('status', ['pending', 'overdue'])
        .first();

      if (!invoice) {
        throw new Error('Invoice not found or cannot be marked as paid');
      }

      // Record payment
      await trx('payments').insert({
        invoice_id: invoiceId,
        amount: invoice.total_amount,
        payment_method: paymentData.payment_method || null,
        payment_date: paymentData.payment_date || new Date(),
        reference_number: paymentData.reference_number || null,
        notes: paymentData.notes || null,
        created_by: userId,
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

  /**
   * Generate seasonal invoices in bulk
   */
  async generateSeasonalInvoices(clubId, bulkData, userId) {
    const trx = await this.db.transaction();

    try {
      const { season_id, user_ids, items, issue_date, due_date, notes } = bulkData;

      // Validate season belongs to club
      const season = await trx('seasons')
        .where('id', season_id)
        .where('club_id', clubId)
        .first();

      if (!season) {
        throw new Error('Season not found');
      }

      // Calculate totals
      const { subtotal, total } = this.calculateInvoiceTotals(items, 0, 0);

      const createdInvoices = [];

      for (const user_id of user_ids) {
        // Check if user is a child (has a parent)
        const parentRelationship = await trx('user_children')
          .where('child_user_id', user_id)
          .first();

        let parentUserId = user_id;  // Default: user is responsible for their own invoice
        const childUserId = user_id;  // The member/child the invoice is for

        if (parentRelationship) {
          // If user is a child, set parent as responsible party
          parentUserId = parentRelationship.parent_user_id;
        }

        // Check if user already has invoice for this season
        const existingInvoice = await trx('invoices')
          .where('club_id', clubId)
          .where('child_user_id', childUserId)
          .where('season_id', season_id)
          .where('invoice_type', 'seasonal')
          .first();

        if (existingInvoice) {
          console.log(`Skipping user ${user_id}, already has seasonal invoice for this season`);
          continue;
        }

        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber(clubId);

        // Insert invoice
        const [result] = await trx('invoices')
          .insert({
            club_id: clubId,
            parent_user_id: parentUserId,
            child_user_id: childUserId,
            season_id,
            invoice_number: invoiceNumber,
            invoice_type: 'seasonal',
            status: 'draft',
            issue_date,
            due_date,
            subtotal,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: total,
            amount_paid: 0,
            notes,
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning('id');

        // Extract the actual ID (handle both object and direct value)
        const invoiceId = typeof result === 'object' ? result.id : result;

        // Insert invoice items
        const itemsToInsert = items.map(item => ({
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

        createdInvoices.push(invoiceId);
      }

      await trx.commit();

      return {
        success: true,
        count: createdInvoices.length,
        message: `${createdInvoices.length} seasonal invoice(s) created successfully`
      };
    } catch (error) {
      await trx.rollback();
      console.error('Error generating seasonal invoices:', error);
      throw error;
    }
  }

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
