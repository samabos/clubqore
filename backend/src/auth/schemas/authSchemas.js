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
    error: { type: 'string' }
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
  errorResponse
};