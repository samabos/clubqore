import { ClubController } from '../controllers/index.js';
import { MemberController } from '../../member/controllers/index.js';
import { PersonnelController } from '../../personnel/controllers/index.js';
import { TeamController } from '../../team/controllers/index.js';
import { SeasonController, TrainingSessionController, MatchController } from '../../schedule/controllers/index.js';
import { BillingController } from '../../billing/controllers/index.js';
import { createAuthMiddleware } from '../../auth/middleware.js';
import { clubRoutes } from './clubRoutes.js';
import { memberRoutes } from '../../member/routes/index.js';
import { personnelRoutes } from '../../personnel/routes/index.js';
import { teamRoutes } from '../../team/routes/index.js';
import { seasonRoutes, trainingSessionRoutes, matchRoutes } from '../../schedule/routes/index.js';
import { billingRoutes } from '../../billing/routes/index.js';

export async function registerClubRoutes(fastify, _options) {
  // Create authentication middleware
  const authenticate = createAuthMiddleware(fastify.db);

  // Initialize controllers
  const clubController = new ClubController(fastify.db);
  const memberController = new MemberController(fastify.db);
  const personnelController = new PersonnelController(fastify.db);
  const teamController = new TeamController(fastify.db);
  const seasonController = new SeasonController(fastify.db);
  const trainingSessionController = new TrainingSessionController(fastify.db);
  const matchController = new MatchController(fastify.db);
  const billingController = new BillingController(fastify.db);

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

  // Register season routes
  await fastify.register(seasonRoutes, {
    prefix: '/seasons',
    seasonController,
    authenticate
  });

  // Register training session routes
  await fastify.register(trainingSessionRoutes, {
    prefix: '/training-sessions',
    trainingSessionController,
    authenticate
  });

  // Register match routes
  await fastify.register(matchRoutes, {
    prefix: '/matches',
    matchController,
    authenticate
  });

  // Register billing routes
  await fastify.register(billingRoutes, {
    prefix: '',
    billingController,
    authenticate
  });
};
