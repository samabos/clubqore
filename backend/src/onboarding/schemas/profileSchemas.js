// Profile-specific validation schemas

export const profileSchemas = {
  // Update user profile schema
  updateProfile: {
    type: 'object',
    properties: {
      firstName: { type: 'string', minLength: 1, maxLength: 50 },
      lastName: { type: 'string', minLength: 1, maxLength: 50 },
      fullName: { type: 'string', minLength: 1, maxLength: 100 },
      dateOfBirth: { type: 'string', format: 'date' },
      phoneNumber: { 
        type: 'string', 
        pattern: '^[+]?[1-9]\\d{1,14}$',
        description: 'Phone number in international format'
      },
      address: {
        oneOf: [
          // Legacy string format
          {
            type: 'string',
            maxLength: 255,
            description: 'Full address as string (legacy)'
          },
          // New structured format
          {
            type: 'object',
            properties: {
              street: { type: 'string', maxLength: 255 },
              city: { type: 'string', maxLength: 100 },
              county: { type: 'string', maxLength: 100 },
              postcode: {
                type: 'string',
                pattern: '^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\\s?[0-9][A-Z]{2}$',
                description: 'UK postcode format'
              },
              country: {
                type: 'string',
                enum: ['England', 'Scotland', 'Wales', 'Northern Ireland']
              }
            },
            required: ['postcode', 'country'],
            additionalProperties: false,
            description: 'Structured UK address'
          },
          // Null value
          {
            type: 'null'
          }
        ]
      },
      emergencyContact: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          relationship: { 
            type: 'string', 
            enum: ['spouse', 'parent', 'sibling', 'child', 'friend', 'colleague', 'other'],
            maxLength: 50 
          },
          phone: { type: 'string', pattern: '^[+]?[1-9]\\d{1,14}$' },
          email: { type: 'string', format: 'email' }
        },
        required: ['name', 'phone'],
        additionalProperties: false
      },
      bio: { 
        type: 'string', 
        maxLength: 500,
        description: 'Short biography or description'
      },
      interests: {
        type: 'array',
        items: { 
          type: 'string', 
          minLength: 1,
          maxLength: 50 
        },
        maxItems: 20,
        uniqueItems: true,
        description: 'List of personal interests or hobbies'
      },
      avatarUrl: { 
        type: 'string', 
        format: 'uri',
        description: 'URL to profile picture/avatar'
      },
      socialMedia: {
        type: 'object',
        properties: {
          facebook: { type: 'string', format: 'uri' },
          twitter: { type: 'string', format: 'uri' },
          instagram: { type: 'string', format: 'uri' },
          linkedin: { type: 'string', format: 'uri' },
          youtube: { type: 'string', format: 'uri' },
          tiktok: { type: 'string', format: 'uri' },
          website: { type: 'string', format: 'uri' }
        },
        additionalProperties: false
      },
      skills: {
        type: 'array',
        items: { 
          type: 'string', 
          minLength: 1,
          maxLength: 50 
        },
        maxItems: 15,
        uniqueItems: true,
        description: 'Professional or personal skills'
      },
      education: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            institution: { type: 'string', maxLength: 100 },
            degree: { type: 'string', maxLength: 100 },
            fieldOfStudy: { type: 'string', maxLength: 100 },
            startYear: { type: 'integer', minimum: 1900, maximum: 2100 },
            endYear: { type: 'integer', minimum: 1900, maximum: 2100 },
            current: { type: 'boolean', default: false }
          },
          additionalProperties: false
        },
        maxItems: 10
      },
      workExperience: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            company: { type: 'string', maxLength: 100 },
            position: { type: 'string', maxLength: 100 },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            current: { type: 'boolean', default: false },
            description: { type: 'string', maxLength: 500 }
          },
          additionalProperties: false
        },
        maxItems: 10
      }
    },
    additionalProperties: false
  },

  // Update user preferences schema
  updatePreferences: {
    type: 'object',
    properties: {
      notifications: {
        type: 'object',
        properties: {
          emailNotifications: { 
            type: 'boolean', 
            default: true,
            description: 'Receive general email notifications'
          },
          pushNotifications: { 
            type: 'boolean', 
            default: true,
            description: 'Receive push notifications on mobile app'
          },
          smsNotifications: { 
            type: 'boolean', 
            default: false,
            description: 'Receive SMS notifications for urgent matters'
          },
          marketingEmails: { 
            type: 'boolean', 
            default: false,
            description: 'Receive promotional and marketing emails'
          },
          weeklyDigest: { 
            type: 'boolean', 
            default: true,
            description: 'Receive weekly summary emails'
          },
          eventReminders: { 
            type: 'boolean', 
            default: true,
            description: 'Receive reminders for upcoming events'
          },
          newMemberAlerts: { 
            type: 'boolean', 
            default: false,
            description: 'Get notified when new members join your clubs'
          }
        },
        additionalProperties: false
      },
      privacy: {
        type: 'object',
        properties: {
          profileVisibility: {
            type: 'string',
            enum: ['public', 'members_only', 'private'],
            default: 'members_only',
            description: 'Who can view your profile information'
          },
          contactVisibility: {
            type: 'string',
            enum: ['public', 'members_only', 'private'],
            default: 'members_only',
            description: 'Who can see your contact information'
          },
          activityVisibility: {
            type: 'string',
            enum: ['public', 'members_only', 'private'],
            default: 'members_only',
            description: 'Who can see your activity and participation'
          },
          searchability: {
            type: 'boolean',
            default: true,
            description: 'Allow others to find you through search'
          },
          showOnlineStatus: {
            type: 'boolean',
            default: true,
            description: 'Show when you are online to other members'
          }
        },
        additionalProperties: false
      },
      communication: {
        type: 'object',
        properties: {
          preferredLanguage: { 
            type: 'string', 
            pattern: '^[a-z]{2}(-[A-Z]{2})?$',
            default: 'en',
            description: 'Preferred language code (e.g., en, es, fr)'
          },
          timezone: { 
            type: 'string',
            default: 'UTC',
            description: 'Timezone identifier (e.g., America/New_York)'
          },
          communicationMethod: {
            type: 'string',
            enum: ['email', 'sms', 'app', 'phone'],
            default: 'email',
            description: 'Preferred method for important communications'
          },
          dateFormat: {
            type: 'string',
            enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
            default: 'MM/DD/YYYY',
            description: 'Preferred date display format'
          },
          timeFormat: {
            type: 'string',
            enum: ['12-hour', '24-hour'],
            default: '12-hour',
            description: 'Preferred time display format'
          }
        },
        additionalProperties: false
      },
      accessibility: {
        type: 'object',
        properties: {
          reducedMotion: { 
            type: 'boolean', 
            default: false,
            description: 'Reduce animations and motion effects'
          },
          highContrast: { 
            type: 'boolean', 
            default: false,
            description: 'Use high contrast colors for better visibility'
          },
          largeFonts: { 
            type: 'boolean', 
            default: false,
            description: 'Use larger font sizes throughout the app'
          },
          screenReader: { 
            type: 'boolean', 
            default: false,
            description: 'Optimize interface for screen reader compatibility'
          }
        },
        additionalProperties: false
      }
    },
    additionalProperties: false
  },

  // Upload avatar schema
  uploadAvatar: {
    type: 'object',
    required: ['avatarUrl'],
    properties: {
      avatarUrl: { 
        type: 'string', 
        format: 'uri',
        description: 'URL to the uploaded avatar image'
      }
    },
    additionalProperties: false
  },

  // Add child schema (for parents)
  addChild: {
    type: 'object',
    required: ['name', 'dateOfBirth'],
    properties: {
      childUserId: { 
        type: 'integer', 
        minimum: 1,
        description: 'If child has their own account, link to it'
      },
      name: { 
        type: 'string', 
        minLength: 1, 
        maxLength: 100,
        description: 'Full name of the child'
      },
      firstName: { type: 'string', minLength: 1, maxLength: 50 },
      lastName: { type: 'string', minLength: 1, maxLength: 50 },
      dateOfBirth: { 
        type: 'string', 
        format: 'date',
        description: 'Child date of birth (YYYY-MM-DD)'
      },
      relationship: {
        type: 'string',
        enum: ['parent', 'guardian', 'grandparent', 'sibling', 'other'],
        default: 'parent',
        description: 'Relationship to the child'
      },
      gradeLevel: { 
        type: 'string', 
        maxLength: 20,
        description: 'Current grade level or year in school'
      },
      school: { 
        type: 'string', 
        maxLength: 100,
        description: 'Name of school currently attending'
      },
      medicalInfo: { 
        type: 'string', 
        maxLength: 500,
        description: 'Important medical information, allergies, etc.'
      },
      emergencyContact: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          relationship: { type: 'string', maxLength: 50 },
          phone: { type: 'string', pattern: '^[+]?[1-9]\\d{1,14}$' },
          email: { type: 'string', format: 'email' }
        },
        required: ['name', 'phone'],
        additionalProperties: false
      },
      interests: {
        type: 'array',
        items: { 
          type: 'string', 
          minLength: 1,
          maxLength: 50 
        },
        maxItems: 10,
        uniqueItems: true,
        description: 'Child interests and hobbies'
      },
      clubId: { 
        type: 'integer', 
        minimum: 1,
        description: 'If child is member of a specific club'
      },
      membershipCode: { 
        type: 'string', 
        maxLength: 50,
        description: 'Club-specific membership code for the child'
      }
    },
    additionalProperties: false
  }
};
