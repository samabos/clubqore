/**
 * Migration: Drop club_invite_codes table
 *
 * Removes the general member onboarding invite code system.
 * The club_invites table is now used for parent-specific invitations.
 */
export async function up(knex) {
  // Drop the club_invite_codes table if it exists
  await knex.schema.dropTableIfExists('club_invite_codes');
}

export async function down(knex) {
  // Recreate the table if we need to rollback
  if (!(await knex.schema.hasTable('club_invite_codes'))) {
    await knex.schema.createTable('club_invite_codes', (table) => {
      table.increments('id').primary();
      table.string('code', 50).notNullable();
      table.integer('club_id').notNullable();
      table.integer('created_by').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('expires_at', { useTz: true });
      table.integer('usage_limit');
      table.integer('used_count').defaultTo(0);
      table.text('description');
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table
        .foreign('club_id', 'club_invite_codes_club_id_foreign')
        .references('id')
        .inTable('clubs')
        .onDelete('CASCADE');
      table
        .foreign('created_by', 'club_invite_codes_created_by_foreign')
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT');
      table.unique(['code'], { indexName: 'club_invite_codes_code_unique' });
      table.index(['club_id'], 'club_invite_codes_club_id_index');
      table.index(['is_active', 'expires_at'], 'club_invite_codes_is_active_expires_at_index');
    });
  }
}
