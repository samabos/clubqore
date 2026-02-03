import { AdminBillingController } from '../controllers/AdminBillingController.js';
import { adminBillingRoutes } from './adminBillingRoutes.js';
import { registerSystemConfigRoutes } from './systemConfigRoutes.js';
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

  // Register system configuration routes
  fastify.register(registerSystemConfigRoutes);

  fastify.log.info('Admin routes registered');
}
