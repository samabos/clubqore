/**
 * Subscription Sync Worker
 *
 * This worker:
 * 1. Syncs mandate statuses from GoCardless (updates pending -> active)
 * 2. Finds subscriptions that are active in ClubQore but don't have
 *    a corresponding GoCardless subscription, and creates them.
 *
 * This can happen when:
 * 1. The GoCardless API call fails during subscription activation
 * 2. A subscription was created before GoCardless integration was fully set up
 * 3. Manual database fixes that didn't sync to GoCardless
 * 4. Webhooks were missed for mandate status updates
 *
 * Runs every 5 minutes to ensure subscriptions are synced.
 */

import cron from 'node-cron';
import { PaymentProviderFactory } from '../payment/services/PaymentProviderFactory.js';
import { WorkerExecutionService } from '../payment/services/WorkerExecutionService.js';
import logger from '../config/logger.js';

// GoCardless status mappings (same as in GoCardlessProvider)
const MANDATE_STATUS_MAP = {
  'pending_customer_approval': 'pending',
  'pending_submission': 'pending',
  'submitted': 'submitted',
  'active': 'active',
  'cancelled': 'cancelled',
  'failed': 'failed',
  'expired': 'expired'
};

export class SubscriptionSyncWorker {
  constructor(db) {
    this.db = db;
    this.executionService = new WorkerExecutionService(db);
    this.isRunning = false;
    this.job = null;
  }

  /**
   * Start the worker
   */
  start() {
    // Run every 5 minutes
    this.job = cron.schedule('*/5 * * * *', async () => {
      await this.syncSubscriptions();
    });

    logger.info('Subscription Sync Worker started - Will run every 5 minutes');
  }

  /**
   * Stop the worker
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      logger.info('Subscription Sync Worker stopped');
    }
  }

  /**
   * Run the sync process
   */
  async syncSubscriptions() {
    if (this.isRunning) {
      logger.warn('Subscription sync already running, skipping');
      return;
    }

    this.isRunning = true;
    let executionId = null;
    let itemsProcessed = 0;
    let itemsFailed = 0;

    try {
      // Start execution tracking
      executionId = await this.executionService.startExecution('subscription_sync');

      // Step 1: Sync mandate statuses from GoCardless
      // This ensures pending mandates get updated to active if confirmed by bank
      const mandatesSynced = await this.syncMandateStatuses();
      logger.info({ mandatesSynced }, 'Mandate status sync completed');

      // Step 2: Find subscriptions that need syncing:
      // - Status is active or pending
      // - No provider_subscription_id (not synced to GC yet)
      // - Either has mandate linked directly, or parent has active mandate for same club
      //
      // This handles two scenarios:
      // 1. Subscription has mandate linked but GC subscription creation failed
      // 2. Subscription never got mandate linked (webhook was missed)
      const db = this.db; // Capture reference for use in callbacks
      const subscriptionsToSync = await db('subscriptions as s')
        .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
        .join('users as child', 's.child_user_id', 'child.id')
        .leftJoin('user_profiles as child_profile', 'child.id', 'child_profile.user_id')
        // Join to find parent's mandate for this club (via payment_customer)
        .join('payment_customers as pc', function() {
          this.on('pc.user_id', '=', 's.parent_user_id')
            .andOn('pc.club_id', '=', 's.club_id');
        })
        .join('payment_mandates as pm', function() {
          this.on('pm.payment_customer_id', '=', 'pc.id')
            .andOn('pm.status', '=', db.raw('?', ['active']));
        })
        .whereIn('s.status', ['active', 'pending'])
        .whereNull('s.provider_subscription_id')
        .select(
          's.id',
          's.club_id',
          's.parent_user_id',
          's.child_user_id',
          's.status',
          's.amount',
          's.billing_frequency',
          's.billing_day_of_month',
          's.payment_mandate_id as existing_mandate_id',
          'pm.provider',
          'pm.provider_mandate_id',
          'pm.id as mandate_id',
          'mt.name as tier_name',
          db.raw(`COALESCE(child_profile.first_name, split_part(child.email, '@', 1)) as child_first_name`),
          db.raw(`COALESCE(child_profile.last_name, '') as child_last_name`)
        );

      if (subscriptionsToSync.length === 0) {
        logger.info('No subscriptions need syncing');
        await this.executionService.completeExecution(executionId, {
          processed: 0,
          successful: 0,
          failed: 0
        });
        this.isRunning = false;
        return;
      }

      logger.info(`Found ${subscriptionsToSync.length} subscriptions to sync with GoCardless`);

      for (const subscription of subscriptionsToSync) {
        try {
          await this.syncSubscription(subscription);
          itemsProcessed++;
        } catch (error) {
          itemsFailed++;
          // Log detailed error information
          logger.error({
            subscriptionId: subscription.id,
            mandateId: subscription.mandate_id,
            providerMandateId: subscription.provider_mandate_id,
            provider: subscription.provider,
            amount: subscription.amount,
            billingFrequency: subscription.billing_frequency,
            error: error.message,
            errorCode: error.code,
            errorType: error.type,
            errorDetails: error.errors || error.details,
            stack: error.stack
          }, 'Failed to sync subscription to GoCardless');
        }
      }

      logger.info({
        mandatesSynced,
        subscriptionsProcessed: itemsProcessed,
        subscriptionsFailed: itemsFailed
      }, 'Subscription sync completed');

      await this.executionService.completeExecution(executionId, {
        processed: itemsProcessed + itemsFailed + mandatesSynced,
        successful: itemsProcessed + mandatesSynced,
        failed: itemsFailed
      });

    } catch (error) {
      logger.error({ error: error.message }, 'Subscription sync worker failed');
      if (executionId) {
        await this.executionService.failExecution(executionId, error.message);
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync a single subscription to GoCardless
   */
  async syncSubscription(subscription) {
    logger.info({
      subscriptionId: subscription.id,
      parentUserId: subscription.parent_user_id,
      existingMandateId: subscription.existing_mandate_id,
      foundMandateId: subscription.mandate_id,
      mandateStatus: 'active' // We only find active mandates
    }, 'Starting subscription sync');

    // Build subscription name
    const childName = `${subscription.child_first_name} ${subscription.child_last_name}`.trim();
    const subscriptionName = `${subscription.tier_name} - ${childName}`;

    // Build the request payload for logging
    const gcPayload = {
      amount: parseFloat(subscription.amount),
      currency: 'GBP',
      intervalUnit: subscription.billing_frequency === 'annual' ? 'yearly' : 'monthly',
      dayOfMonth: subscription.billing_day_of_month || 1,
      name: subscriptionName,
      metadata: {
        subscription_id: subscription.id.toString(),
        club_id: subscription.club_id.toString(),
        child_user_id: subscription.child_user_id.toString()
      }
    };

    // Log the full request details
    logger.info({
      subscriptionId: subscription.id,
      mandateId: subscription.mandate_id,
      providerMandateId: subscription.provider_mandate_id,
      provider: subscription.provider,
      subscriptionStatus: subscription.status,
      gcPayload
    }, 'Creating GoCardless subscription with payload');

    // Validate required fields
    if (!subscription.provider_mandate_id) {
      throw new Error(`Missing provider_mandate_id for subscription ${subscription.id}`);
    }

    if (!subscription.amount || parseFloat(subscription.amount) <= 0) {
      throw new Error(`Invalid amount (${subscription.amount}) for subscription ${subscription.id}`);
    }

    // Get the provider
    const provider = PaymentProviderFactory.getProvider(subscription.provider);

    if (!provider) {
      throw new Error(`Provider '${subscription.provider}' not found`);
    }

    // Create GoCardless subscription
    let gcSubscription;
    try {
      gcSubscription = await provider.createSubscription(
        subscription.provider_mandate_id,
        gcPayload
      );
    } catch (gcError) {
      // Extract GoCardless-specific error details
      logger.error({
        subscriptionId: subscription.id,
        providerMandateId: subscription.provider_mandate_id,
        gcPayload,
        gcErrorMessage: gcError.message,
        gcErrorType: gcError.type,
        gcErrorCode: gcError.code,
        gcErrors: gcError.errors,
        gcResponse: gcError.response?.data || gcError.response,
        gcStatusCode: gcError.response?.status
      }, 'GoCardless API error when creating subscription');
      throw gcError;
    }

    logger.info({
      subscriptionId: subscription.id,
      gcSubscriptionId: gcSubscription.providerSubscriptionId,
      gcStatus: gcSubscription.status
    }, 'GoCardless subscription created successfully');

    // Build the update object - include mandate link if not already set
    const updateData = {
      status: 'active',
      provider: subscription.provider,
      provider_subscription_id: gcSubscription.providerSubscriptionId,
      provider_subscription_status: gcSubscription.status,
      updated_at: new Date()
    };

    // Link the mandate if not already linked
    if (!subscription.existing_mandate_id) {
      updateData.payment_mandate_id = subscription.mandate_id;
      logger.info({
        subscriptionId: subscription.id,
        mandateId: subscription.mandate_id
      }, 'Linking subscription to parent mandate');
    }

    // Update local subscription with provider details
    await this.db('subscriptions')
      .where({ id: subscription.id })
      .update(updateData);

    // Log the sync event
    const eventMetadata = {
      providerSubscriptionId: gcSubscription.providerSubscriptionId,
      providerStatus: gcSubscription.status,
      payload: gcPayload
    };

    if (!subscription.existing_mandate_id) {
      eventMetadata.mandateLinked = subscription.mandate_id;
    }

    await this.db('subscription_events').insert({
      subscription_id: subscription.id,
      event_type: 'synced_to_provider',
      previous_status: subscription.status,
      new_status: 'active',
      actor_type: 'system',
      metadata: JSON.stringify(eventMetadata),
      created_at: new Date()
    });

    logger.info({
      subscriptionId: subscription.id,
      gcSubscriptionId: gcSubscription.providerSubscriptionId
    }, 'Subscription synced to GoCardless');
  }

  /**
   * Sync mandate statuses from GoCardless
   *
   * Finds mandates that are 'pending' or 'submitted' locally and checks
   * their actual status in GoCardless. Updates local status if changed.
   *
   * @returns {Promise<number>} Number of mandates updated
   */
  async syncMandateStatuses() {
    // Find mandates that might need updating
    const pendingMandates = await this.db('payment_mandates')
      .whereIn('status', ['pending', 'submitted'])
      .whereNotNull('provider_mandate_id')
      .where('provider', 'gocardless')
      .select('id', 'provider_mandate_id', 'status', 'provider');

    if (pendingMandates.length === 0) {
      logger.info('No pending mandates to check');
      return 0;
    }

    logger.info({ count: pendingMandates.length }, 'Checking mandate statuses with GoCardless');

    let updatedCount = 0;

    for (const mandate of pendingMandates) {
      try {
        const provider = PaymentProviderFactory.getProvider(mandate.provider);
        if (!provider) {
          logger.warn({ mandateId: mandate.id, provider: mandate.provider }, 'Provider not found');
          continue;
        }

        // Fetch current status from GoCardless
        const gcMandate = await provider.getMandate(mandate.provider_mandate_id);
        const newStatus = gcMandate.status;

        if (newStatus !== mandate.status) {
          logger.info({
            mandateId: mandate.id,
            providerMandateId: mandate.provider_mandate_id,
            oldStatus: mandate.status,
            newStatus
          }, 'Mandate status changed in GoCardless');

          // Update local mandate status
          await this.db('payment_mandates')
            .where({ id: mandate.id })
            .update({
              status: newStatus,
              next_possible_charge_date: gcMandate.nextPossibleChargeDate,
              updated_at: new Date()
            });

          updatedCount++;

          // If mandate is now active, try to activate pending subscriptions
          if (newStatus === 'active') {
            await this.activatePendingSubscriptionsForMandate(mandate.id);
          }
        }
      } catch (error) {
        logger.error({
          mandateId: mandate.id,
          providerMandateId: mandate.provider_mandate_id,
          error: error.message
        }, 'Error checking mandate status');
      }
    }

    return updatedCount;
  }

  /**
   * Activate pending subscriptions when a mandate becomes active
   *
   * @param {number} mandateId - Local mandate ID
   */
  async activatePendingSubscriptionsForMandate(mandateId) {
    // Get mandate with customer info to find parent
    const mandate = await this.db('payment_mandates as pm')
      .join('payment_customers as pc', 'pm.payment_customer_id', 'pc.id')
      .where('pm.id', mandateId)
      .select('pm.*', 'pc.user_id', 'pc.club_id')
      .first();

    if (!mandate) return;

    // Find pending subscriptions for this parent in this club
    const pendingSubscriptions = await this.db('subscriptions')
      .where('parent_user_id', mandate.user_id)
      .where('club_id', mandate.club_id)
      .where('status', 'pending')
      .whereNull('provider_subscription_id');

    logger.info({
      mandateId,
      parentUserId: mandate.user_id,
      clubId: mandate.club_id,
      pendingCount: pendingSubscriptions.length
    }, 'Found pending subscriptions to activate after mandate sync');

    for (const subscription of pendingSubscriptions) {
      // Link mandate and mark for sync (will be picked up in main sync loop)
      await this.db('subscriptions')
        .where({ id: subscription.id })
        .update({
          payment_mandate_id: mandateId,
          updated_at: new Date()
        });

      logger.info({
        subscriptionId: subscription.id,
        mandateId
      }, 'Linked mandate to pending subscription');
    }
  }

  /**
   * Run sync immediately (for manual trigger)
   */
  async runNow() {
    return await this.syncSubscriptions();
  }
}

/**
 * Start the subscription sync worker
 */
export function startSubscriptionSyncWorker(db) {
  const worker = new SubscriptionSyncWorker(db);
  worker.start();
  return worker;
}

export default SubscriptionSyncWorker;
