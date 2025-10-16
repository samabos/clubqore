/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('users', (table) => {
    // User profile fields
    table.string('name').nullable();
    table.text('avatar').nullable();
    
    // Role and account management
    table.json('roles').defaultTo('["member"]');
    table.string('primary_role').defaultTo('member');
    table.string('account_type').nullable(); // member, parent, club
    
    // Onboarding and verification
    table.boolean('is_onboarded').defaultTo(false);
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at').nullable();
    
    // Club and family associations
    table.string('club_id').nullable();
    table.json('children').nullable(); // For parent accounts
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('name');
    table.dropColumn('avatar');
    table.dropColumn('roles');
    table.dropColumn('primary_role');
    table.dropColumn('account_type');
    table.dropColumn('is_onboarded');
    table.dropColumn('email_verified');
    table.dropColumn('email_verified_at');
    table.dropColumn('club_id');
    table.dropColumn('children');
  });
}
