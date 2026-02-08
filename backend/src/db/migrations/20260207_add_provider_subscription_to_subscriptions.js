/**
 * Migration: Add GoCardless Subscription ID to Subscriptions
 *
 * Adds columns to link our subscriptions to GoCardless subscriptions,
 * allowing GoCardless to handle recurring payment scheduling.
 */

export async function up(knex) {
  await knex.schema.alterTable('subscriptions', (table) => {
    // GoCardless subscription ID - used to sync with GC
    table.string('provider_subscription_id', 100);

    // Status from the provider (active, paused, cancelled, finished)
    table.string('provider_subscription_status', 50);

    // Provider name for the subscription (gocardless, stripe, etc.)
    table.string('provider', 50);

    // Index for looking up by provider subscription ID
    table.index('provider_subscription_id');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('subscriptions', (table) => {
    table.dropIndex('provider_subscription_id');
    table.dropColumn('provider_subscription_status');
    table.dropColumn('provider_subscription_id');
    table.dropColumn('provider');
  });
}
