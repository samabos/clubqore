export class BillingSettingsService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get billing settings for a club
   */
  async getSettings(clubId) {
    try {
      const settings = await this.db('billing_settings')
        .where('club_id', clubId)
        .first();

      // If no settings exist, create default ones
      if (!settings) {
        return await this.createDefaultSettings(clubId);
      }

      return settings;
    } catch (error) {
      console.error('Error fetching billing settings:', error);
      throw error;
    }
  }

  /**
   * Create default billing settings for a club
   */
  async createDefaultSettings(clubId) {
    try {
      const [settingsId] = await this.db('billing_settings')
        .insert({
          club_id: clubId,
          service_charge_enabled: false,
          service_charge_type: 'percentage',
          service_charge_value: 0.00,
          service_charge_description: 'Platform Service Fee',
          auto_generation_enabled: false,
          days_before_season: 7,
          default_invoice_items: null,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('id');

      const settings = await this.db('billing_settings')
        .where('id', settingsId)
        .first();

      return settings;
    } catch (error) {
      console.error('Error creating default billing settings:', error);
      throw error;
    }
  }

  /**
   * Update billing settings
   */
  async updateSettings(clubId, settingsData) {
    try {
      // Ensure settings exist
      let settings = await this.db('billing_settings')
        .where('club_id', clubId)
        .first();

      if (!settings) {
        settings = await this.createDefaultSettings(clubId);
      }

      // Prepare update data with proper type conversions
      const updateData = {
        service_charge_enabled: settingsData.service_charge_enabled,
        service_charge_type: settingsData.service_charge_type,
        service_charge_value: parseFloat(settingsData.service_charge_value) || 0,
        service_charge_description: settingsData.service_charge_description,
        auto_generation_enabled: settingsData.auto_generation_enabled,
        days_before_season: parseInt(settingsData.days_before_season) || 7,
        updated_at: new Date()
      };

      // Handle JSONB field - Knex needs raw JSON for JSONB columns
      if ('default_invoice_items' in settingsData) {
        if (settingsData.default_invoice_items === null || settingsData.default_invoice_items === undefined) {
          updateData.default_invoice_items = this.db.raw('NULL');
        } else {
          // For JSONB, we need to cast the JSON string
          const jsonString = typeof settingsData.default_invoice_items === 'string'
            ? settingsData.default_invoice_items
            : JSON.stringify(settingsData.default_invoice_items);
          updateData.default_invoice_items = this.db.raw(`?::jsonb`, [jsonString]);
        }
      }

      // Update settings
      await this.db('billing_settings')
        .where('club_id', clubId)
        .update(updateData);

      // Return updated settings
      const updatedSettings = await this.db('billing_settings')
        .where('club_id', clubId)
        .first();

      return {
        success: true,
        settings: updatedSettings,
        message: 'Billing settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating billing settings:', error);
      throw error;
    }
  }

  /**
   * Calculate service charge amount
   */
  async calculateServiceCharge(clubId, subtotal) {
    try {
      const settings = await this.getSettings(clubId);

      if (!settings.service_charge_enabled) {
        return 0;
      }

      // Ensure service_charge_value is a valid number
      const chargeValue = parseFloat(settings.service_charge_value) || 0;
      let serviceCharge = 0;

      if (settings.service_charge_type === 'percentage') {
        serviceCharge = subtotal * (chargeValue / 100);
      } else if (settings.service_charge_type === 'fixed') {
        serviceCharge = chargeValue;
      }

      return parseFloat(serviceCharge.toFixed(2));
    } catch (error) {
      console.error('Error calculating service charge:', error);
      throw error;
    }
  }

  /**
   * Apply service charge to invoice items
   * Returns updated items array with service charge as last item
   */
  async applyServiceCharge(clubId, invoiceItems) {
    try {
      const settings = await this.getSettings(clubId);

      if (!settings.service_charge_enabled) {
        return invoiceItems;
      }

      // Calculate subtotal from existing items
      const subtotal = invoiceItems.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 1;
        const unitPrice = parseFloat(item.unit_price) || 0;
        return sum + (quantity * unitPrice);
      }, 0);

      // Calculate service charge
      const serviceCharge = await this.calculateServiceCharge(clubId, subtotal);

      if (serviceCharge === 0) {
        return invoiceItems;
      }

      // Add service charge as last line item
      const serviceChargeItem = {
        description: settings.service_charge_description || 'Platform Service Fee',
        category: 'other',
        quantity: 1,
        unit_price: serviceCharge,
        total_price: serviceCharge
      };

      return [...invoiceItems, serviceChargeItem];
    } catch (error) {
      console.error('Error applying service charge:', error);
      throw error;
    }
  }

  /**
   * Get default invoice items for seasonal billing
   */
  async getDefaultInvoiceItems(clubId) {
    try {
      const settings = await this.getSettings(clubId);
      return settings.default_invoice_items || [];
    } catch (error) {
      console.error('Error fetching default invoice items:', error);
      throw error;
    }
  }

  /**
   * Update default invoice items
   */
  async updateDefaultInvoiceItems(clubId, items) {
    try {
      await this.db('billing_settings')
        .where('club_id', clubId)
        .update({
          default_invoice_items: JSON.stringify(items),
          updated_at: new Date()
        });

      return {
        success: true,
        message: 'Default invoice items updated successfully'
      };
    } catch (error) {
      console.error('Error updating default invoice items:', error);
      throw error;
    }
  }

  /**
   * Admin: Get billing settings for any club
   */
  async adminGetSettings(clubId) {
    return await this.getSettings(clubId);
  }

  /**
   * Admin: Update billing settings for any club
   */
  async adminUpdateSettings(clubId, settingsData) {
    return await this.updateSettings(clubId, settingsData);
  }
}
