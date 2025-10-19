import { 
  OnboardingController, 
  ProfileController, 
  ClubController, 
  InviteController, 
  AccountController 
} from '../controllers/index.js';

import { createAuthMiddleware } from '../../auth/middleware.js';
import { onboardingRoutes } from './onboardingRoutes.js';
import { profileRoutes } from './profileRoutes.js';
import { clubRoutes } from './clubRoutes.js';
import { inviteRoutes } from './inviteRoutes.js';
import { accountRoutes } from './accountRoutes.js';
import { roleRoute } from './roleRoutes.js';
import { registerTeamManagerRoutes } from './teamManagerRoutes.js';

export async function registerOnboardingRoutes(fastify, options) {
  // Create authentication middleware
  const authenticate = createAuthMiddleware(fastify.db);

  // Initialize controllers
  const onboardingController = new OnboardingController(fastify.db);
  const profileController = new ProfileController(fastify.db);
  const clubController = new ClubController(fastify.db);
  const inviteController = new InviteController(fastify.db);
  const accountController = new AccountController(fastify.db);

  // Register route modules
  await fastify.register(onboardingRoutes, { 
    prefix: '/onboarding',
    onboardingController,
    authenticate
  });

  await fastify.register(profileRoutes, { 
    prefix: '/profile',
    profileController,
    authenticate
  });

  await fastify.register(clubRoutes, { 
    prefix: '/clubs',
    clubController,
    authenticate
  });

  await fastify.register(inviteRoutes, { 
    prefix: '/invites',
    inviteController,
    authenticate
  });

  await fastify.register(accountRoutes, { 
    prefix: '/accounts',
    accountController,
    authenticate
  });

  await fastify.register(roleRoute, { 
    prefix: '/roles',
    authenticate
  });

  await fastify.register(registerTeamManagerRoutes, {
    prefix: '',
    authenticate
  });
};
