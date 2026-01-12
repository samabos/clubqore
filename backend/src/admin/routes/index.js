import { AdminBillingController } from '../controllers/AdminBillingController.js';
import { adminBillingRoutes } from './adminBillingRoutes.js';
import { createAuthMiddleware } from '../../auth/middleware.js';

export async function registerAdminRoutes(fastify, options) {
  const db = fastify.db;
  const authenticate = createAuthMiddleware(db);

  // Initialize controllers
  const adminBillingController = new AdminBillingController(db);

  // Register admin billing routes
  fastify.register(adminBillingRoutes, {
    adminBillingController,
    authenticate
  });

  fastify.log.info('Admin routes registered');
}
