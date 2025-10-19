/**
 * JSON Schema for team manager creation and management
 */

export const createTeamManagerSchema = {
  body: {
    type: 'object',
    required: ['firstName', 'lastName', 'email'],
    properties: {
      // Personal Data
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'First name of the team manager'
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Last name of the team manager'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email address (must be unique)'
      },
      phone: {
        type: 'string',
        maxLength: 20,
        description: 'Phone number (optional)'
      },
      dateOfBirth: {
        type: 'string',
        format: 'date',
        description: 'Date of birth in ISO format (optional)'
      },
      
      // Coach-Specific Data
      specialization: {
        type: 'string',
        maxLength: 100,
        description: 'Coach specialization (e.g., Head Coach, Assistant Coach)'
      },
      certificationLevel: {
        type: 'string',
        maxLength: 100,
        description: 'Certification level (optional)'
      },
      yearsOfExperience: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
        description: 'Years of coaching experience (optional)'
      },
      bio: {
        type: 'string',
        maxLength: 1000,
        description: 'Biography or description (optional)'
      },
      
      // Email Settings
      sendLoginEmail: {
        type: 'boolean',
        default: true,
        description: 'Whether to send login credentials email'
      }
    },
    additionalProperties: false
  }
};

export const updateTeamManagerSchema = {
  body: {
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      phone: {
        type: 'string',
        maxLength: 20
      },
      specialization: {
        type: 'string',
        maxLength: 100
      },
      certificationLevel: {
        type: 'string',
        maxLength: 100
      },
      yearsOfExperience: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      bio: {
        type: 'string',
        maxLength: 1000
      }
    },
    additionalProperties: false
  }
};

export const teamManagerParamsSchema = {
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
