// Club-specific validation schemas

export const clubSchemas = {
  // Update club schema
  updateClub: {
    type: 'object',
    properties: {
      name: { 
        type: 'string', 
        minLength: 1, 
        maxLength: 100,
        description: 'Club name'
      },
      description: { 
        type: 'string', 
        maxLength: 1000,
        description: 'Detailed description of the club'
      },
      category: { 
        type: 'string',
        enum: ['sports', 'academic', 'arts', 'community', 'hobby', 'professional', 'social', 'other'],
        description: 'Primary category of the club'
      },
      type: {
        type: 'string',
        enum: ['public', 'private', 'semi_private'],
        description: 'Club visibility and membership type'
      },
      location: {
        oneOf: [
          // Legacy string format
          {
            type: 'string',
            maxLength: 255,
            description: 'Physical location or address (legacy)'
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
      contactEmail: { 
        type: 'string', 
        format: 'email',
        description: 'Primary contact email for the club'
      },
      contactPhone: { 
        type: 'string', 
        pattern: '^[+]?[1-9]\\d{1,14}$',
        description: 'Primary contact phone number'
      },
      website: { 
        type: 'string', 
        format: 'uri',
        description: 'Club website URL'
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
          discord: { type: 'string', format: 'uri' }
        },
        additionalProperties: false
      },
      logoUrl: { 
        type: 'string', 
        format: 'uri',
        description: 'URL to club logo image'
      },
      bannerUrl: { 
        type: 'string', 
        format: 'uri',
        description: 'URL to club banner/cover image'
      },
      isFeatured: { 
        type: 'boolean', 
        default: false,
        description: 'Whether club appears in featured listings'
      },
      isPublic: { 
        type: 'boolean', 
        default: true,
        description: 'Whether club is visible in public searches'
      },
      membershipFee: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0 },
          currency: { type: 'string', pattern: '^[A-Z]{3}$', default: 'USD' },
          frequency: { 
            type: 'string', 
            enum: ['one_time', 'monthly', 'quarterly', 'yearly'],
            default: 'yearly'
          },
          description: { type: 'string', maxLength: 200 }
        },
        additionalProperties: false
      },
      meetingSchedule: {
        type: 'object',
        properties: {
          frequency: {
            type: 'string',
            enum: ['weekly', 'bi_weekly', 'monthly', 'quarterly', 'irregular', 'as_needed']
          },
          dayOfWeek: {
            type: 'string',
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          },
          time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
          duration: { type: 'integer', minimum: 15, maximum: 480 },
          location: { type: 'string', maxLength: 200 },
          virtual: { type: 'boolean', default: false },
          virtualPlatform: { type: 'string', maxLength: 50 }
        },
        additionalProperties: false
      },
      rules: {
        type: 'array',
        items: { 
          type: 'string', 
          minLength: 1,
          maxLength: 500 
        },
        maxItems: 20,
        description: 'Club rules and guidelines'
      },
      activities: {
        type: 'array',
        items: { 
          type: 'string', 
          minLength: 1,
          maxLength: 100 
        },
        maxItems: 50,
        description: 'Activities and events the club organizes'
      },
      tags: {
        type: 'array',
        items: { 
          type: 'string', 
          minLength: 1,
          maxLength: 30 
        },
        maxItems: 20,
        uniqueItems: true,
        description: 'Tags for better searchability'
      },
      ageRange: {
        type: 'object',
        properties: {
          min: { type: 'integer', minimum: 0, maximum: 120 },
          max: { type: 'integer', minimum: 0, maximum: 120 }
        },
        additionalProperties: false
      },
      maxMembers: { 
        type: 'integer', 
        minimum: 1,
        description: 'Maximum number of members allowed'
      }
    },
    additionalProperties: false
  },

  // Search clubs schema
  searchClubs: {
    type: 'object',
    properties: {
      q: { 
        type: 'string', 
        minLength: 1, 
        maxLength: 100,
        description: 'Search query string'
      },
      category: { 
        type: 'string',
        enum: ['sports', 'academic', 'arts', 'community', 'hobby', 'professional', 'social', 'other'],
        description: 'Filter by club category'
      },
      location: { 
        type: 'string', 
        maxLength: 100,
        description: 'Filter by location/city'
      },
      type: {
        type: 'string',
        enum: ['public', 'private', 'semi_private'],
        description: 'Filter by club type'
      },
      featured: {
        type: 'boolean',
        description: 'Show only featured clubs'
      },
      hasSpace: {
        type: 'boolean',
        description: 'Show only clubs accepting new members'
      },
      ageRange: {
        type: 'object',
        properties: {
          min: { type: 'integer', minimum: 0, maximum: 120 },
          max: { type: 'integer', minimum: 0, maximum: 120 }
        }
      },
      tags: {
        type: 'array',
        items: { type: 'string', maxLength: 30 },
        maxItems: 10
      },
      limit: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 100, 
        default: 20,
        description: 'Number of results to return'
      },
      offset: { 
        type: 'integer', 
        minimum: 0, 
        default: 0,
        description: 'Number of results to skip (pagination)'
      },
      sortBy: {
        type: 'string',
        enum: ['relevance', 'name', 'created_date', 'member_count', 'activity'],
        default: 'relevance'
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc'
      }
    },
    additionalProperties: false
  },

  // Create invite code schema
  createInviteCode: {
    type: 'object',
    properties: {
      usageLimit: { 
        type: 'integer', 
        minimum: 1,
        maximum: 1000,
        description: 'Maximum number of times this code can be used'
      },
      expiresAt: { 
        type: 'string', 
        format: 'date-time',
        description: 'When the invite code expires (ISO 8601 format)'
      },
      description: { 
        type: 'string', 
        maxLength: 200,
        description: 'Description or purpose of this invite code'
      },
      memberRole: {
        type: 'string',
        enum: ['member', 'moderator'],
        default: 'member',
        description: 'Role that new members will receive'
      },
      requireApproval: {
        type: 'boolean',
        default: false,
        description: 'Whether new members need manager approval'
      },
      welcomeMessage: {
        type: 'string',
        maxLength: 500,
        description: 'Custom welcome message for new members using this code'
      }
    },
    additionalProperties: false
  },

  // Browse clubs schema
  browseClubs: {
    type: 'object',
    properties: {
      limit: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 100, 
        default: 20,
        description: 'Number of clubs to return per category'
      },
      includeFeatured: {
        type: 'boolean',
        default: true,
        description: 'Include featured clubs section'
      },
      includeByCategory: {
        type: 'boolean',
        default: true,
        description: 'Include clubs grouped by category'
      },
      includeRecommended: {
        type: 'boolean',
        default: false,
        description: 'Include personalized recommendations (requires user context)'
      }
    },
    additionalProperties: false
  }
};

export const clubTeamManagersParamsSchema = {
  params: {
    type: 'object',
    required: ['clubId'],
    properties: {
      clubId: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Club ID'
      },
      teamManagerId: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Team Manager User ID'
      }
    }
  }
};
