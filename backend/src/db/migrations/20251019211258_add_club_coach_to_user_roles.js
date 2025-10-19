/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  // For PostgreSQL, we need to alter the type
  // For MySQL, we need to modify the column
  return knex.schema.alterTable('user_roles', (table) => {
    // Drop the existing enum constraint
    table.dropColumn('role');
  }).then(() => {
    return knex.schema.alterTable('user_roles', (table) => {
      // Recreate with club_coach added
      table.enum('role', ['club_manager', 'club_coach', 'member', 'parent']).notNullable();
    });
  }).then(() => {
    // Do the same for user_accounts table
    return knex.schema.alterTable('user_accounts', (table) => {
      table.dropColumn('role');
    });
  }).then(() => {
    return knex.schema.alterTable('user_accounts', (table) => {
      table.enum('role', ['club_manager', 'club_coach', 'member', 'parent']).notNullable();
    });
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  // Revert back to original enum values (without club_coach)
  return knex.schema.alterTable('user_roles', (table) => {
    table.dropColumn('role');
  }).then(() => {
    return knex.schema.alterTable('user_roles', (table) => {
      table.enum('role', ['club_manager', 'member', 'parent']).notNullable();
    });
  }).then(() => {
    return knex.schema.alterTable('user_accounts', (table) => {
      table.dropColumn('role');
    });
  }).then(() => {
    return knex.schema.alterTable('user_accounts', (table) => {
      table.enum('role', ['club_manager', 'member', 'parent']).notNullable();
    });
  });
}
