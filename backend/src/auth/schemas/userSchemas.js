export const userProfile = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string', nullable: true },
    avatar: { type: 'string', nullable: true },
    roles: { 
      type: 'array', 
      items: { 
        type: 'string',
        enum: ['member', 'parent', 'club_manager', 'admin']
      },
      default: ['member']
    },
    primaryRole: { 
      type: 'string',
      enum: ['member', 'parent', 'club_manager', 'admin'],
      default: 'member'
    },
    accountType: { 
      type: 'string',
      enum: ['member', 'parent', 'club'],
      nullable: true
    },
    isOnboarded: { type: 'boolean', default: false },
    emailVerified: { type: 'boolean', default: false },
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
};

export const updateUserRequest = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    avatar: { type: 'string' },
    primaryRole: { 
      type: 'string',
      enum: ['member', 'parent', 'club_manager', 'admin']
    },
    accountType: { 
      type: 'string',
      enum: ['member', 'parent', 'club']
    },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 }
  }
};

export const userSchemas = {
  userProfile,
  updateUserRequest
};
