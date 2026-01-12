/**
 * Migration: Create Subscription and Payment Tables
 *
 * This migration creates all tables needed for the subscription and payment system:
 * - membership_tiers: Club-defined subscription tiers
 * - payment_customers: Provider-agnostic customer mapping
 * - payment_mandates: Direct Debit mandates
 * - subscriptions: Member subscriptions
 * - provider_payments: Payment records
 * - payment_methods: Stored payment methods
 * - subscription_events: Audit log
 * - payment_webhooks: Webhook event log
 */

export async function up(knex) {
  // 1. Membership Tiers - Club-defined subscription levels
  await knex.schema.createTable('membership_tiers', (table) => {
    table.increments('id').primary();
    table.integer('club_id').unsigned().notNullable()
      .references('id').inTable('clubs').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.text('description');
    table.decimal('monthly_price', 10, 2).notNullable();
    table.decimal('annual_price', 10, 2);
    table.string('billing_frequency', 20).defaultTo('monthly'); // 'monthly' | 'annual'
    table.jsonb('features'); // Array of included features
    table.boolean('is_active').defaultTo(true);
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);

    table.unique(['club_id', 'name']);
    table.index('club_id');
    table.index('is_active');
  });

  // 2. Payment Customers - Provider-agnostic customer mapping
  await knex.schema.createTable('payment_customers', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.integer('club_id').unsigned().notNullable()
      .references('id').inTable('clubs').onDelete('CASCADE');
    table.string('provider', 50).notNullable(); // 'gocardless', 'stripe', etc.
    table.string('provider_customer_id', 100).notNullable();
    table.string('email', 255);
    table.string('given_name', 100);
    table.string('family_name', 100);
    table.jsonb('metadata'); // Encrypted sensitive data
    table.timestamps(true, true);

    table.unique(['user_id', 'club_id', 'provider']);
    table.unique(['provider', 'provider_customer_id']);
    table.index('user_id');
    table.index('club_id');
    table.index('provider');
  });

  // 3. Payment Mandates - Direct Debit mandates (provider-agnostic)
  await knex.schema.createTable('payment_mandates', (table) => {
    table.increments('id').primary();
    table.integer('payment_customer_id').unsigned().notNullable()
      .references('id').inTable('payment_customers').onDelete('CASCADE');
    table.string('provider', 50).notNullable();
    table.string('provider_mandate_id', 100).notNullable();
    table.string('scheme', 50).notNullable(); // 'bacs', 'sepa_core', 'ach', etc.
    table.string('status', 50).notNullable(); // 'pending_submission', 'submitted', 'active', 'cancelled', 'failed', 'expired'
    table.string('reference', 100); // Bank reference
    table.date('next_possible_charge_date');
    table.jsonb('metadata');
    table.timestamp('cancelled_at');
    table.timestamps(true, true);

    table.unique(['provider', 'provider_mandate_id']);
    table.index('payment_customer_id');
    table.index('status');
    table.index('provider');
  });

  // 4. Subscriptions - Member subscriptions
  await knex.schema.createTable('subscriptions', (table) => {
    table.increments('id').primary();
    table.integer('club_id').unsigned().notNullable()
      .references('id').inTable('clubs').onDelete('CASCADE');
    table.integer('parent_user_id').unsigned().notNullable()
      .references('id').inTable('users'); // Who pays
    table.integer('child_user_id').unsigned().notNullable()
      .references('id').inTable('users'); // Who the subscription is for
    table.integer('membership_tier_id').unsigned().notNullable()
      .references('id').inTable('membership_tiers');
    table.integer('payment_mandate_id').unsigned()
      .references('id').inTable('payment_mandates').onDelete('SET NULL');

    table.string('status', 50).notNullable().defaultTo('pending'); // 'pending', 'active', 'paused', 'cancelled', 'suspended'
    table.string('billing_frequency', 20).notNullable(); // 'monthly' | 'annual'
    table.integer('billing_day_of_month').unsigned(); // 1-28 for monthly billing
    table.decimal('amount', 10, 2).notNullable(); // Current subscription amount

    table.date('current_period_start');
    table.date('current_period_end');
    table.date('next_billing_date');

    table.date('trial_end_date');
    table.timestamp('cancelled_at');
    table.text('cancellation_reason');
    table.timestamp('paused_at');
    table.date('resume_date');

    table.integer('failed_payment_count').defaultTo(0);
    table.timestamp('last_failed_payment_date');

    table.jsonb('metadata');
    table.timestamps(true, true);

    table.unique(['child_user_id', 'club_id']); // One subscription per child per club
    table.index('club_id');
    table.index('parent_user_id');
    table.index('child_user_id');
    table.index('membership_tier_id');
    table.index('status');
    table.index('next_billing_date');
  });

  // 5. Provider Payments - Payment records (provider-agnostic)
  await knex.schema.createTable('provider_payments', (table) => {
    table.increments('id').primary();
    table.integer('subscription_id').unsigned()
      .references('id').inTable('subscriptions').onDelete('SET NULL');
    table.integer('invoice_id').unsigned()
      .references('id').inTable('invoices').onDelete('SET NULL');
    table.string('provider', 50).notNullable();
    table.string('provider_payment_id', 100).notNullable();
    table.integer('payment_mandate_id').unsigned()
      .references('id').inTable('payment_mandates').onDelete('SET NULL');

    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('GBP');
    table.string('status', 50).notNullable(); // 'pending_submission', 'submitted', 'confirmed', 'paid_out', 'cancelled', 'failed'
    table.date('charge_date');
    table.string('description', 255);

    table.string('failure_reason', 255);
    table.integer('retry_count').defaultTo(0);

    table.string('payout_id', 100); // For reconciliation
    table.timestamp('paid_out_at');

    table.jsonb('metadata');
    table.timestamps(true, true);

    table.unique(['provider', 'provider_payment_id']);
    table.index('subscription_id');
    table.index('invoice_id');
    table.index('payment_mandate_id');
    table.index('status');
    table.index('charge_date');
  });

  // 6. Payment Methods - Stored payment methods
  await knex.schema.createTable('payment_methods', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('type', 50).notNullable(); // 'card' | 'direct_debit'
    table.string('provider', 50).notNullable(); // 'gocardless', 'stripe', etc.

    // For cards
    table.string('card_brand', 20); // 'visa', 'mastercard', etc.
    table.string('card_last4', 4);
    table.integer('card_exp_month');
    table.integer('card_exp_year');

    // For direct debit (reference to mandate)
    table.integer('payment_mandate_id').unsigned()
      .references('id').inTable('payment_mandates').onDelete('CASCADE');

    table.string('provider_payment_method_id', 100); // External reference
    table.boolean('is_default').defaultTo(false);
    table.string('status', 50).defaultTo('active'); // 'active', 'expired', 'revoked'

    table.jsonb('metadata');
    table.timestamps(true, true);

    table.index('user_id');
    table.index('type');
    table.index('provider');
    table.index('is_default');
  });

  // 7. Subscription Events - Audit log
  await knex.schema.createTable('subscription_events', (table) => {
    table.increments('id').primary();
    table.integer('subscription_id').unsigned().notNullable()
      .references('id').inTable('subscriptions').onDelete('CASCADE');
    table.string('event_type', 100).notNullable(); // 'created', 'activated', 'paused', 'resumed', 'cancelled', 'tier_changed', 'payment_failed', 'payment_succeeded', 'suspended'
    table.string('previous_status', 50);
    table.string('new_status', 50);
    table.integer('previous_tier_id').unsigned()
      .references('id').inTable('membership_tiers').onDelete('SET NULL');
    table.integer('new_tier_id').unsigned()
      .references('id').inTable('membership_tiers').onDelete('SET NULL');
    table.text('description');
    table.string('actor_type', 50); // 'user', 'system', 'webhook'
    table.integer('actor_id').unsigned(); // User ID if actor_type is 'user'
    table.string('ip_address', 45); // IPv6 compatible
    table.text('user_agent');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('subscription_id');
    table.index('event_type');
    table.index('created_at');
  });

  // 8. Payment Webhooks - Webhook event log (provider-agnostic)
  await knex.schema.createTable('payment_webhooks', (table) => {
    table.increments('id').primary();
    table.string('provider', 50).notNullable();
    table.string('event_id', 100).notNullable();
    table.string('resource_type', 50).notNullable(); // 'mandates', 'payments', 'subscriptions', etc.
    table.string('action', 50).notNullable(); // 'created', 'cancelled', 'failed', etc.
    table.string('resource_id', 100); // ID of the affected resource
    table.jsonb('payload').notNullable(); // Encrypted webhook payload
    table.boolean('signature_valid').defaultTo(false);
    table.boolean('processed').defaultTo(false);
    table.timestamp('processed_at');
    table.text('error_message');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['provider', 'event_id']);
    table.index('provider');
    table.index('processed');
    table.index('resource_type');
    table.index('created_at');
  });

  // Add check constraint for billing_day_of_month (1-28)
  await knex.raw(`
    ALTER TABLE subscriptions
    ADD CONSTRAINT chk_billing_day_of_month
    CHECK (billing_day_of_month IS NULL OR (billing_day_of_month >= 1 AND billing_day_of_month <= 28))
  `);
}

export async function down(knex) {
  // Remove check constraint first
  await knex.raw(`
    ALTER TABLE subscriptions
    DROP CONSTRAINT IF EXISTS chk_billing_day_of_month
  `);

  // Drop tables in reverse order of creation (respecting foreign key dependencies)
  await knex.schema.dropTableIfExists('payment_webhooks');
  await knex.schema.dropTableIfExists('subscription_events');
  await knex.schema.dropTableIfExists('payment_methods');
  await knex.schema.dropTableIfExists('provider_payments');
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('payment_mandates');
  await knex.schema.dropTableIfExists('payment_customers');
  await knex.schema.dropTableIfExists('membership_tiers');
}
