/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('tokens', function (table) {
    // Add metadata column for storing additional token data (like email for verification)
    table.text('metadata').nullable();
    
    // Update the type enum to include email_verification and password_reset
    table.dropColumn('type');
  }).then(() => {
    return knex.schema.alterTable('tokens', function (table) {
      table.enum('type', ['access', 'refresh', 'email_verification', 'password_reset']).notNullable().defaultTo('access');
    });
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('tokens', function (table) {
    // Remove metadata column
    table.dropColumn('metadata');
    
    // Revert type enum back to original
    table.dropColumn('type');
  }).then(() => {
    return knex.schema.alterTable('tokens', function (table) {
      table.enum('type', ['access', 'refresh']).notNullable().defaultTo('access');
    });
  });
}
