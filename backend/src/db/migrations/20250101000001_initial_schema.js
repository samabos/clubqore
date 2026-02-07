/**
 * Idempotent initial schema creation using Knex schema builder.
 * This recreates the live database structure that was present in schema_snapshot.sql
 * without relying on the external file, and safely skips objects that already exist.
 */
export async function up(knex) {
  await knex.transaction(async (trx) => {
    // users
    if (!(await trx.schema.hasTable('users'))) {
      await trx.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('email', 255).notNullable();
        table.string('password', 255).notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.string('name', 255);
        table.text('avatar');
        table.json('roles').defaultTo(trx.raw("'[" + '"member"' + "]'::json"));
        table.string('primary_role', 255).defaultTo('member');
        table.string('account_type', 255);
        table.boolean('is_onboarded').defaultTo(false);
        table.boolean('email_verified').defaultTo(false);
        table.timestamp('email_verified_at', { useTz: true });
        table.string('club_id', 255);
        table.json('children');
        table.timestamp('onboarding_completed_at', { useTz: true });
        table.unique(['email'], { indexName: 'users_email_unique' });
      });
    }

    // roles
    if (!(await trx.schema.hasTable('roles'))) {
      await trx.schema.createTable('roles', (table) => {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.string('display_name', 255).notNullable();
        table.text('description');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.unique(['name'], { indexName: 'roles_name_unique' });
        table.index(['is_active'], 'roles_is_active_index');
        table.index(['name'], 'roles_name_index');
      });
    }

    // account_sequences
    if (!(await trx.schema.hasTable('account_sequences'))) {
      await trx.schema.createTable('account_sequences', (table) => {
        table.increments('id').primary();
        table.integer('year').notNullable();
        table.integer('sequence_number').notNullable().defaultTo(0);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.unique(['year'], { indexName: 'account_sequences_year_unique' });
        table.index(['year'], 'account_sequences_year_index');
      });
    }

    // clubs
    if (!(await trx.schema.hasTable('clubs'))) {
      await trx.schema.createTable('clubs', (table) => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.string('club_type', 100).notNullable();
        table.text('description');
        table.integer('founded_year');
        table.integer('membership_capacity');
        table.string('website', 500);
        table.text('address');
        table.string('phone', 20);
        table.string('email', 255);
        table.text('logo_url');
        table.integer('created_by').notNullable();
        table.boolean('is_active').defaultTo(true);
        table.boolean('verified').defaultTo(false);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table
          .foreign('created_by', 'clubs_created_by_foreign')
          .references('id')
          .inTable('users')
          .onDelete('RESTRICT');
        table.index(['club_type'], 'clubs_club_type_index');
        table.index(['created_by'], 'clubs_created_by_index');
        table.index(['is_active'], 'clubs_is_active_index');
        table.index(['verified'], 'clubs_verified_index');
      });
    }

    // teams
    if (!(await trx.schema.hasTable('teams'))) {
      await trx.schema.createTable('teams', (table) => {
        table.increments('id').primary();
        table.integer('club_id').notNullable();
        table.string('name', 255).notNullable();
        table.string('color', 7);
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.integer('manager_id');
        table
          .foreign('club_id', 'teams_club_id_foreign')
          .references('id')
          .inTable('clubs')
          .onDelete('CASCADE');
        table
          .foreign('manager_id', 'teams_manager_id_foreign')
          .references('id')
          .inTable('users')
          .onDelete('SET NULL');
        table.index(['club_id'], 'teams_club_id_index');
        table.index(['club_id', 'is_active'], 'teams_club_id_is_active_index');
        table.index(['manager_id'], 'teams_manager_id_index');
      });
    }

    // user_profiles
    if (!(await trx.schema.hasTable('user_profiles'))) {
      await trx.schema.createTable('user_profiles', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.string('first_name', 100);
        table.string('last_name', 100);
        table.date('date_of_birth');
        table.string('phone', 20);
        table.text('address');
        table.string('emergency_contact', 255);
        table.string('workplace', 255);
        table.string('work_phone', 20);
        table.text('medical_info');
        table.text('avatar');
        table.string('full_name', 200);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.string('position', 100);
        table.string('certification_level', 255);
        table.integer('years_of_experience');
        table.text('bio');
        table
          .foreign('user_id', 'user_profiles_user_id_foreign')
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        table.unique(['user_id'], { indexName: 'user_profiles_user_id_unique' });
        table.index(['user_id'], 'user_profiles_user_id_index');
        table.index(['first_name', 'last_name'], 'user_profiles_first_name_last_name_index');
      });
    }

    // user_preferences
    if (!(await trx.schema.hasTable('user_preferences'))) {
      await trx.schema.createTable('user_preferences', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.boolean('schedule_changes').defaultTo(true);
        table.boolean('payment_reminders').defaultTo(true);
        table.boolean('emergency_alerts').defaultTo(true);
        table.boolean('general_updates').defaultTo(true);
        table.boolean('email_notifications').defaultTo(true);
        table.boolean('sms_notifications').defaultTo(false);
        table.boolean('push_notifications').defaultTo(true);
        table.text('profile_visibility').defaultTo('members_only');
        table.boolean('show_contact_info').defaultTo(false);
        table.text('theme').defaultTo('auto');
        table.string('language', 10).defaultTo('en');
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table
          .foreign('user_id', 'user_preferences_user_id_foreign')
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        table.unique(['user_id'], { indexName: 'user_preferences_user_id_unique' });
        table.index(['user_id'], 'user_preferences_user_id_index');
      });
    }

    // user_roles
    if (!(await trx.schema.hasTable('user_roles'))) {
      await trx.schema.createTable('user_roles', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.text('role').notNullable();
        table.integer('club_id');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table
          .foreign('user_id', 'user_roles_user_id_foreign')
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        table
          .foreign('club_id', 'user_roles_club_id_foreign')
          .references('id')
          .inTable('clubs')
          .onDelete('SET NULL');
        table.unique(['user_id', 'role', 'club_id'], { indexName: 'user_roles_user_id_role_club_id_unique' });
        table.index(['user_id'], 'user_roles_user_id_index');
        table.index(['club_id'], 'user_roles_club_id_index');
        table.index(['user_id', 'is_active'], 'user_roles_user_id_is_active_index');
      });
    }

    // user_children
    if (!(await trx.schema.hasTable('user_children'))) {
      await trx.schema.createTable('user_children', (table) => {
        table.increments('id').primary();
        table.integer('parent_user_id').notNullable();
        table.integer('child_user_id');
        table.text('relationship').notNullable();
        table.integer('club_id');
        table.string('membership_code', 50);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table
          .foreign('parent_user_id', 'user_children_parent_user_id_foreign')
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        table
          .foreign('child_user_id', 'user_children_child_user_id_foreign')
          .references('id')
          .inTable('users')
          .onDelete('SET NULL');
        table
          .foreign('club_id', 'user_children_club_id_foreign')
          .references('id')
          .inTable('clubs')
          .onDelete('SET NULL');
        table.index(['parent_user_id'], 'user_children_parent_user_id_index');
        table.index(['child_user_id'], 'user_children_child_user_id_index');
        table.index(['club_id'], 'user_children_club_id_index');
      });
    }

    // tokens
    if (!(await trx.schema.hasTable('tokens'))) {
      await trx.schema.createTable('tokens', (table) => {
        table.increments('id').primary();
        table.string('token_id', 255).notNullable();
        table.integer('user_id').notNullable();
        table.timestamp('expires_at', { useTz: true }).notNullable();
        table.boolean('revoked').defaultTo(false);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.text('metadata');
        table.text('type').notNullable().defaultTo('access');
        table
          .foreign('user_id', 'tokens_user_id_foreign')
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        table.unique(['token_id'], { indexName: 'tokens_token_id_unique' });
        table.index(['expires_at'], 'tokens_expires_at_index');
        table.index(['token_id', 'revoked'], 'tokens_token_id_revoked_index');
      });
    }

    // user_accounts
    if (!(await trx.schema.hasTable('user_accounts'))) {
      await trx.schema.createTable('user_accounts', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.string('account_number', 20).notNullable();
        table.text('role').notNullable();
        table.integer('club_id');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('onboarding_completed_at', { useTz: true });
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.text('medical_info');
        table.string('emergency_contact_name', 255);
        table.string('emergency_contact_phone', 255);
        table.string('emergency_contact_relation', 255);
        table.text('notes');
        table.integer('team_id');
        table.timestamp('contract_end_date', { useTz: true });
        table
          .foreign('user_id', 'user_accounts_user_id_foreign')
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        table
          .foreign('club_id', 'user_accounts_club_id_foreign')
          .references('id')
          .inTable('clubs')
          .onDelete('SET NULL');
        table
          .foreign('team_id', 'user_accounts_team_id_foreign')
          .references('id')
          .inTable('teams')
          .onDelete('SET NULL');
        table.unique(['account_number'], { indexName: 'user_accounts_account_number_unique' });
        table.unique(['user_id', 'role', 'club_id'], { indexName: 'user_accounts_user_id_role_club_id_unique' });
        table.index(['user_id'], 'user_accounts_user_id_index');
        table.index(['user_id', 'is_active'], 'user_accounts_user_id_is_active_index');
        table.index(['team_id'], 'user_accounts_team_id_index');
        table.index(['account_number'], 'user_accounts_account_number_index');
      });
    }

    // team_members
    if (!(await trx.schema.hasTable('team_members'))) {
      await trx.schema.createTable('team_members', (table) => {
        table.increments('id').primary();
        table.integer('team_id').notNullable();
        table.integer('user_child_id').notNullable();
        table.timestamp('assigned_at', { useTz: true }).defaultTo(trx.fn.now());
        table.timestamp('created_at', { useTz: true }).defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).defaultTo(trx.fn.now());
        table
          .foreign('team_id', 'team_members_team_id_foreign')
          .references('id')
          .inTable('teams')
          .onDelete('CASCADE');
        table
          .foreign('user_child_id', 'team_members_user_child_id_foreign')
          .references('id')
          .inTable('user_children')
          .onDelete('CASCADE');
        table.unique(['team_id', 'user_child_id'], { indexName: 'team_members_team_id_user_child_id_unique' });
        table.index(['team_id'], 'team_members_team_id_index');
        table.index(['user_child_id'], 'team_members_user_child_id_index');
      });
    }

    // club_invite_codes
    if (!(await trx.schema.hasTable('club_invite_codes'))) {
      await trx.schema.createTable('club_invite_codes', (table) => {
        table.increments('id').primary();
        table.string('code', 50).notNullable();
        table.integer('club_id').notNullable();
        table.integer('created_by').notNullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamp('expires_at', { useTz: true });
        table.integer('usage_limit');
        table.integer('used_count').defaultTo(0);
        table.text('description');
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table
          .foreign('club_id', 'club_invite_codes_club_id_foreign')
          .references('id')
          .inTable('clubs')
          .onDelete('CASCADE');
        table
          .foreign('created_by', 'club_invite_codes_created_by_foreign')
          .references('id')
          .inTable('users')
          .onDelete('RESTRICT');
        table.unique(['code'], { indexName: 'club_invite_codes_code_unique' });
        table.index(['club_id'], 'club_invite_codes_club_id_index');
        table.index(['is_active', 'expires_at'], 'club_invite_codes_is_active_expires_at_index');
      });
    }

    // email_outbox (also created in a later migration, but safe due to hasTable guard)
    if (!(await trx.schema.hasTable('email_outbox'))) {
      await trx.schema.createTable('email_outbox', (table) => {
        table.increments('id').primary();
        table.string('to_email', 255).notNullable();
        table.string('subject', 255).notNullable();
        table.text('body_text');
        table.text('body_html');
        table.string('template', 255);
        table.jsonb('template_data');
        table.text('status').notNullable().defaultTo('pending');
        table.string('provider_message_id', 255);
        table.text('error_message');
        table.timestamp('sent_at', { useTz: true });
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(trx.fn.now());
        table.index(['to_email'], 'email_outbox_to_email_index');
      });
    }
  });
}

export async function down(_knex) {
  // Intentionally left empty to avoid accidental data loss.
}
