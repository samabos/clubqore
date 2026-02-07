/**
 * Migration: Create Worker Executions Table
 *
 * Tracks execution history for background workers (billing, payments, notifications).
 * Enables monitoring, debugging, and manual triggering of worker processes.
 */

export async function up(knex) {
  await knex.schema.createTable('worker_executions', (table) => {
    table.increments('id').primary();
    table.string('worker_name', 100).notNullable();
    table.string('status', 50).notNullable().defaultTo('running');
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.integer('duration_ms');
    table.integer('items_processed').defaultTo(0);
    table.integer('items_successful').defaultTo(0);
    table.integer('items_failed').defaultTo(0);
    table.text('error_message');
    table.jsonb('metadata');
    table.timestamps(true, true);

    // Indexes for common queries
    table.index('worker_name');
    table.index('status');
    table.index('started_at');
    table.index(['worker_name', 'started_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('worker_executions');
}
