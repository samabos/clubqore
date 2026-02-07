/**
 * Migration: Consolidate status values to draft, scheduled, and cancelled
 * Date: 2026-01-15
 *
 * This migration consolidates training session and match statuses
 * to three values: 'draft', 'scheduled', and 'cancelled'
 *
 * Changes:
 * - completed → scheduled
 * - in_progress → scheduled
 * - cancelled → kept as-is
 */

export async function up(knex) {
  // Update training_sessions table - keep cancelled, convert completed/in_progress to scheduled
  const trainingUpdated = await knex('training_sessions')
    .whereIn('status', ['completed', 'in_progress'])
    .update({ status: 'scheduled' });

  console.log(`✅ Updated ${trainingUpdated} training session(s) from completed/in_progress to scheduled`);

  // Update matches table - keep cancelled, convert completed/in_progress to scheduled
  const matchesUpdated = await knex('matches')
    .whereIn('status', ['completed', 'in_progress'])
    .update({ status: 'scheduled' });

  console.log(`✅ Updated ${matchesUpdated} match(es) from completed/in_progress to scheduled`);
  console.log('✅ Status consolidation complete - draft, scheduled, and cancelled remain');
}

export async function down(_knex) {
  // Cannot reliably reverse this migration as we've lost the original status information
  console.log('⚠️  Cannot reverse status consolidation - data has been merged');
  console.log('⚠️  All completed/in_progress statuses were changed to scheduled');
}
