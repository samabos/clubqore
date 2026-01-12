export const profileRoutes = async function (fastify, options) {
  const { profileController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Update user profile
  fastify.put('/', {
    schema: {
      tags: ['Profile'],
      summary: 'Update user profile',
      body: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          phone: { type: 'string' },
          address: { type: 'string' },
          workplace: { type: 'string' },
          workPhone: { type: 'string' },
          medicalInfo: { type: 'string' },
          emergencyContact: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              relationship: { type: 'string' },
              phone: { type: 'string' },
              email: { type: 'string', format: 'email' }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                fullName: { type: 'string' },
                dateOfBirth: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' },
                emergencyContact: { type: 'object' },
                workplace: { type: 'string' },
                workPhone: { type: 'string' },
                medicalInfo: { type: 'string' },
                avatar: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    }
  }, profileController.updateUserProfile.bind(profileController));

  // Get user profile (current user)
  fastify.get('/', {
    schema: {
      tags: ['Profile'],
      summary: 'Get current user profile'
    }
  }, profileController.getUserProfile.bind(profileController));

  // Get user profile by ID
  fastify.get('/:userId', {
    schema: {
      tags: ['Profile'],
      summary: 'Get user profile by ID'
    }
  }, profileController.getUserProfile.bind(profileController));

  // Update user preferences
  fastify.put('/preferences', {
    schema: {
      tags: ['Profile'],
      summary: 'Update user preferences',
      body: {
        type: 'object',
        properties: {
          notifications: {
            type: 'object',
            properties: {
              email_notifications: { type: 'boolean' },
              push_notifications: { type: 'boolean' },
              sms_notifications: { type: 'boolean' },
              marketing_emails: { type: 'boolean' },
              schedule_changes: { type: 'boolean' },
              payment_reminders: { type: 'boolean' },
              emergency_alerts: { type: 'boolean' },
              general_updates: { type: 'boolean' }
            }
          },
          privacy: {
            type: 'object',
            properties: {
              profile_visibility: { type: 'string', enum: ['public', 'members_only', 'private'] },
              contact_visibility: { type: 'string', enum: ['public', 'members_only', 'private'] },
              activity_visibility: { type: 'string', enum: ['public', 'members_only', 'private'] }
            }
          },
          communication: {
            type: 'object',
            properties: {
              preferred_language: { type: 'string' },
              timezone: { type: 'string' },
              communication_method: { type: 'string', enum: ['email', 'sms', 'app', 'phone'] },
              theme: { type: 'string', enum: ['light', 'dark', 'auto'] }
            }
          },
          // Support flat structure for backward compatibility
          scheduleChanges: { type: 'boolean' },
          paymentReminders: { type: 'boolean' },
          emergencyAlerts: { type: 'boolean' },
          generalUpdates: { type: 'boolean' },
          emailNotifications: { type: 'boolean' },
          smsNotifications: { type: 'boolean' },
          pushNotifications: { type: 'boolean' },
          profileVisibility: { type: 'string', enum: ['public', 'members_only', 'private'] },
          showContactInfo: { type: 'boolean' },
          theme: { type: 'string', enum: ['light', 'dark', 'auto'] },
          language: { type: 'string' }
        }
      }
    }
  }, profileController.updateUserPreferences.bind(profileController));

  // Get user preferences
  fastify.get('/preferences', {
    schema: {
      tags: ['Profile'],
      summary: 'Get user preferences'
    }
  }, profileController.getUserPreferences.bind(profileController));

  // Upload and set user avatar
  fastify.post('/avatar', {
    schema: {
      tags: ['Profile'],
      summary: 'Upload and set user avatar',
      body: {
        type: 'object',
        required: ['avatarData'],
        properties: {
          avatarData: { type: 'string' }
        }
      }
    }
  }, profileController.uploadAvatar.bind(profileController));

  // Get user children (for parents)
  fastify.get('/children', {
    schema: {
      tags: ['Profile'],
      summary: 'Get user children (for parents)'
    }
  }, profileController.getUserChildren.bind(profileController));

  // Add child for parent user
  fastify.post('/children', {
    schema: {
      tags: ['Profile'],
      summary: 'Add child for parent user',
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'dateOfBirth', 'relationship'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          relationship: { type: 'string' },
          childUserId: { type: 'string' },
          clubId: { type: 'string' },
          membershipCode: { type: 'string' }
        }
      }
    }
  }, profileController.addUserChild.bind(profileController));

  // Change password for logged-in user
  fastify.put('/change-password', {
    schema: {
      tags: ['Profile'],
      summary: 'Change password for logged-in user',
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, profileController.changePassword.bind(profileController));
};
