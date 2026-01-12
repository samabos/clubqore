/**
 * Migration: Restructure invoice user fields
 *
 * Purpose: Clarify invoice user relationships by renaming user_id to parent_user_id
 * and adding child_user_id.
 *
 * Changes:
 * - Rename user_id to parent_user_id (the parent/guardian responsible for payment)
 * - Add child_user_id (the child/member the invoice is for)
 * - Add index on child_user_id for performance
 * - Backfill child_user_id with parent_user_id value for existing invoices
 */

export async function up(knex) {
  console.log('🔄 Restructuring invoice user fields...');

  // Step 1: Add child_user_id column
  await knex.schema.alterTable('invoices', (table) => {
    table.integer('child_user_id')
      .unsigned()
      .nullable()
      .comment('Child/member the invoice is for');
  });

  console.log('✅ Added child_user_id column');

  // Step 2: Backfill child_user_id with user_id value
  // (For existing invoices, user_id currently points to the child)
  await knex.raw(`
    UPDATE invoices
    SET child_user_id = user_id
  `);

  console.log('✅ Backfilled child_user_id with existing user_id values');

  // Step 3: Update user_id to point to parent for child invoices
  await knex.raw(`
    UPDATE invoices
    SET user_id = (
      SELECT uc.parent_user_id
      FROM user_children uc
      WHERE uc.child_user_id = invoices.child_user_id
      LIMIT 1
    )
    WHERE EXISTS (
      SELECT 1 FROM user_children uc WHERE uc.child_user_id = invoices.child_user_id
    )
  `);

  console.log('✅ Updated user_id to point to parent for child invoices');

  // Step 4: Rename user_id to parent_user_id
  await knex.schema.alterTable('invoices', (table) => {
    table.renameColumn('user_id', 'parent_user_id');
  });

  console.log('✅ Renamed user_id to parent_user_id');

  // Step 5: Add foreign key constraint and index on child_user_id
  await knex.schema.alterTable('invoices', (table) => {
    table.foreign('child_user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.index('child_user_id', 'idx_invoices_child_user_id');
  });

  console.log('✅ Added foreign key and index on child_user_id');

  // Show summary
  const totalInvoices = await knex('invoices').count('* as count').first();
  const withParent = await knex('invoices')
    .whereNotNull('parent_user_id')
    .whereRaw('parent_user_id != child_user_id')
    .count('* as count')
    .first();
  const directMember = await knex('invoices')
    .whereRaw('parent_user_id = child_user_id')
    .count('* as count')
    .first();

  console.log('📊 Migration Summary:');
  console.log(`   Total invoices: ${totalInvoices.count}`);
  console.log(`   Invoices with parent (parent_user_id ≠ child_user_id): ${withParent.count}`);
  console.log(`   Invoices for direct members (parent_user_id = child_user_id): ${directMember.count}`);
  console.log('✨ Migration completed successfully!');
}

export async function down(knex) {
  console.log('🔄 Rolling back: Reverting invoice user field changes...');

  // Step 1: Rename parent_user_id back to user_id
  await knex.schema.alterTable('invoices', (table) => {
    table.renameColumn('parent_user_id', 'user_id');
  });

  console.log('✅ Renamed parent_user_id back to user_id');

  // Step 2: Restore user_id to point to child (original behavior)
  await knex.raw(`
    UPDATE invoices
    SET user_id = child_user_id
    WHERE child_user_id IS NOT NULL
  `);

  console.log('✅ Restored user_id to point to child');

  // Step 3: Drop foreign key and index on child_user_id
  await knex.schema.alterTable('invoices', (table) => {
    table.dropForeign('child_user_id');
    table.dropIndex('child_user_id', 'idx_invoices_child_user_id');
  });

  console.log('✅ Dropped foreign key and index on child_user_id');

  // Step 4: Drop child_user_id column
  await knex.schema.alterTable('invoices', (table) => {
    table.dropColumn('child_user_id');
  });

  console.log('✅ Dropped child_user_id column');
  console.log('✨ Rollback completed successfully!');
}
