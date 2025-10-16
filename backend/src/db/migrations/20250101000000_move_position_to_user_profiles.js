/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Add position field to user_profiles table
  await knex.schema.alterTable('user_profiles', (table) => {
    table.string('position', 100).nullable();
  });

  // Migrate existing position data from user_accounts to user_profiles
  await knex.raw(`
    UPDATE user_profiles 
    SET position = ua.position 
    FROM user_accounts ua 
    WHERE user_profiles.user_id = ua.user_id 
    AND ua.position IS NOT NULL
  `);

  // Remove position field from user_accounts table
  await knex.schema.alterTable('user_accounts', (table) => {
    table.dropColumn('position');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Add position field back to user_accounts table
  await knex.schema.alterTable('user_accounts', (table) => {
    table.string('position', 100).nullable();
  });

  // Migrate position data back from user_profiles to user_accounts
  await knex.raw(`
    UPDATE user_accounts 
    SET position = up.position 
    FROM user_profiles up 
    WHERE user_accounts.user_id = up.user_id 
    AND up.position IS NOT NULL
  `);

  // Remove position field from user_profiles table
  await knex.schema.alterTable('user_profiles', (table) => {
    table.dropColumn('position');
  });
}
