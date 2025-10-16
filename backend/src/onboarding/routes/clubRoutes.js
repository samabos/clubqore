export const clubRoutes = async function (fastify, options) {
  const { clubController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Create new club
  fastify.post('/', {
    schema: {
      tags: ['Clubs'],
      summary: 'Create new club',
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          clubType: { type: 'string', enum: ['youth-academy', 'amateur-club', 'semi-professional', 'professional', 'training-center'] },
          description: { type: ['string', 'null'], maxLength: 1000 },
          foundedYear: { type: ['integer', 'null'], minimum: 1800, maximum: new Date().getFullYear() },
          membershipCapacity: { type: ['integer', 'null'], minimum: 1 },
          website: { type: ['string', 'null'], format: 'uri' },
          address: { type: ['string', 'null'], maxLength: 500 },
          phone: { type: ['string', 'null'], maxLength: 20 },
          email: { type: ['string', 'null'], format: 'email' },
          logoUrl: { type: ['string', 'null'], format: 'uri' }
        },
        required: ['name', 'clubType']
      }
    }
  }, clubController.createClub.bind(clubController));

  // Get club details
  fastify.get('/:clubId', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get club details',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        }
      }
    }
  }, clubController.getClub.bind(clubController));

  // Update club information (club managers only)
  fastify.put('/:clubId', {
    schema: {
      tags: ['Clubs'],
      summary: 'Update club information (club managers only)',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          clubType: { type: 'string', enum: ['youth-academy', 'amateur-club', 'semi-professional', 'professional', 'training-center'] },
          description: { type: ['string', 'null'], maxLength: 1000 },
          foundedYear: { type: ['integer', 'null'], minimum: 1800, maximum: new Date().getFullYear() },
          membershipCapacity: { type: ['integer', 'null'], minimum: 1 },
          website: { type: ['string', 'null'], format: 'uri' },
          address: { type: ['string', 'null'], maxLength: 500 },
          phone: { type: ['string', 'null'], maxLength: 20 },
          email: { type: ['string', 'null'], format: 'email' },
          logoUrl: { type: ['string', 'null'], format: 'uri' }
        }
      }
    }
  }, clubController.updateClub.bind(clubController));

  // Get current user's club (for club managers)
  fastify.get('/my-club', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get current user\'s club (for club managers)'
    }
  }, clubController.getMyClub.bind(clubController));

  // Get user's clubs (current user)
  fastify.get('/user', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get current user\'s clubs'
    }
  }, clubController.getUserClubs.bind(clubController));

  // Get user's clubs by ID
  fastify.get('/user/:userId', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get user\'s clubs by ID'
    }
  }, clubController.getUserClubs.bind(clubController));

  // Club members - list by club
  fastify.get('/:clubId/members', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get members for a club',
      params: {
        type: 'object',
        properties: { clubId: { type: 'integer' } },
        required: ['clubId']
      }
    }
  }, clubController.getMembersByClub.bind(clubController));

  // Club members - list for current manager's club
  fastify.get('/my-club/members', {
    schema: {
      tags: ['Clubs'],
      summary: "Get current user's club members (for club managers)"
    }
  }, clubController.getMyClubMembers.bind(clubController));

  // Club members - create in specific club
  fastify.post('/:clubId/members', {
    schema: {
      tags: ['Clubs'],
      summary: 'Create member in a club (manager only)',
      params: {
        type: 'object',
        properties: { clubId: { type: 'integer' } },
        required: ['clubId']
      },
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', enum: ['member', 'parent'] },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          phone: { type: 'string' },
          dateOfBirth: { type: ['string', 'null'], format: 'date' },
          position: { type: 'string' },
          parentPhone: { type: 'string' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          emergencyContact: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phone: { type: 'string' },
              relation: { type: 'string' }
            }
          },
          medicalInfo: { type: 'string' },
          profileImage: { type: 'string' },
          generatePassword: { type: 'boolean' },
          sendWelcomeEmail: { type: 'boolean' },
          children: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                firstName: { type: 'string', minLength: 1 },
                lastName: { type: 'string', minLength: 1 },
                dateOfBirth: { type: 'string', format: 'date' },
                position: { type: 'string' },
                medicalInfo: { type: 'string' }
              },
              required: ['firstName', 'lastName', 'dateOfBirth']
            }
          }
        },
        required: ['email', 'role', 'firstName', 'lastName']
      }
    }
  }, clubController.createClubMember.bind(clubController));

  // Club members - create in current manager's club
  fastify.post('/my-club/members', {
    schema: {
      tags: ['Clubs'],
      summary: "Create member in current user's club (manager only)",
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', enum: ['member', 'parent'] },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          phone: { type: 'string' },
          dateOfBirth: { type: ['string', 'null'], format: 'date' },
          position: { type: 'string' },
          parentPhone: { type: 'string' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          emergencyContact: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phone: { type: 'string' },
              relation: { type: 'string' }
            }
          },
          medicalInfo: { type: 'string' },
          profileImage: { type: 'string' },
          generatePassword: { type: 'boolean' },
          sendWelcomeEmail: { type: 'boolean' },
          children: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                firstName: { type: 'string', minLength: 1 },
                lastName: { type: 'string', minLength: 1 },
                dateOfBirth: { type: 'string', format: 'date' },
                position: { type: 'string' },
                medicalInfo: { type: 'string' }
              },
              required: ['firstName', 'lastName', 'dateOfBirth']
            }
          }
        },
        required: ['email', 'role', 'firstName', 'lastName']
      }
    }
  }, clubController.createMyClubMember.bind(clubController));

  // Club member statistics
  fastify.get('/:clubId/members/stats', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get member statistics for a club',
      params: {
        type: 'object',
        properties: { clubId: { type: 'integer' } },
        required: ['clubId']
      }
    }
  }, clubController.getClubStats.bind(clubController));

  // Club member statistics for current manager's club
  fastify.get('/my-club/members/stats', {
    schema: {
      tags: ['Clubs'],
      summary: "Get member statistics for current user's club"
    }
  }, clubController.getMyClubStats.bind(clubController));

  // Search clubs
  fastify.get('/search', {
    schema: {
      tags: ['Clubs'],
      summary: 'Search clubs',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          category: { type: 'string' },
          location: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, clubController.searchClubs.bind(clubController));

  // Browse clubs by category
  fastify.get('/browse', {
    schema: {
      tags: ['Clubs'],
      summary: 'Browse clubs by category',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, clubController.browseClubs.bind(clubController));

  // Create invite code for club
  fastify.post('/:clubId/invite-codes', {
    schema: {
      tags: ['Clubs'],
      summary: 'Create invite code for club',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        properties: {
          expires_at: { type: 'string', format: 'date-time' },
          max_uses: { type: 'integer', minimum: 1 },
          role: { type: 'string', enum: ['member', 'parent'] }
        }
      }
    }
  }, clubController.createInviteCode.bind(clubController));

  // Get club invite codes
  fastify.get('/:clubId/invite-codes', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get club invite codes',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        }
      }
    }
  }, clubController.getClubInviteCodes.bind(clubController));

  // Deactivate invite code
  fastify.delete('/invite-codes/:codeId', {
    schema: {
      tags: ['Clubs'],
      summary: 'Deactivate invite code',
      params: {
        type: 'object',
        properties: {
          codeId: { type: 'integer' }
        }
      }
    }
  }, clubController.deactivateInviteCode.bind(clubController));

  // Get a specific member by ID for current manager's club
  fastify.get('/my-club/members/:memberId', {
    schema: {
      tags: ['Clubs'],
      summary: "Get a specific member by ID from current user's club",
      params: {
        type: 'object',
        properties: {
          memberId: { type: 'integer' }
        },
        required: ['memberId']
      }
    }
  }, clubController.getMyClubMemberById.bind(clubController));

  // Update a specific member for current manager's club
  fastify.put('/my-club/members/:memberId', {
    schema: {
      tags: ['Clubs'],
      summary: "Update a specific member in current user's club",
      params: {
        type: 'object',
        properties: {
          memberId: { type: 'integer' }
        },
        required: ['memberId']
      },
      body: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          position: { type: 'string' },
          children: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                dateOfBirth: { type: 'string', format: 'date' },
                position: { type: 'string' },
                medicalInfo: { type: 'string' }
              },
              required: ['firstName', 'lastName', 'dateOfBirth']
            }
          }
        }
      }
    }
  }, clubController.updateMyClubMember.bind(clubController));

  // Personnel Management Routes

  // Get club personnel
  fastify.get('/:clubId/personnel', {
    schema: {
      tags: ['Clubs'],
      summary: 'Get club personnel (users with club_coach role)',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        },
        required: ['clubId']
      }
    }
  }, clubController.getClubPersonnel.bind(clubController));

  // Add personnel to club
  fastify.post('/:clubId/personnel', {
    schema: {
      tags: ['Clubs'],
      summary: 'Add personnel to club',
      params: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        },
        required: ['clubId']
      },
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          phone: { type: ['string', 'null'] },
          avatar: { type: ['string', 'null'] },
          password: { type: ['string', 'null'] }
        },
        required: ['email', 'firstName', 'lastName']
      }
    }
  }, clubController.addPersonnelToClub.bind(clubController));

  // Update personnel record
  fastify.put('/personnel/:userRoleId', {
    schema: {
      tags: ['Clubs'],
      summary: 'Update personnel record',
      params: {
        type: 'object',
        properties: {
          userRoleId: { type: 'integer' }
        },
        required: ['userRoleId']
      },
      body: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: ['string', 'null'] },
          avatar: { type: ['string', 'null'] },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, clubController.updatePersonnel.bind(clubController));

  // Remove personnel from club
  fastify.delete('/personnel/:userRoleId', {
    schema: {
      tags: ['Clubs'],
      summary: 'Remove personnel from club',
      params: {
        type: 'object',
        properties: {
          userRoleId: { type: 'integer' }
        },
        required: ['userRoleId']
      }
    }
  }, clubController.removePersonnelFromClub.bind(clubController));
};
