import { ParentBillingController } from '../controllers/ParentBillingController.js';
import { ParentScheduleController } from '../controllers/ParentScheduleController.js';
import { ParentChildrenController } from '../controllers/ParentChildrenController.js';
import { createAuthMiddleware } from '../../auth/middleware.js';
import { parentBillingRoutes } from './parentBillingRoutes.js';
import { parentScheduleRoutes } from './parentScheduleRoutes.js';
import { parentChildrenRoutes } from './parentChildrenRoutes.js';

export async function registerParentRoutes(fastify, options) {
  // Create authentication middleware
  const authenticate = createAuthMiddleware(fastify.db);

  // Initialize controllers
  const parentBillingController = new ParentBillingController(fastify.db);
  const parentScheduleController = new ParentScheduleController(fastify.db);
  const parentChildrenController = new ParentChildrenController(fastify.db);

  // Register parent billing routes
  await fastify.register(parentBillingRoutes, {
    prefix: '/parent/billing',
    parentBillingController,
    authenticate
  });

  // Register parent schedule routes
  await fastify.register(parentScheduleRoutes, {
    prefix: '/parent',
    parentScheduleController,
    authenticate
  });

  // Register parent children routes
  await fastify.register(parentChildrenRoutes, {
    prefix: '/parent/children',
    parentChildrenController,
    authenticate
  });
}
