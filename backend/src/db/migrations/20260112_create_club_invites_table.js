/**
 * Migration: Create club_invites table for both club and parent invitations
 *
 * Supports two invite types:
 * 1. 'club' - Traditional club invites for new members
 * 2. 'parent' - Parent invites for self-registration with children
 */
export async function up(knex) {
  await knex.schema.createTable('club_invites', (table) => {
    table.increments('id').primary();

    // Core invite fields
    table.string('invite_code', 50).notNullable().unique();
    table.string('invite_type', 20).notNullable().defaultTo('club'); // 'club' or 'parent'
    table.integer('club_id').notNullable();
    table.integer('invited_by').notNullable(); // User who created the invite

    // Parent-specific fields (for 'parent' invite type)
    table.string('invitee_email', 255); // Required for parent invites
    table.string('invitee_first_name', 100); // Optional pre-fill
    table.string('invitee_last_name', 100); // Optional pre-fill

    // Status and usage tracking
    table.boolean('is_used').defaultTo(false);
    table.integer('used_by'); // User ID who registered using this invite
    table.timestamp('used_at', { useTz: true });
    table.timestamp('expires_at', { useTz: true }).notNullable();

    // Audit timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('club_id').references('id').inTable('clubs').onDelete('CASCADE');
    table.foreign('invited_by').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('used_by').references('id').inTable('users').onDelete('SET NULL');

    // Indexes for performance
    table.index(['invite_code'], 'club_invites_invite_code_index');
    table.index(['club_id'], 'club_invites_club_id_index');
    table.index(['invite_type'], 'club_invites_invite_type_index');
    table.index(['invitee_email'], 'club_invites_invitee_email_index');
    table.index(['is_used'], 'club_invites_is_used_index');
    table.index(['expires_at'], 'club_invites_expires_at_index');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('club_invites');
}
