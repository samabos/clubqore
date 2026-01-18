/**
 * Seed: System Configuration Default Values
 *
 * Creates default global configurations for the platform
 * These settings are enforced platform-wide (no club-level overrides)
 */

export async function seed(knex) {
  // Default system configurations
  const defaultConfigs = [
    // ==================== REGISTRATION CATEGORY ====================
    {
      key: 'min_member_age',
      value: 5,
      category: 'registration',
      data_type: 'number',
      validation_rules: {
        min: 3,
        max: 18
      },
      description: 'Minimum age required to register as a club member',
      is_active: true
    },
    {
      key: 'max_member_age',
      value: 18,
      category: 'registration',
      data_type: 'number',
      validation_rules: {
        min: 10,
        max: 99
      },
      description: 'Maximum age allowed for club membership',
      is_active: true
    },
    {
      key: 'require_parent_consent',
      value: true,
      category: 'registration',
      data_type: 'boolean',
      validation_rules: null,
      description: 'Whether parent consent is required for underage member registration',
      is_active: true
    },

    // ==================== FINANCIAL CATEGORY ====================
    {
      key: 'default_currency',
      value: 'GBP',
      category: 'financial',
      data_type: 'enum',
      validation_rules: {
        allowed_values: ['GBP', 'USD', 'EUR']
      },
      description: 'Default currency for all financial transactions',
      is_active: true
    },
    {
      key: 'default_tax_rate',
      value: 20,
      category: 'financial',
      data_type: 'number',
      validation_rules: {
        min: 0,
        max: 100
      },
      description: 'Default tax rate percentage applied to invoices',
      is_active: true
    },
    {
      key: 'invoice_payment_due_days',
      value: 30,
      category: 'financial',
      data_type: 'number',
      validation_rules: {
        min: 1,
        max: 365
      },
      description: 'Number of days after invoice generation before payment is due',
      is_active: true
    },

    // ==================== SYSTEM CATEGORY ====================
    {
      key: 'session_timeout_minutes',
      value: 120,
      category: 'system',
      data_type: 'number',
      validation_rules: {
        min: 15,
        max: 480
      },
      description: 'User session timeout duration in minutes',
      is_active: true
    },
    {
      key: 'max_file_upload_mb',
      value: 10,
      category: 'system',
      data_type: 'number',
      validation_rules: {
        min: 1,
        max: 100
      },
      description: 'Maximum file upload size in megabytes',
      is_active: true
    },
    {
      key: 'maintenance_mode',
      value: false,
      category: 'system',
      data_type: 'boolean',
      validation_rules: null,
      description: 'Enable maintenance mode to prevent user access',
      is_active: true
    },

    // ==================== NOTIFICATIONS CATEGORY ====================
    {
      key: 'default_email_sender_name',
      value: 'ClubQore',
      category: 'notifications',
      data_type: 'string',
      validation_rules: {
        maxLength: 100
      },
      description: 'Default sender name for all system emails',
      is_active: true
    },
    {
      key: 'enable_sms_notifications',
      value: false,
      category: 'notifications',
      data_type: 'boolean',
      validation_rules: null,
      description: 'Enable SMS notifications platform-wide',
      is_active: true
    },
    {
      key: 'notification_digest_frequency',
      value: 'daily',
      category: 'notifications',
      data_type: 'enum',
      validation_rules: {
        allowed_values: ['immediate', 'daily', 'weekly']
      },
      description: 'How often to send notification digest emails',
      is_active: true
    }
  ];

  // Use upsert pattern to avoid overwriting existing values
  // Only inserts if the key doesn't already exist
  for (const config of defaultConfigs) {
    await knex('system_config')
      .insert({
        ...config,
        // Stringify JSONB fields for PostgreSQL
        validation_rules: config.validation_rules ? JSON.stringify(config.validation_rules) : null,
        value: JSON.stringify(config.value)
      })
      .onConflict('key')
      .ignore();
  }

  console.log('✅ Seeded system_config with default configurations');
}
