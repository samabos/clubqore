/**
 * Migration: Create System Configuration Tables
 *
 * Creates tables for platform-wide system configuration with audit trail
 */

export async function up(knex) {
  // Create system_config table
  await knex.schema.createTable('system_config', (table) => {
    table.increments('id').primary();
    table.string('key', 100).unique().notNullable().comment('Unique configuration key');
    table.jsonb('value').notNullable().comment('Configuration value (flexible JSONB storage)');
    table.string('category', 50).notNullable().comment('Category: registration, financial, system, notifications');
    table.string('data_type', 20).notNullable().comment('Data type: string, number, boolean, json, enum');
    table.jsonb('validation_rules').comment('Validation rules (min, max, pattern, allowed_values)');
    table.text('description').comment('Human-readable description');
    table.boolean('is_active').defaultTo(true).notNullable().comment('Soft delete flag');
    table.timestamps(true, true);
  });

  // Create indexes for system_config
  await knex.schema.raw(`
    CREATE INDEX idx_system_config_category ON system_config(category);
    CREATE INDEX idx_system_config_active ON system_config(is_active) WHERE is_active = TRUE;
  `);

  // Create system_config_audit table
  await knex.schema.createTable('system_config_audit', (table) => {
    table.increments('id').primary();
    table.integer('config_id').references('id').inTable('system_config').onDelete('CASCADE');
    table.string('key', 100).notNullable().comment('Denormalized config key for easier querying');
    table.jsonb('old_value').comment('Previous value before change');
    table.jsonb('new_value').notNullable().comment('New value after change');
    table.integer('changed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('changed_at').defaultTo(knex.fn.now()).notNullable();
    table.text('change_reason').comment('Optional reason for the change');
    table.string('ip_address', 45).comment('IP address of user who made the change');
    table.text('user_agent').comment('Browser/client user agent');
  });

  // Create indexes for audit table
  await knex.schema.raw(`
    CREATE INDEX idx_config_audit_config_id ON system_config_audit(config_id);
    CREATE INDEX idx_config_audit_changed_by ON system_config_audit(changed_by);
    CREATE INDEX idx_config_audit_changed_at ON system_config_audit(changed_at DESC);
    CREATE INDEX idx_config_audit_key ON system_config_audit(key);
  `);

  console.log('✅ Created system_config and system_config_audit tables');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('system_config_audit');
  await knex.schema.dropTableIfExists('system_config');

  console.log('✅ Dropped system_config tables');
}
