// Onboarding-specific validation schemas

export const onboardingSchemas = {
  // Complete initial onboarding schema
  completeOnboarding: {
    type: 'object',
    required: ['role'],
    properties: {
      role: {
        type: 'string',
        enum: ['club_manager'],
        description: 'Only club_manager role is supported for onboarding'
      },
      personalData: {
        type: 'object',
        required: ['firstName', 'lastName'],
        properties: {
          firstName: { type: 'string', minLength: 1, maxLength: 50 },
          lastName: { type: 'string', minLength: 1, maxLength: 50 },
          dateOfBirth: { type: 'string', format: 'date' },
          phoneNumber: { type: 'string', pattern: '^[+]?[1-9]\\d{1,14}$' },
          address: { type: 'string', maxLength: 255 },
          emergencyContact: {
            type: 'object',
            properties: {
              name: { type: 'string', maxLength: 100 },
              relationship: { type: 'string', maxLength: 50 },
              phone: { type: 'string', pattern: '^[+]?[1-9]\\d{1,14}$' },
              email: { type: 'string', format: 'email' }
            }
          },
          bio: { type: 'string', maxLength: 500 },
          interests: {
            type: 'array',
            items: { type: 'string', maxLength: 50 },
            maxItems: 20
          },
          avatarUrl: { type: 'string', format: 'uri' }
        }
      },
      clubData: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 1000 },
          category: { 
            type: 'string',
            enum: ['sports', 'academic', 'arts', 'community', 'hobby', 'professional', 'social', 'other']
          },
          type: {
            type: 'string',
            enum: ['public', 'private', 'semi_private'],
            default: 'public'
          },
          location: { type: 'string', maxLength: 255 },
          contactEmail: { type: 'string', format: 'email' },
          contactPhone: { type: 'string', pattern: '^[+]?[1-9]\\d{1,14}$' },
          website: { type: 'string', format: 'uri' },
          socialMedia: {
            type: 'object',
            properties: {
              facebook: { type: 'string', format: 'uri' },
              twitter: { type: 'string', format: 'uri' },
              instagram: { type: 'string', format: 'uri' },
              linkedin: { type: 'string', format: 'uri' },
              youtube: { type: 'string', format: 'uri' }
            }
          },
          logoUrl: { type: 'string', format: 'uri' },
          bannerUrl: { type: 'string', format: 'uri' }
        }
      },
      preferences: {
        type: 'object',
        properties: {
          notifications: {
            type: 'object',
            properties: {
              emailNotifications: { type: 'boolean', default: true },
              pushNotifications: { type: 'boolean', default: true },
              smsNotifications: { type: 'boolean', default: false },
              marketingEmails: { type: 'boolean', default: false }
            }
          },
          privacy: {
            type: 'object',
            properties: {
              profileVisibility: {
                type: 'string',
                enum: ['public', 'members_only', 'private'],
                default: 'members_only'
              },
              contactVisibility: {
                type: 'string',
                enum: ['public', 'members_only', 'private'],
                default: 'members_only'
              },
              activityVisibility: {
                type: 'string',
                enum: ['public', 'members_only', 'private'],
                default: 'members_only'
              }
            }
          },
          communication: {
            type: 'object',
            properties: {
              preferredLanguage: { type: 'string', default: 'en' },
              timezone: { type: 'string', default: 'UTC' },
              communicationMethod: {
                type: 'string',
                enum: ['email', 'sms', 'app', 'phone'],
                default: 'email'
              }
            }
          }
        }
      }
    },
    additionalProperties: false
  },

  // Add role schema (similar but for additional roles)
  addRole: {
    type: 'object',
    required: ['role'],
    properties: {
      role: {
        type: 'string',
        enum: ['club_manager']
      },
      // Include the same nested schemas as above
      personalData: { $ref: '#/definitions/personalData' },
      clubData: { $ref: '#/definitions/clubData' },
      preferences: { $ref: '#/definitions/preferences' }
    },
    additionalProperties: false
  },

  // Set primary role schema
  setPrimaryRole: {
    type: 'object',
    required: ['role'],
    properties: {
      role: {
        type: 'string',
        enum: ['club_manager']
      }
    },
    additionalProperties: false
  },

  // Update completion progress schema
  updateProgress: {
    type: 'object',
    required: ['step'],
    properties: {
      step: {
        type: 'string',
        enum: ['profile_created', 'role_selected', 'club_created', 'preferences_set', 'verification_complete']
      },
      role: {
        type: 'string',
        enum: ['club_manager']
      }
    },
    additionalProperties: false
  }
};
