/**
 * Migration: Add soft delete support to seasons table
 *
 * Adds deleted_at column to enable soft deletes for seasons
 */

export async function up(knex) {
  await knex.schema.table('seasons', (table) => {
    table.timestamp('deleted_at').nullable();
    table.index('deleted_at');
  });
}

export async function down(knex) {
  await knex.schema.table('seasons', (table) => {
    table.dropColumn('deleted_at');
  });
}
