// Invite and account-specific validation schemas

export const inviteSchemas = {
  // Validate invite code schema
  validateInviteCode: {
    type: 'object',
    required: ['code'],
    properties: {
      code: { 
        type: 'string', 
        minLength: 6, 
        maxLength: 20,
        pattern: '^[A-Z0-9]+$',
        description: 'Invite code to validate (uppercase alphanumeric)'
      }
    },
    additionalProperties: false
  },

  // Preview invite code schema
  previewInviteCode: {
    type: 'object',
    required: ['code'],
    properties: {
      code: { 
        type: 'string', 
        minLength: 6, 
        maxLength: 20,
        pattern: '^[A-Z0-9]+$',
        description: 'Invite code to preview (uppercase alphanumeric)'
      }
    },
    additionalProperties: false
  }
};

export const accountSchemas = {
  // Generate account number schema
  generateAccountNumber: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        enum: ['club_manager', 'member', 'parent'],
        description: 'Role for which to generate account number'
      },
      clubId: { 
        type: 'integer', 
        minimum: 1,
        description: 'Club ID if role is club-specific'
      }
    },
    additionalProperties: false
  },

  // Search accounts schema
  searchAccounts: {
    type: 'object',
    required: ['query'],
    properties: {
      query: { 
        type: 'string', 
        minLength: 1, 
        maxLength: 100,
        description: 'Search query (account number, name, email, etc.)'
      },
      role: {
        type: 'string',
        enum: ['club_manager', 'member', 'parent'],
        description: 'Filter by account role'
      },
      clubId: { 
        type: 'integer', 
        minimum: 1,
        description: 'Filter by club association'
      },
      isActive: {
        type: 'boolean',
        description: 'Filter by account status'
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
      }
    },
    additionalProperties: false
  }
};

// Common validation patterns
export const commonPatterns = {
  accountNumber: {
    type: 'string',
    pattern: '^CQ\\d{4}\\d{5}$',
    description: 'Account number format: CQ + year + 5-digit sequence'
  },
  inviteCode: {
    type: 'string',
    minLength: 6,
    maxLength: 20,
    pattern: '^[A-Z0-9]+$',
    description: 'Invite code format: uppercase alphanumeric'
  },
  phoneNumber: {
    type: 'string',
    pattern: '^[+]?[1-9]\\d{1,14}$',
    description: 'Phone number in international format'
  },
  email: {
    type: 'string',
    format: 'email',
    maxLength: 255
  },
  url: {
    type: 'string',
    format: 'uri',
    maxLength: 500
  },
  name: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
    pattern: '^[a-zA-Z\\s\\-\'\\u00C0-\\u017F]+$',
    description: 'Name containing letters, spaces, hyphens, apostrophes, and accented characters'
  }
};
