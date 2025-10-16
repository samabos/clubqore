/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Check and drop parent_phone if exists
  const hasParentPhone = await knex.schema.hasColumn('user_accounts', 'parent_phone');
  if (hasParentPhone) {
    await knex.schema.alterTable('user_accounts', (table) => {
      table.dropColumn('parent_phone');
    });
  }

  // Add new columns if they don't exist
  const addColumnIfNotExists = async (col, cb) => {
    const exists = await knex.schema.hasColumn('user_accounts', col);
    if (!exists) {
      await knex.schema.alterTable('user_accounts', cb);
    }
  };
  await addColumnIfNotExists('medical_info', table => table.text('medical_info'));
  await addColumnIfNotExists('emergency_contact_name', table => table.string('emergency_contact_name'));
  await addColumnIfNotExists('emergency_contact_phone', table => table.string('emergency_contact_phone'));
  await addColumnIfNotExists('emergency_contact_relation', table => table.string('emergency_contact_relation'));
  await addColumnIfNotExists('notes', table => table.text('notes'));
// End of migration
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Add parent_phone back if not exists
  const hasParentPhone = await knex.schema.hasColumn('user_accounts', 'parent_phone');
  if (!hasParentPhone) {
    await knex.schema.alterTable('user_accounts', table => {
      table.string('parent_phone');
    });
  }

  // Drop new columns if they exist
  const dropColumnIfExists = async (col) => {
    const exists = await knex.schema.hasColumn('user_accounts', col);
    if (exists) {
      await knex.schema.alterTable('user_accounts', table => {
        table.dropColumn(col);
      });
    }
  };
  await dropColumnIfExists('medical_info');
  await dropColumnIfExists('emergency_contact_name');
  await dropColumnIfExists('emergency_contact_phone');
  await dropColumnIfExists('emergency_contact_relation');
  await dropColumnIfExists('notes');
}

