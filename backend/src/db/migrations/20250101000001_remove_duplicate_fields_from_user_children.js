/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // First, we need to handle any existing data where child_user_id is null
  // but we have manual data. We should create user_profiles for these children
  // or ensure they have child_user_id references.
  
  // Check if there are any user_children records with manual data but no child_user_id
  const childrenWithManualData = await knex('user_children')
    .whereNull('child_user_id')
    .whereNotNull('first_name')
    .whereNotNull('last_name')
    .whereNotNull('date_of_birth');

  if (childrenWithManualData.length > 0) {
    console.log(`Found ${childrenWithManualData.length} children with manual data. These should be handled before removing fields.`);
    // For now, we'll log this but continue with the migration
    // In a real scenario, you might want to create user accounts for these children
    // or handle them differently based on business requirements
  }

  // Remove the check constraint that requires manual data when child_user_id is null
  await knex.raw(`
    ALTER TABLE user_children 
    DROP CONSTRAINT IF EXISTS user_children_check
  `);

  // Remove the duplicate fields from user_children table
  await knex.schema.alterTable('user_children', (table) => {
    table.dropColumn('first_name');
    table.dropColumn('last_name');
    table.dropColumn('date_of_birth');
  });

  // Add a new constraint that requires child_user_id to be not null
  // This ensures all children must have user accounts
  await knex.raw(`
    ALTER TABLE user_children 
    ADD CONSTRAINT user_children_child_user_id_required 
    CHECK (child_user_id IS NOT NULL)
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Remove the new constraint
  await knex.raw(`
    ALTER TABLE user_children 
    DROP CONSTRAINT IF EXISTS user_children_child_user_id_required
  `);

  // Add back the duplicate fields
  await knex.schema.alterTable('user_children', (table) => {
    table.string('first_name', 100).nullable();
    table.string('last_name', 100).nullable();
    table.date('date_of_birth').nullable();
  });

  // Restore the original constraint
  await knex.raw(`
    ALTER TABLE user_children 
    ADD CONSTRAINT user_children_check 
    CHECK (
      (child_user_id IS NOT NULL) OR 
      (first_name IS NOT NULL AND last_name IS NOT NULL AND date_of_birth IS NOT NULL)
    )
  `);
}
