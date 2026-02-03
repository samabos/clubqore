export const onboardingRoutes = async function (fastify, options) {
  const { onboardingController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Complete initial onboarding (first role)
  fastify.post('/complete', {
    schema: {
      tags: ['Onboarding'],
      summary: 'Complete initial onboarding',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['club_manager'] },
          personalData: {
            type: 'object',
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              dateOfBirth: { type: 'string', format: 'date' },
              phone: { type: 'string' },
              address: { type: 'string' },
              emergencyContact: { type: 'object' },
              workplace: { type: 'string' },
              workPhone: { type: 'string' },
              medicalInfo: { type: 'string' }
            }
          },
          clubData: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              location: { type: 'string' },
              contactEmail: { type: 'string', format: 'email' },
              contactPhone: { type: 'string' },
              website: { type: 'string' },
              socialMedia: { type: 'object' }
            }
          },
          preferences: {
            type: 'object',
            properties: {
              notifications: { type: 'object' },
              privacy: { type: 'object' },
              theme: { type: 'string' }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            accountNumber: { type: 'string' },
            user: { 
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                avatar: { type: ['string', 'null'] },
                primaryRole: { type: 'string' },
                isOnboarded: { type: 'boolean' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    }
  }, onboardingController.completeInitialOnboarding.bind(onboardingController));

  // Add additional role to existing user
  fastify.post('/roles', {
    schema: {
      tags: ['Onboarding'],
      summary: 'Add additional role to existing user',
      security: [{ bearerAuth: [] }]
    }
  }, onboardingController.addUserRole.bind(onboardingController));

  // Get comprehensive user status
  fastify.get('/status', {
    schema: {
      tags: ['Onboarding'],
      summary: 'Get comprehensive user status',
      security: [{ bearerAuth: [] }]
    }
  }, onboardingController.getUserStatus.bind(onboardingController));

  // Get detailed onboarding progress
  fastify.get('/progress', {
    schema: {
      tags: ['Onboarding'],
      summary: 'Get detailed onboarding progress',
      security: [{ bearerAuth: [] }]
    }
  }, onboardingController.getOnboardingStatus.bind(onboardingController));

  // Set primary role
  fastify.put('/primary-role', {
    schema: {
      tags: ['Onboarding'],
      summary: 'Set primary role',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['club_manager', 'member', 'parent'] }
        }
      }
    }
  }, onboardingController.setPrimaryRole.bind(onboardingController));

  // Deactivate role
  fastify.delete('/roles/:role', {
    schema: {
      tags: ['Onboarding'],
      summary: 'Deactivate role',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['club_manager', 'member', 'parent'] }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          clubId: { type: 'integer' }
        }
      }
    }
  }, onboardingController.deactivateRole.bind(onboardingController));

  // Get profile completion status
  fastify.get('/completion/:userId', {
    schema: {
      tags: ['Onboarding'],
      summary: 'Get profile completion status',
      security: [{ bearerAuth: [] }]
    }
  }, onboardingController.getProfileCompletion.bind(onboardingController));

  fastify.get('/completion', {
    schema: {
      tags: ['Onboarding'],
      summary: 'Get current user profile completion status',
      security: [{ bearerAuth: [] }]
    }
  }, onboardingController.getProfileCompletion.bind(onboardingController));

  // Update completion progress tracking
  fastify.post('/completion/update', {
    schema: {
      tags: ['Onboarding'],
      summary: 'Update completion progress tracking',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['step'],
        properties: {
          step: { type: 'string' },
          role: { type: 'string' }
        }
      }
    }
  }, onboardingController.updateCompletionProgress.bind(onboardingController));
};
