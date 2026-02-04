import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables
function loadEnvironment() {
  if (existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
  } else {
    dotenv.config();
  }
  
  console.log('🔧 Environment loaded');
  console.log('📊 JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');
  console.log('🗄️ PG_CONNECTION_STRING:', process.env.PG_CONNECTION_STRING ? 'Set' : 'Missing');
}

loadEnvironment();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './auth/index.js';
import { registerOnboardingRoutes } from './onboarding/routes/index.js';
import { registerClubRoutes } from './club/routes/index.js';
import { registerParentRoutes } from './parent/routes/index.js';
import { registerAdminRoutes } from './admin/index.js';
import { postcodeRoutes } from './shared/routes/postcodeRoutes.js';
import { registerContactRoutes } from './contact/contactRoutes.js';
import { startInvoiceScheduler } from './workers/invoice-scheduler.js';
import { registerPaymentRoutes } from './payment/routes/index.js';
import { startSubscriptionBillingWorker } from './workers/subscription-billing-worker.js';
import { startPaymentRetryWorker } from './workers/payment-retry-worker.js';
import { startSubscriptionNotificationWorker } from './workers/subscription-notification-worker.js';
import { createAuthMiddleware } from './auth/middleware.js';
import dbConnector from './db/connector.js';
import { config, validateConfig } from './config/index.js';
import logger from './config/logger.js';

// Environment check
const isProduction = process.env.NODE_ENV === 'production';

console.log('📦 Modules imported successfully');

// Configuration
const PORT = config.port;
const HOST = config.host;

// Validate required environment variables first
function validateEnvironment() {
  if (!config.pgConnectionString) {
    console.error('❌ PG_CONNECTION_STRING environment variable is required');
    console.error('Current value:', config.pgConnectionString);
    process.exit(1);
  }
  
  if (!config.jwtSecret) {
    console.error('❌ JWT_SECRET environment variable is required');
    console.error('Current value:', config.jwtSecret ? 'Set' : 'Missing');
    process.exit(1);
  }
}

// Validate environment first, then config
validateEnvironment();
validateConfig();

// Swagger configuration
const swaggerConfig = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'ClubQore API',
      description: 'Club Management API',
      version: '1.0.0'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
};

const swaggerUIConfig = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  staticCSP: true,
  transformSpecificationClone: true
};

// Create and configure Fastify instance
async function createServer() {
  const fastify = Fastify({
    logger: true,
    disableRequestLogging: false,
    requestIdLogLabel: 'reqId',
    genReqId: (req) => req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  });

  // Replace Fastify's logger with our custom Pino logger
  fastify.log = logger;

  // Register plugins

  // Only register Swagger docs in development
  if (!isProduction) {
    await fastify.register(import('@fastify/swagger'), swaggerConfig);
    await fastify.register(import('@fastify/swagger-ui'), swaggerUIConfig);
    fastify.log.info('📖 Swagger docs enabled (development mode)');
  }

  // Cookie support for httpOnly auth cookies
  await fastify.register(cookie, {
    secret: config.jwtSecret, // Used for signing cookies
    parseOptions: {}
  });

  // Rate limiting - global config with selective overrides per route
  await fastify.register(rateLimit, {
    global: true,
    max: 100, // Default: 100 requests per minute
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      retryAfter: Math.ceil(context.ttl / 1000)
    })
  });

  // CORS configuration - secure in production
  const corsOrigins = isProduction
    ? [process.env.FRONTEND_URL].filter(Boolean) // Only allow configured frontend URL in production
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/
      ];

  await fastify.register(cors, {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  });

  // Register database
  fastify.log.info('🔌 Registering database connector...');
  await fastify.register(dbConnector, {
    client: 'pg',
    connection: config.pgConnectionString,
    searchPath: ['knex', 'public'],
  });

  // Register routes
  fastify.log.info('🔐 Registering auth routes...');
  await fastify.register(authRoutes);

  fastify.log.info('🏢 Registering club routes...');
  await fastify.register(registerClubRoutes);

  fastify.log.info('👨‍👩‍👧 Registering parent routes...');
  await fastify.register(registerParentRoutes);

  fastify.log.info('🎯 Registering onboarding routes...');
  await fastify.register(registerOnboardingRoutes);

  fastify.log.info('🔧 Registering admin routes...');
  await fastify.register(registerAdminRoutes);

  fastify.log.info('📮 Registering postcode routes...');
  await fastify.register(postcodeRoutes);

  fastify.log.info('📧 Registering contact routes...');
  await fastify.register(registerContactRoutes);

  fastify.log.info('💳 Registering payment routes...');
  const authMiddleware = createAuthMiddleware(fastify.db);
  await fastify.register(registerPaymentRoutes, { authenticate: authMiddleware });

  // Health check endpoint
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            version: { type: 'string' }
          }
        }
      }
    }
  }, async () => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  return fastify;
}

// Start server
async function startServer() {
  try {
    logger.info('🚀 Starting Fastify server...');
    const fastify = await createServer();

    const address = await fastify.listen({
      port: Number(PORT),
      host: HOST
    });

    logger.info({ port: PORT, host: HOST }, `🚀 Server running at ${address}`);
    if (!isProduction) {
      logger.info(`📖 API Documentation available at ${address}/docs`);
    }
    logger.info(`❤️  Health check available at ${address}/health`);

    // Start invoice scheduler
    const invoiceScheduler = startInvoiceScheduler(fastify.db);
    logger.info('✅ Invoice scheduler initialized');

    // Start subscription workers
    const subscriptionBillingWorker = startSubscriptionBillingWorker(fastify.db);
    logger.info('✅ Subscription billing worker initialized');

    const paymentRetryWorker = startPaymentRetryWorker(fastify.db);
    logger.info('✅ Payment retry worker initialized');

    const subscriptionNotificationWorker = startSubscriptionNotificationWorker(fastify.db);
    logger.info('✅ Subscription notification worker initialized');

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`🛑 Received ${signal}, shutting down gracefully...`);
      try {
        // Stop the schedulers and workers
        if (invoiceScheduler) {
          invoiceScheduler.stop();
        }
        if (subscriptionBillingWorker) {
          subscriptionBillingWorker.stop();
        }
        if (paymentRetryWorker) {
          paymentRetryWorker.stop();
        }
        if (subscriptionNotificationWorker) {
          subscriptionNotificationWorker.stop();
        }
        await fastify.close();
        logger.info('✅ Server closed successfully');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, '❌ Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (err) {
    logger.error({ err }, '❌ Error starting server');
    process.exit(1);
  }
}

// Start the application
startServer();
