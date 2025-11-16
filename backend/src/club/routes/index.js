import { ClubController, MemberController, PersonnelController, TeamController } from '../controllers/index.js';
import { createAuthMiddleware } from '../../auth/middleware.js';
import { clubRoutes } from './clubRoutes.js';
import { memberRoutes } from './memberRoute.js';
import { personnelRoutes } from './personnelRoutes.js';
import { teamRoutes } from './teamRoutes.js';

export async function registerClubRoutes(fastify, options) {
  // Create authentication middleware
  const authenticate = createAuthMiddleware(fastify.db);

  // Initialize controllers
  const clubController = new ClubController(fastify.db);
  const memberController = new MemberController(fastify.db);
  const personnelController = new PersonnelController(fastify.db);
  const teamController = new TeamController(fastify.db);

  // Register club routes
  await fastify.register(clubRoutes, {
    prefix: '/clubs',
    clubController,
    authenticate
  });

  // Register member routes
  await fastify.register(memberRoutes, {
    prefix: '/clubs',
    clubController,
    memberController,
    authenticate
  });

  // Register personnel routes
  await fastify.register(personnelRoutes, {
    prefix: '/clubs',
    personnelController,
    authenticate
  });

  // Register team routes
  await fastify.register(teamRoutes, {
    prefix: '/teams',
    teamController,
    authenticate
  });
};
