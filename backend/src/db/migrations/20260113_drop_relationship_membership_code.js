/**
 * Drop unused relationship and membership_code columns from user_children table
 *
 * These fields were creating inconsistency between registration flow and
 * parent portal flow, and were not being used meaningfully in the application.
 */

export async function up(knex) {
  // Drop the constraint first (if it exists)
  await knex.raw(`
    ALTER TABLE user_children
    DROP CONSTRAINT IF EXISTS user_children_relationship_check
  `);

  // Drop the columns
  await knex.schema.alterTable('user_children', (table) => {
    table.dropColumn('relationship');
    table.dropColumn('membership_code');
  });
}

export async function down(knex) {
  // Add the columns back
  await knex.schema.alterTable('user_children', (table) => {
    table.text('relationship').notNullable().defaultTo('parent');
    table.string('membership_code', 50);
  });

  // Re-add the constraint
  await knex.raw(`
    ALTER TABLE user_children
    ADD CONSTRAINT user_children_relationship_check
    CHECK (relationship = ANY (ARRAY['parent'::text, 'guardian'::text, 'grandparent'::text, 'relative'::text, 'other'::text]))
  `);
}
