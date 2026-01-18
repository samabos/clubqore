/**
 * Migration: Add membership_tier_id to teams table
 *
 * Links teams to membership tiers so that when a child is assigned to a team,
 * a subscription is automatically created based on the team's tier.
 */

export async function up(knex) {
  // Add membership_tier_id to teams
  await knex.schema.alterTable('teams', (table) => {
    table.integer('membership_tier_id')
      .unsigned()
      .references('id')
      .inTable('membership_tiers')
      .onDelete('SET NULL');
  });

  // Add team_id to subscriptions for tracking which team triggered the subscription
  await knex.schema.alterTable('subscriptions', (table) => {
    table.integer('team_id')
      .unsigned()
      .references('id')
      .inTable('teams')
      .onDelete('SET NULL');
  });

  // Add index for faster lookups
  await knex.schema.alterTable('teams', (table) => {
    table.index('membership_tier_id');
  });

  await knex.schema.alterTable('subscriptions', (table) => {
    table.index('team_id');
  });
}

export async function down(knex) {
  // Remove indexes first
  await knex.schema.alterTable('subscriptions', (table) => {
    table.dropIndex('team_id');
  });

  await knex.schema.alterTable('teams', (table) => {
    table.dropIndex('membership_tier_id');
  });

  // Remove columns
  await knex.schema.alterTable('subscriptions', (table) => {
    table.dropColumn('team_id');
  });

  await knex.schema.alterTable('teams', (table) => {
    table.dropColumn('membership_tier_id');
  });
}
