export const createTeamSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Team name'
    },
    color: {
      type: 'string',
      pattern: '^#[0-9A-Fa-f]{6}$',
      description: 'Team color in hex format (e.g., #FF5733)'
    },
    is_active: {
      type: 'boolean',
      description: 'Whether the team is active'
    },
    manager_id: {
      type: ['integer', 'null'],
      minimum: 1,
      description: 'ID of the team manager (optional on create)'
    }
  },
  required: ['name'],
  additionalProperties: false
};

export const updateTeamSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Team name'
    },
    color: {
      type: 'string',
      pattern: '^#[0-9A-Fa-f]{6}$',
      description: 'Team color in hex format (e.g., #FF5733)'
    },
    is_active: {
      type: 'boolean',
      description: 'Whether the team is active'
    },
    manager_id: {
      type: ['integer', 'null'],
      minimum: 1,
      description: 'ID of the team manager (null to remove manager)'
    }
  },
  additionalProperties: false,
  minProperties: 1
};

export const assignManagerSchema = {
  type: 'object',
  properties: {
    userId: {
      type: 'integer',
      minimum: 1,
      description: 'User ID of the team manager'
    }
  },
  required: ['userId'],
  additionalProperties: false
};

export const assignMemberSchema = {
  type: 'object',
  properties: {
    memberId: {
      type: 'integer',
      minimum: 1,
      description: 'Member account ID to assign to team'
    }
  },
  required: ['memberId'],
  additionalProperties: false
};
