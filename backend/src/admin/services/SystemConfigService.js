/**
 * SystemConfigService
 *
 * Business logic for managing platform-wide system configuration
 * Supports CRUD operations, validation, caching, and audit trail
 */

export class SystemConfigService {
  constructor(db) {
    this.db = db;
    this.cache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Get all system configurations
   * @param {Object} options - Query options
   * @param {string} options.category - Filter by category
   * @param {boolean} options.activeOnly - Only return active configs
   * @returns {Promise<Array>}
   */
  async getAllConfigs({ category = null, activeOnly = true } = {}) {
    let query = this.db('system_config');

    if (category) {
      query = query.where({ category });
    }

    if (activeOnly) {
      query = query.where({ is_active: true });
    }

    return await query.orderBy('category').orderBy('key');
  }

  /**
   * Get a single configuration value by key
   * Uses in-memory cache with TTL
   * @param {string} key - Configuration key
   * @returns {Promise<*>} Configuration value or null if not found
   */
  async getConfigValue(key) {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    // Fetch from database
    const config = await this.db('system_config')
      .where({ key, is_active: true })
      .first();

    if (!config) {
      return null;
    }

    // Store in cache with TTL
    this.cache.set(key, {
      value: config.value,
      expiry: Date.now() + this.CACHE_TTL
    });

    return config.value;
  }

  /**
   * Get multiple configuration values by keys
   * @param {Array<string>} keys - Array of configuration keys
   * @returns {Promise<Object>} Object with key-value pairs
   */
  async getConfigValues(keys) {
    const configs = await this.db('system_config')
      .whereIn('key', keys)
      .where({ is_active: true });

    const result = {};
    configs.forEach(config => {
      result[config.key] = config.value;

      // Update cache
      this.cache.set(config.key, {
        value: config.value,
        expiry: Date.now() + this.CACHE_TTL
      });
    });

    return result;
  }

  /**
   * Get a single configuration by ID
   * @param {number} id - Configuration ID
   * @returns {Promise<Object|null>}
   */
  async getConfigById(id) {
    return await this.db('system_config')
      .where({ id })
      .first();
  }

  /**
   * Create a new system configuration
   * @param {Object} configData - Configuration data
   * @param {number} userId - ID of user creating the config
   * @param {string} ipAddress - IP address of the request
   * @param {string} userAgent - User agent string
   * @returns {Promise<Object>}
   */
  async createConfig(configData, userId, ipAddress = null, userAgent = null) {
    const { key, value, category, data_type, validation_rules, description } = configData;

    // Validate required fields
    if (!key || value === undefined || !category || !data_type) {
      throw new Error('Missing required fields: key, value, category, data_type');
    }

    // Check if key already exists
    const existing = await this.db('system_config').where({ key }).first();
    if (existing) {
      throw new Error(`Configuration with key '${key}' already exists`);
    }

    // Validate the value against data type and rules
    this.validateConfigValue(value, data_type, validation_rules);

    // Insert configuration
    const [newConfig] = await this.db('system_config')
      .insert({
        key,
        value,
        category,
        data_type,
        validation_rules: validation_rules ? JSON.stringify(validation_rules) : null,
        description,
        is_active: true
      })
      .returning('*');

    // Create audit entry
    await this.createAuditEntry({
      config_id: newConfig.id,
      key: newConfig.key,
      old_value: null,
      new_value: value,
      changed_by: userId,
      change_reason: 'Configuration created',
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // Clear cache for this key
    this.cache.delete(key);

    return newConfig;
  }

  /**
   * Update an existing system configuration
   * @param {number} id - Configuration ID
   * @param {Object} updates - Fields to update
   * @param {number} userId - ID of user making the change
   * @param {string} changeReason - Reason for the change
   * @param {string} ipAddress - IP address of the request
   * @param {string} userAgent - User agent string
   * @returns {Promise<Object>}
   */
  async updateConfig(id, updates, userId, changeReason = null, ipAddress = null, userAgent = null) {
    // Get current config
    const currentConfig = await this.getConfigById(id);
    if (!currentConfig) {
      throw new Error('Configuration not found');
    }

    // If updating value, validate it
    if (updates.value !== undefined) {
      const dataType = updates.data_type || currentConfig.data_type;
      const validationRules = updates.validation_rules || currentConfig.validation_rules;
      this.validateConfigValue(updates.value, dataType, validationRules);
    }

    // Prepare update payload - exclude change_reason as it's only for audit table
    const { change_reason, ...configUpdates } = updates;

    // Update configuration
    const [updatedConfig] = await this.db('system_config')
      .where({ id })
      .update({
        ...configUpdates,
        validation_rules: configUpdates.validation_rules
          ? JSON.stringify(configUpdates.validation_rules)
          : currentConfig.validation_rules,
        updated_at: this.db.fn.now()
      })
      .returning('*');

    // Create audit entry if value changed
    if (updates.value !== undefined && updates.value !== currentConfig.value) {
      await this.createAuditEntry({
        config_id: id,
        key: currentConfig.key,
        old_value: currentConfig.value,
        new_value: updates.value,
        changed_by: userId,
        change_reason: changeReason,
        ip_address: ipAddress,
        user_agent: userAgent
      });
    }

    // Clear cache for this key
    this.cache.delete(currentConfig.key);

    return updatedConfig;
  }

  /**
   * Soft delete a configuration (set is_active to false)
   * @param {number} id - Configuration ID
   * @param {number} userId - ID of user making the change
   * @param {string} ipAddress - IP address of the request
   * @param {string} userAgent - User agent string
   * @returns {Promise<Object>}
   */
  async deleteConfig(id, userId, ipAddress = null, userAgent = null) {
    const config = await this.getConfigById(id);
    if (!config) {
      throw new Error('Configuration not found');
    }

    // Soft delete
    const [deletedConfig] = await this.db('system_config')
      .where({ id })
      .update({ is_active: false, updated_at: this.db.fn.now() })
      .returning('*');

    // Create audit entry
    await this.createAuditEntry({
      config_id: id,
      key: config.key,
      old_value: config.value,
      new_value: null,
      changed_by: userId,
      change_reason: 'Configuration deleted',
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // Clear cache
    this.cache.delete(config.key);

    return deletedConfig;
  }

  /**
   * Get audit history for a configuration
   * @param {number} configId - Configuration ID
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>}
   */
  async getAuditHistory(configId, limit = 50) {
    return await this.db('system_config_audit as sca')
      .leftJoin('users as u', 'sca.changed_by', 'u.id')
      .leftJoin('user_profiles as up', 'u.id', 'up.user_id')
      .where({ 'sca.config_id': configId })
      .select(
        'sca.*',
        'up.first_name as changed_by_first_name',
        'up.last_name as changed_by_last_name',
        'u.email as changed_by_email'
      )
      .orderBy('sca.changed_at', 'desc')
      .limit(limit);
  }

  /**
   * Get audit history by configuration key
   * @param {string} key - Configuration key
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>}
   */
  async getAuditHistoryByKey(key, limit = 50) {
    return await this.db('system_config_audit as sca')
      .leftJoin('users as u', 'sca.changed_by', 'u.id')
      .leftJoin('user_profiles as up', 'u.id', 'up.user_id')
      .where({ 'sca.key': key })
      .select(
        'sca.*',
        'up.first_name as changed_by_first_name',
        'up.last_name as changed_by_last_name',
        'u.email as changed_by_email'
      )
      .orderBy('sca.changed_at', 'desc')
      .limit(limit);
  }

  /**
   * Create an audit entry
   * @private
   * @param {Object} auditData - Audit data
   * @returns {Promise<Object>}
   */
  async createAuditEntry(auditData) {
    const [entry] = await this.db('system_config_audit')
      .insert({
        ...auditData,
        old_value: auditData.old_value !== null ? auditData.old_value : null,
        new_value: auditData.new_value
      })
      .returning('*');

    return entry;
  }

  /**
   * Validate configuration value against data type and validation rules
   * @private
   * @param {*} value - Value to validate
   * @param {string} dataType - Data type (string, number, boolean, json, enum)
   * @param {Object} validationRules - Validation rules
   * @throws {Error} If validation fails
   */
  validateConfigValue(value, dataType, validationRules) {
    // Type validation
    switch (dataType) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error(`Value must be a valid number`);
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Value must be a boolean`);
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Value must be a string`);
        }
        break;

      case 'enum':
        if (!validationRules?.allowed_values?.includes(value)) {
          throw new Error(
            `Value must be one of: ${validationRules.allowed_values.join(', ')}`
          );
        }
        break;

      case 'json':
        if (typeof value !== 'object') {
          throw new Error(`Value must be a valid JSON object`);
        }
        break;

      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }

    // Additional validation rules
    if (validationRules) {
      // Number range validation
      if (dataType === 'number') {
        if (validationRules.min !== undefined && value < validationRules.min) {
          throw new Error(`Value must be at least ${validationRules.min}`);
        }
        if (validationRules.max !== undefined && value > validationRules.max) {
          throw new Error(`Value must be at most ${validationRules.max}`);
        }
      }

      // String length validation
      if (dataType === 'string') {
        if (validationRules.minLength !== undefined && value.length < validationRules.minLength) {
          throw new Error(`Value must be at least ${validationRules.minLength} characters`);
        }
        if (validationRules.maxLength !== undefined && value.length > validationRules.maxLength) {
          throw new Error(`Value must be at most ${validationRules.maxLength} characters`);
        }
      }

      // Pattern validation
      if (validationRules.pattern && !new RegExp(validationRules.pattern).test(value)) {
        throw new Error(`Value does not match required pattern`);
      }
    }
  }

  /**
   * Clear all cached values
   * Useful after bulk updates or for manual cache invalidation
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      ttl_ms: this.CACHE_TTL,
      keys: Array.from(this.cache.keys())
    };
  }
}
