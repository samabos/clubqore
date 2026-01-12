/**
 * Migration: Create billing tables
 * Creates 5 tables for the billing module:
 * - invoices: Main invoice records (linked to users, not members)
 * - invoice_items: Line items for invoices
 * - payments: Payment records for invoices
 * - billing_settings: Club-level billing configuration (service charges, auto-generation)
 * - scheduled_invoice_jobs: Track automatic invoice generation jobs
 */

export async function up(knex) {
  // 1. Create invoices table
  await knex.schema.createTable('invoices', (table) => {
    table.increments('id').primary();
    table.integer('club_id').notNullable();
    table.integer('user_id').notNullable();
    table.integer('season_id').nullable();
    table.string('invoice_number', 50).notNullable().unique();
    table.string('invoice_type', 20).notNullable(); // 'seasonal' | 'adhoc'
    table.string('status', 20).notNullable().defaultTo('draft'); // 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'

    table.date('issue_date').notNullable();
    table.date('due_date').notNullable();
    table.date('paid_date').nullable();

    table.decimal('subtotal', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('discount_amount', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('amount_paid', 10, 2).notNullable().defaultTo(0.00);

    table.text('notes').nullable();

    table.integer('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('club_id').references('id').inTable('clubs').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('season_id').references('id').inTable('seasons').onDelete('SET NULL');
    table.foreign('created_by').references('id').inTable('users');

    // Indexes
    table.index('club_id', 'idx_invoices_club_id');
    table.index('user_id', 'idx_invoices_user_id');
    table.index('season_id', 'idx_invoices_season_id');
    table.index('status', 'idx_invoices_status');
    table.index('due_date', 'idx_invoices_due_date');
  });

  // 2. Create invoice_items table
  await knex.schema.createTable('invoice_items', (table) => {
    table.increments('id').primary();
    table.integer('invoice_id').notNullable();

    table.string('description', 255).notNullable();
    table.string('category', 50).nullable(); // 'membership' | 'training' | 'equipment' | 'tournament' | 'other'
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('total_price', 10, 2).notNullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key
    table.foreign('invoice_id').references('id').inTable('invoices').onDelete('CASCADE');

    // Index
    table.index('invoice_id', 'idx_invoice_items_invoice_id');
  });

  // 3. Create payments table
  await knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table.integer('invoice_id').notNullable();

    table.decimal('amount', 10, 2).notNullable();
    table.string('payment_method', 50).nullable(); // 'cash' | 'bank_transfer' | 'card' | 'online'
    table.date('payment_date').notNullable();

    table.string('reference_number', 100).nullable();
    table.text('notes').nullable();

    table.integer('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('invoice_id').references('id').inTable('invoices').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users');

    // Index
    table.index('invoice_id', 'idx_payments_invoice_id');
  });

  // 4. Create billing_settings table
  await knex.schema.createTable('billing_settings', (table) => {
    table.increments('id').primary();
    table.integer('club_id').notNullable().unique();

    // Platform service charge
    table.boolean('service_charge_enabled').defaultTo(true);
    table.string('service_charge_type', 20).defaultTo('percentage'); // 'percentage' | 'fixed'
    table.decimal('service_charge_value', 10, 2).defaultTo(0.00);
    table.string('service_charge_description', 255).defaultTo('Platform Service Fee');

    // Auto-generation settings
    table.boolean('auto_generation_enabled').defaultTo(false);
    table.integer('days_before_season').defaultTo(7); // Generate invoices N days before season starts
    table.jsonb('default_invoice_items').nullable(); // Default line items for seasonal invoices

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key
    table.foreign('club_id').references('id').inTable('clubs').onDelete('CASCADE');

    // Index
    table.index('club_id', 'idx_billing_settings_club_id');
  });

  // 5. Create scheduled_invoice_jobs table
  await knex.schema.createTable('scheduled_invoice_jobs', (table) => {
    table.increments('id').primary();
    table.integer('club_id').notNullable();
    table.integer('season_id').notNullable();

    table.date('scheduled_date').notNullable(); // When invoices should be generated
    table.string('status', 20).defaultTo('pending'); // 'pending' | 'completed' | 'failed'
    table.timestamp('generated_at').nullable();
    table.integer('invoices_generated').defaultTo(0);
    table.text('error_message').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('club_id').references('id').inTable('clubs').onDelete('CASCADE');
    table.foreign('season_id').references('id').inTable('seasons').onDelete('CASCADE');

    // Unique constraint - one job per club per season
    table.unique(['club_id', 'season_id'], 'uk_scheduled_jobs_club_season');

    // Indexes
    table.index(['scheduled_date', 'status'], 'idx_scheduled_jobs_scheduled_date');
    table.index(['club_id', 'season_id'], 'idx_scheduled_jobs_club_season');
  });

  // Create default billing_settings for existing clubs
  const existingClubs = await knex('clubs').select('id');
  if (existingClubs.length > 0) {
    const defaultSettings = existingClubs.map((club) => ({
      club_id: club.id,
      service_charge_enabled: false, // Disabled by default, admin can enable
      service_charge_type: 'percentage',
      service_charge_value: 0.00,
      service_charge_description: 'Platform Service Fee',
      auto_generation_enabled: false,
      days_before_season: 7,
      default_invoice_items: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }));
    await knex('billing_settings').insert(defaultSettings);
  }

  console.log('✅ Billing tables created successfully');
  console.log(`✅ Created default billing settings for ${existingClubs.length} existing clubs`);
}

export async function down(knex) {
  // Drop tables in reverse order to respect foreign key constraints
  await knex.schema.dropTableIfExists('scheduled_invoice_jobs');
  await knex.schema.dropTableIfExists('billing_settings');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('invoice_items');
  await knex.schema.dropTableIfExists('invoices');

  console.log('✅ Billing tables dropped successfully');
}
