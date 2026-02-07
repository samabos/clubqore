export const authRequest = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 }
  }
};

export const authResponse = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        email: { type: 'string' },
        name: { type: 'string', nullable: true },
        avatar: { type: 'string', nullable: true },
        roles: { 
          type: 'array', 
          items: { 
            type: 'string',
            enum: ['member', 'parent', 'club_manager', 'admin']
          }
        },
        primaryRole: { 
          type: 'string',
          enum: ['member', 'parent', 'club_manager', 'admin']
        },
        accountType: { 
          type: 'string',
          enum: ['member', 'parent', 'club'],
          nullable: true
        },
        isOnboarded: { type: 'boolean' },
        emailVerified: { type: 'boolean' },
        clubId: { type: 'string', nullable: true }
      }
    },
    expiresIn: { type: 'integer', default: 900 } // 15 minutes
  }
};

export const refreshRequest = {
  type: 'object',
  properties: {
    refreshToken: { type: 'string' }
  }
};

export const refreshResponse = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' }
  }
};

export const userResponse = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        email: { type: 'string' },
        name: { type: 'string', nullable: true },
        avatar: { type: 'string', nullable: true },
        roles: { 
          type: 'array', 
          items: { 
            type: 'string',
            enum: ['member', 'parent', 'club_manager', 'admin']
          }
        },
        primaryRole: { 
          type: 'string',
          enum: ['member', 'parent', 'club_manager', 'admin']
        },
        accountType: { 
          type: 'string',
          enum: ['member', 'parent', 'club'],
          nullable: true
        },
        isOnboarded: { type: 'boolean' },
        emailVerified: { type: 'boolean' },
        emailVerifiedAt: { type: 'string', format: 'date-time', nullable: true },
        clubId: { type: 'string', nullable: true },
        children: { 
          type: 'array',
          items: { type: 'string' },
          nullable: true
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    }
  }
};

export const messageResponse = {
  type: 'object',
  properties: {
    message: { type: 'string' }
  }
};

export const errorResponse = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    code: { type: 'string' }
  }
};

export const clubManagerRegistrationRequest = {
  type: 'object',
  required: ['email', 'password', 'firstName', 'lastName', 'clubName'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
    firstName: { type: 'string', minLength: 1, maxLength: 100 },
    lastName: { type: 'string', minLength: 1, maxLength: 100 },
    phone: { type: 'string', maxLength: 20 },
    clubName: { type: 'string', minLength: 1, maxLength: 255 },
    clubAddress: {
      oneOf: [
        { type: 'string' },
        {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            county: { type: 'string' },
            postcode: { type: 'string' },
            country: { type: 'string' }
          }
        }
      ]
    }
  }
};

export const registrationSuccessResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        email: { type: 'string' },
        emailVerified: { type: 'boolean' }
      }
    }
  }
};

// Combined export for easy importing
export const authSchemas = {
  authRequest,
  authResponse,
  refreshRequest,
  refreshResponse,
  userResponse,
  messageResponse,
  errorResponse,
  clubManagerRegistrationRequest,
  registrationSuccessResponse
};