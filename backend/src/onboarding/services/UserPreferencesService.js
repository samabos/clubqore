export class UserPreferencesService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get user's preferences (create defaults if none exist)
   */
  async getUserPreferences(userId) {
    let preferences = await this.db('user_preferences')
      .where({ user_id: userId })
      .first();

    if (!preferences) {
      // Create default preferences
      preferences = await this.createDefaultPreferences(userId);
    }

    return this.formatPreferences(preferences);
  }

  /**
   * Update user preferences (upsert)
   */
  async updateUserPreferences(userId, preferencesData, trx = null) {
    const db = trx || this.db;
    
    const existing = await db('user_preferences')
      .where({ user_id: userId })
      .first();

    // Handle both flat and nested preference structures
    const notifications = preferencesData.notifications || {};
    const privacy = preferencesData.privacy || {};
    const communication = preferencesData.communication || {};

    const preferenceFields = {
      // Map nested notifications to flat structure
      schedule_changes: preferencesData.scheduleChanges ?? notifications.schedule_changes ?? true,
      payment_reminders: preferencesData.paymentReminders ?? notifications.payment_reminders ?? true,
      emergency_alerts: preferencesData.emergencyAlerts ?? notifications.emergency_alerts ?? true,
      general_updates: preferencesData.generalUpdates ?? notifications.general_updates ?? true,
      email_notifications: preferencesData.emailNotifications ?? notifications.email_notifications ?? true,
      sms_notifications: preferencesData.smsNotifications ?? notifications.sms_notifications ?? false,
      push_notifications: preferencesData.pushNotifications ?? notifications.push_notifications ?? true,
      
      // Map nested privacy to flat structure  
      profile_visibility: preferencesData.profileVisibility ?? privacy.profile_visibility ?? 'members_only',
      show_contact_info: preferencesData.showContactInfo ?? (privacy.contact_visibility === 'public'),
      
      // Map nested communication to flat structure
      theme: preferencesData.theme ?? communication.theme ?? 'auto',
      language: preferencesData.language ?? communication.preferred_language ?? 'en',
      updated_at: new Date()
    };

    // Remove undefined values
    Object.keys(preferenceFields).forEach(key => {
      if (preferenceFields[key] === undefined) {
        delete preferenceFields[key];
      }
    });

    if (existing) {
      await db('user_preferences')
        .where({ user_id: userId })
        .update(preferenceFields);
    } else {
      await db('user_preferences').insert({
        user_id: userId,
        ...preferenceFields,
        created_at: new Date()
      });
    }

    return await this.getUserPreferences(userId);
  }

  /**
   * Get notification settings for specific types
   */
  async getNotificationSettings(userId) {
    const preferences = await this.getUserPreferences(userId);

    return {
      scheduleChanges: preferences.scheduleChanges,
      paymentReminders: preferences.paymentReminders,
      emergencyAlerts: preferences.emergencyAlerts,
      generalUpdates: preferences.generalUpdates,
      emailEnabled: preferences.emailNotifications,
      smsEnabled: preferences.smsNotifications,
      pushEnabled: preferences.pushNotifications
    };
  }

  /**
   * Create default preferences for new users
   */
  async createDefaultPreferences(userId) {
    const defaultPreferences = {
      user_id: userId,
      schedule_changes: true,
      payment_reminders: true,
      emergency_alerts: true,
      general_updates: true,
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      profile_visibility: 'members_only',
      show_contact_info: false,
      theme: 'auto',
      language: 'en',
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.db('user_preferences').insert(defaultPreferences);
    return defaultPreferences;
  }

  /**
   * Format preferences for API response
   */
  formatPreferences(preferences) {
    return {
      scheduleChanges: preferences.schedule_changes,
      paymentReminders: preferences.payment_reminders,
      emergencyAlerts: preferences.emergency_alerts,
      generalUpdates: preferences.general_updates,
      emailNotifications: preferences.email_notifications,
      smsNotifications: preferences.sms_notifications,
      pushNotifications: preferences.push_notifications,
      profileVisibility: preferences.profile_visibility,
      showContactInfo: preferences.show_contact_info,
      theme: preferences.theme,
      language: preferences.language,
      createdAt: preferences.created_at?.toISOString(),
      updatedAt: preferences.updated_at?.toISOString()
    };
  }

  /**
   * Check if preferences have been customized
   */
  async arePreferencesSet(userId) {
    const preferences = await this.db('user_preferences')
      .where({ user_id: userId })
      .first();

    // If preferences exist and have been updated after creation
    return preferences && preferences.updated_at > preferences.created_at;
  }
}
