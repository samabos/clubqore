/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'onboarding_completed_at');
  
  if (!hasColumn) {
    return knex.schema.alterTable('users', (table) => {
      table.timestamp('onboarding_completed_at');
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'onboarding_completed_at');
  
  if (hasColumn) {
    return knex.schema.alterTable('users', (table) => {
      table.dropColumn('onboarding_completed_at');
    });
  }
}
