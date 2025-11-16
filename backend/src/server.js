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
import { authRoutes } from './auth/index.js';
import { registerOnboardingRoutes } from './onboarding/routes/index.js';
import { registerClubRoutes } from './club/routes/index.js';
import dbConnector from './db/connector.js';
import { config, validateConfig } from './config/index.js';

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
    logger: {
      level: config.logLevel
    }
  });

  // Register plugins
  await fastify.register(import('@fastify/swagger'), swaggerConfig);
  await fastify.register(import('@fastify/swagger-ui'), swaggerUIConfig);
  
  await fastify.register(cors, { 
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  });

  // Register database
  console.log('🔌 Registering database connector...');
  await fastify.register(dbConnector, {
    client: 'pg',
    connection: config.pgConnectionString,
    searchPath: ['knex', 'public'],
  });

  // Register routes
  console.log('🔐 Registering auth routes...');
  await fastify.register(authRoutes);

  console.log('🏢 Registering club routes...');
  await fastify.register(registerClubRoutes);

  console.log('🎯 Registering onboarding routes...');
  await fastify.register(registerOnboardingRoutes);

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
    console.log('🚀 Starting Fastify server...');
    const fastify = await createServer();
    
    const address = await fastify.listen({ 
      port: Number(PORT), 
      host: HOST 
    });
    
    console.log(`🚀 Server running at ${address}`);
    console.log(`📖 API Documentation available at ${address}/docs`);
    console.log(`❤️  Health check available at ${address}/health`);
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      try {
        await fastify.close();
        console.log('✅ Server closed successfully');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
}

// Start the application
startServer();
