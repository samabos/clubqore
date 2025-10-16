/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    // Account number sequences table
    .createTable('account_sequences', (table) => {
      table.increments('id').primary();
      table.integer('year').notNullable();
      table.integer('sequence_number').notNullable().defaultTo(0);
      table.timestamps(true, true);
      
      table.unique(['year']);
      table.index('year');
    })

    // User profiles table (single source of truth for personal data)
    .createTable('user_profiles', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('first_name', 100);
      table.string('last_name', 100);
      table.date('date_of_birth');
      table.string('phone', 20);
      table.text('address');
      table.string('emergency_contact', 255);
      table.string('workplace', 255);
      table.string('work_phone', 20);
      table.text('medical_info');
      table.string('avatar', 500);
      table.string('full_name', 200); // Computed field
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('cascade');
      table.unique('user_id');
      table.index('user_id');
      table.index(['first_name', 'last_name']);
    })

    // User preferences table (single source of truth for preferences)
    .createTable('user_preferences', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.boolean('schedule_changes').defaultTo(true);
      table.boolean('payment_reminders').defaultTo(true);
      table.boolean('emergency_alerts').defaultTo(true);
      table.boolean('general_updates').defaultTo(true);
      table.boolean('email_notifications').defaultTo(true);
      table.boolean('sms_notifications').defaultTo(false);
      table.boolean('push_notifications').defaultTo(true);
      table.enum('profile_visibility', ['public', 'members_only', 'private']).defaultTo('members_only');
      table.boolean('show_contact_info').defaultTo(false);
      table.enum('theme', ['light', 'dark', 'auto']).defaultTo('auto');
      table.string('language', 10).defaultTo('en');
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('cascade');
      table.unique('user_id');
      table.index('user_id');
    })

    // Clubs table (single source of truth for club data)
    .createTable('clubs', (table) => {
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
      table.string('logo_url', 500);
      table.integer('created_by').unsigned().notNullable();
      table.boolean('is_active').defaultTo(true);
      table.boolean('verified').defaultTo(false);
      table.timestamps(true, true);
      
      table.foreign('created_by').references('id').inTable('users').onDelete('restrict');
      table.index('created_by');
      table.index('club_type');
      table.index('is_active');
      table.index('verified');
    })

    // User roles table (replaces JSON array in users table)
    .createTable('user_roles', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.enum('role', ['club_manager', 'member', 'parent']).notNullable();
      table.integer('club_id').unsigned();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('cascade');
      table.foreign('club_id').references('id').inTable('clubs').onDelete('set null');
      table.unique(['user_id', 'role', 'club_id']); // Prevent duplicate roles per club
      table.index('user_id');
      table.index(['user_id', 'is_active']);
      table.index('club_id');
    })

    // User accounts table (role-specific accounts with unique account numbers)
    .createTable('user_accounts', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('account_number', 20).notNullable();
      table.enum('role', ['club_manager', 'member', 'parent']).notNullable();
      table.integer('club_id').unsigned();
      
      // Role-specific data (no personal data - that's in user_profiles)
      table.string('position', 100); // For members
      table.string('parent_phone', 20); // For members with parent contact
      
      table.boolean('is_active').defaultTo(true);
      table.timestamp('onboarding_completed_at');
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('cascade');
      table.foreign('club_id').references('id').inTable('clubs').onDelete('set null');
      table.unique('account_number');
      table.unique(['user_id', 'role', 'club_id']); // One account per role/club combination
      table.index('user_id');
      table.index('account_number');
      table.index(['user_id', 'is_active']);
    })

    // User children table (for parent relationships)
    .createTable('user_children', (table) => {
      table.increments('id').primary();
      table.integer('parent_user_id').unsigned().notNullable();
      table.integer('child_user_id').unsigned(); // Optional - links to existing user
      table.enum('relationship', ['parent', 'guardian', 'grandparent', 'relative', 'other']).notNullable();
      
      // Manual child data (only if child_user_id is null)
      table.string('first_name', 100);
      table.string('last_name', 100);
      table.date('date_of_birth');
      
      // Club association
      table.integer('club_id').unsigned();
      table.string('membership_code', 50);
      
      table.timestamps(true, true);
      
      table.foreign('parent_user_id').references('id').inTable('users').onDelete('cascade');
      table.foreign('child_user_id').references('id').inTable('users').onDelete('set null');
      table.foreign('club_id').references('id').inTable('clubs').onDelete('set null');
      
      table.index('parent_user_id');
      table.index('child_user_id');
      table.index('club_id');
      
      // Constraint: either child_user_id OR manual data must be provided
      table.check(`
        (child_user_id IS NOT NULL) OR 
        (first_name IS NOT NULL AND last_name IS NOT NULL AND date_of_birth IS NOT NULL)
      `);
    })

    // Club invite codes table
    .createTable('club_invite_codes', (table) => {
      table.increments('id').primary();
      table.string('code', 50).notNullable();
      table.integer('club_id').unsigned().notNullable();
      table.integer('created_by').unsigned().notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('expires_at');
      table.integer('usage_limit');
      table.integer('used_count').defaultTo(0);
      table.text('description');
      table.timestamps(true, true);
      
      table.foreign('club_id').references('id').inTable('clubs').onDelete('cascade');
      table.foreign('created_by').references('id').inTable('users').onDelete('restrict');
      table.unique('code');
      table.index('club_id');
      table.index(['is_active', 'expires_at']);
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .dropTableIfExists('club_invite_codes')
    .dropTableIfExists('user_children')
    .dropTableIfExists('user_accounts')
    .dropTableIfExists('user_roles')
    .dropTableIfExists('clubs')
    .dropTableIfExists('user_preferences')
    .dropTableIfExists('user_profiles')
    .dropTableIfExists('account_sequences');
}
