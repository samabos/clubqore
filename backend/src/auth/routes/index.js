import { AuthController } from '../controllers/authController.js';
import { UserController } from '../controllers/userController.js';
import { createAuthMiddleware } from '../middleware.js';
import { registerRoutes } from './register.js';
import { loginRoutes } from './login.js';
import { refreshRoutes } from './refresh.js';
import { profileRoutes } from './profile.js';
import { logoutRoutes } from './logout.js';
import { emailVerificationRoutes } from './emailVerification.js';
import { passwordResetRoutes } from './passwordReset.js';
import { emailAvailabilityRoutes } from './emailAvailability.js';
import { roleManagementRoutes } from './roleManagement.js';

export async function authRoutes(fastify, options) {
  const authController = new AuthController(fastify.db);
  const userController = new UserController(fastify.db);
  const authenticate = createAuthMiddleware(fastify.db);

  // Register all route modules
  registerRoutes(fastify, authController);
  loginRoutes(fastify, authController);
  refreshRoutes(fastify, authController);
  profileRoutes(fastify, userController, authenticate);
  logoutRoutes(fastify, authController, authenticate);
  emailVerificationRoutes(fastify, authController, authenticate);
  passwordResetRoutes(fastify, authController);
  roleManagementRoutes(fastify, userController, authenticate);
  emailAvailabilityRoutes(fastify, authController);
}