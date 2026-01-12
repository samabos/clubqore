/**
 * Migration: Add recurring session support to training_sessions
 *
 * Adds fields to support one-time and recurring sessions
 */

export async function up(knex) {
  await knex.schema.table('training_sessions', (table) => {
    // Recurring pattern fields
    table.boolean('is_recurring').defaultTo(false);
    table.enum('recurrence_pattern', ['daily', 'weekly', 'biweekly', 'monthly']).nullable();
    table.specificType('recurrence_days', 'integer[]').nullable(); // Days of week (0=Sunday, 6=Saturday)
    table.date('recurrence_end_date').nullable();
    table.integer('parent_session_id').unsigned().nullable()
      .references('id').inTable('training_sessions').onDelete('CASCADE'); // Link to parent recurring session

    table.index('is_recurring');
    table.index('parent_session_id');
  });
}

export async function down(knex) {
  await knex.schema.table('training_sessions', (table) => {
    table.dropColumn('is_recurring');
    table.dropColumn('recurrence_pattern');
    table.dropColumn('recurrence_days');
    table.dropColumn('recurrence_end_date');
    table.dropColumn('parent_session_id');
  });
}
