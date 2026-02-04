export async function teamRoutes(fastify, options) {
  const { teamController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Team CRUD routes
  fastify.post('/', {
    schema: {
      tags: ['Teams'],
      summary: 'Create a new team'
    }
  }, teamController.createTeam.bind(teamController));

  fastify.get('/', {
    schema: {
      tags: ['Teams'],
      summary: 'Get all teams for the user\'s club'
    }
  }, teamController.getTeams.bind(teamController));

  fastify.get('/:teamId', {
    schema: {
      tags: ['Teams'],
      summary: 'Get team details with managers and members',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' }
        },
        required: ['teamId']
      }
    }
  }, teamController.getTeamById.bind(teamController));

  fastify.put('/:teamId', {
    schema: {
      tags: ['Teams'],
      summary: 'Update team details',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' }
        },
        required: ['teamId']
      }
    }
  }, teamController.updateTeam.bind(teamController));

  fastify.delete('/:teamId', {
    schema: {
      tags: ['Teams'],
      summary: 'Delete team',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' }
        },
        required: ['teamId']
      }
    }
  }, teamController.deleteTeam.bind(teamController));

  // Team manager routes
  fastify.post('/:teamId/managers', {
    schema: {
      tags: ['Teams'],
      summary: 'Assign team manager to team',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' }
        },
        required: ['teamId']
      }
    }
  }, teamController.assignTeamManager.bind(teamController));

  fastify.delete('/:teamId/managers/:userId', {
    schema: {
      tags: ['Teams'],
      summary: 'Remove team manager from team',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' },
          userId: { type: 'integer' }
        },
        required: ['teamId', 'userId']
      }
    }
  }, teamController.removeTeamManager.bind(teamController));

  fastify.get('/:teamId/managers', {
    schema: {
      tags: ['Teams'],
      summary: 'Get all managers for a team',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' }
        },
        required: ['teamId']
      }
    }
  }, teamController.getTeamManagers.bind(teamController));

  // Set team membership tier
  fastify.put('/:teamId/tier', {
    schema: {
      tags: ['Teams'],
      summary: 'Set membership tier for a team',
      description: 'Assigns a membership tier to a team. Members assigned to this team will be billed at this tier rate.',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' }
        },
        required: ['teamId']
      },
      body: {
        type: 'object',
        required: ['membershipTierId'],
        properties: {
          membershipTierId: { type: 'integer', description: 'The ID of the membership tier to assign' }
        }
      }
    }
  }, teamController.setTeamTier.bind(teamController));

  // Team member routes
  fastify.post('/:teamId/members', {
    schema: {
      tags: ['Teams'],
      summary: 'Assign member to team (creates subscription automatically)',
      description: 'Assigns a player to a team and automatically creates a subscription based on the team\'s membership tier.',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' }
        },
        required: ['teamId']
      },
      body: {
        type: 'object',
        required: ['memberId'],
        properties: {
          memberId: { type: 'integer', description: 'The user_children.id of the player to assign' },
          billingDayOfMonth: { type: 'integer', minimum: 1, maximum: 28, description: 'Optional: Day of month for billing (1-28)' },
          billingFrequency: { type: 'string', enum: ['monthly', 'annual'], description: 'Optional: Billing frequency' }
        }
      }
    }
  }, teamController.assignMemberToTeam.bind(teamController));

  fastify.delete('/:teamId/members/:memberId', {
    schema: {
      tags: ['Teams'],
      summary: 'Remove member from team',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' },
          memberId: { type: 'integer' }
        },
        required: ['teamId', 'memberId']
      }
    }
  }, teamController.removeMemberFromTeam.bind(teamController));

  fastify.get('/:teamId/members', {
    schema: {
      tags: ['Teams'],
      summary: 'Get all members in a team',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' }
        },
        required: ['teamId']
      }
    }
  }, teamController.getTeamMembers.bind(teamController));

  fastify.get('/assigned-children', {
    schema: {
      tags: ['Teams'],
      summary: 'Get all players already assigned to any team in the club',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: { type: 'integer' }
            }
          }
        }
      }
    }
  }, teamController.getAssignedChildrenInClub.bind(teamController));
}
