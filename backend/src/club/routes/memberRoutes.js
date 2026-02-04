/**
 * @deprecated OBSOLETE - This file has been moved to member/routes/
 * This file is kept temporarily for reference and can be safely deleted.
 * New location: backend/src/member/routes/memberRoutes.js
 */
export const memberRoutes = async function (fastify, options) {
    const {  clubController, memberController, authenticate } = options;

    // Apply authentication middleware to all routes
    if (authenticate) {
        fastify.addHook('onRequest', authenticate);
    }
  
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
    }, memberController.getMembersByClub.bind(memberController));

    // Club members - list for current manager's club
    fastify.get('/my-club/members', {
        schema: {
            tags: ['Clubs'],
            summary: "Get current user's club members (for club managers)"
        }
    }, memberController.getMyClubMembers.bind(memberController));

    // GET /api/clubs/my-club/members/:memberId
    fastify.get('/my-club/members/:memberId', {
        schema: {
            tags: ['Clubs'],
            summary: "Get a specific member of the current user's club (for club managers)",
            params: {
                type: 'object',
                properties: { memberId: { type: 'integer' } },
                required: ['memberId']
            }
        }
    }, memberController.getMyClubMemberById.bind(memberController));

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
    }, memberController.createClubMember.bind(memberController));

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
    }, memberController.createMyClubMember.bind(memberController));

    // PUT /api/clubs/my-club/members/:memberId
    fastify.put('/my-club/members/:memberId', {
            tags: ['Clubs'],
            summary: "Create member in current user's club (manager only)",
            params: {
                type: 'object',
                properties: { memberId: { type: 'integer' } },
                required: ['memberId']
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
    }, memberController.updateMyClubMember.bind(memberController));

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
    
  // Update member status (end contract)
  fastify.patch('/my-club/members/:id/status', {
    schema: {
      tags: ['Clubs'],
      summary: 'Update member status (end contract)',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['Active', 'Inactive', 'Pending'] },
          contractEndDate: { type: 'string', format: 'date' }
        },
        required: ['status']
      }
    }
  }, memberController.updateMemberStatus.bind(memberController));
};
