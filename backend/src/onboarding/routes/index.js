import {
  OnboardingController,
  ProfileController,
  AccountController
} from '../controllers/index.js';

import { createAuthMiddleware } from '../../auth/middleware.js';
import { onboardingRoutes } from './onboardingRoutes.js';
import { profileRoutes } from './profileRoutes.js';
import { accountRoutes } from './accountRoutes.js';
import { roleRoutes } from './roleRoutes.js';

export async function registerOnboardingRoutes(fastify, _options) {
  // Create authentication middleware
  const authenticate = createAuthMiddleware(fastify.db);

  // Initialize controllers
  const onboardingController = new OnboardingController(fastify.db);
  const profileController = new ProfileController(fastify.db);
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

  // Club routes are now registered under /club (see src/club/routes)

  await fastify.register(accountRoutes, {
    prefix: '/accounts',
    accountController,
    authenticate
  });

  await fastify.register(roleRoutes, {
    prefix: '/roles',
    authenticate
  });
};
