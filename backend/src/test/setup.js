import Fastify from 'fastify';
import dbConnector from '../db/connector.js';
import { authRoutes } from '../auth/index.js';
import { registerOnboardingRoutes } from '../onboarding/routes/index.js';
import knex from 'knex';
import knexConfig from '../../knexfile.js';

// Set up test environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

export async function createTestApp() {
  const fastify = Fastify({ logger: false });
  
  // Use test database
  await fastify.register(dbConnector, {
    client: 'pg',
    connection: process.env.TEST_PG_CONNECTION_STRING || 'postgres://user:password@localhost:5432/test_app',
    searchPath: ['knex', 'public'],
  });

  await fastify.register(authRoutes);
  
  // Register onboarding routes for testing
  await fastify.register(registerOnboardingRoutes);
  
  await fastify.ready();

  return fastify;
}

export async function cleanDatabase(fastify) {
  try {
    // Use a transaction to ensure atomic cleanup
    await fastify.db.transaction(async (trx) => {
      // Disable foreign key checks temporarily for cleanup
      if (fastify.db.client.config.client === 'pg') {
        await trx.raw('SET session_replication_role = replica;');
      }
      
      // Clean up test data in proper order (child tables first due to foreign key constraints)
      
      // Onboarding-related tables (child tables first)
      await trx('user_children').del();
      await trx('user_accounts').del();
      await trx('user_roles').del();
      await trx('club_invite_codes').del();
      await trx('user_preferences').del();
      await trx('user_profiles').del();
      await trx('clubs').del();
      await trx('account_sequences').del();
      
      // Auth-related tables
      await trx('tokens').del();
      await trx('users').del();
      
      // Re-enable foreign key checks
      if (fastify.db.client.config.client === 'pg') {
        await trx.raw('SET session_replication_role = DEFAULT;');
      }
    });
    
    // Reset sequences for clean IDs (PostgreSQL specific)
    if (fastify.db.client.config.client === 'pg') {
      try {
        await fastify.db.raw('ALTER SEQUENCE users_id_seq RESTART WITH 1');
        await fastify.db.raw('ALTER SEQUENCE tokens_id_seq RESTART WITH 1');
        await fastify.db.raw('ALTER SEQUENCE user_profiles_id_seq RESTART WITH 1');
        await fastify.db.raw('ALTER SEQUENCE clubs_id_seq RESTART WITH 1');
        await fastify.db.raw('ALTER SEQUENCE user_roles_id_seq RESTART WITH 1');
        await fastify.db.raw('ALTER SEQUENCE user_accounts_id_seq RESTART WITH 1');
      } catch {
        // Sequences might not exist yet, ignore
      }
    }
  } catch (error) {
    console.warn('Warning: Could not clean database with simple delete:', error.message);
    // If simple delete fails, the setup-db script will recreate the database
  }
}

// Function to setup fresh database (used only by setup-db.js)
export async function recreateTestDatabase() {
  const testConfig = {
    ...knexConfig.development,
    connection: process.env.TEST_PG_CONNECTION_STRING || 'postgres://user:password@localhost:5432/test_app'
  };
  
  const adminConfig = {
    ...knexConfig.development,
    connection: (process.env.TEST_PG_CONNECTION_STRING || 'postgres://user:password@localhost:5432/test_app').replace(/\/[^/]*$/, '/postgres')
  };
  
  // Extract database name from connection string
  const dbName = testConfig.connection.split('/').pop();
  
  let adminDb;
  try {
    // Connect to admin database
    adminDb = knex(adminConfig);
    
    console.log(`🗄️ Dropping test database: ${dbName}`);
    
    // Terminate all connections to the test database
    await adminDb.raw(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = ? AND pid <> pg_backend_pid()
    `, [dbName]);
    
    // Drop the test database if it exists
    await adminDb.raw(`DROP DATABASE IF EXISTS "${dbName}"`);
    
    // Create fresh test database
    console.log(`🗄️ Creating fresh test database: ${dbName}`);
    await adminDb.raw(`CREATE DATABASE "${dbName}"`);
    
  } finally {
    if (adminDb) {
      await adminDb.destroy();
    }
  }
  
  // Run migrations on the fresh database
  let testDb;
  try {
    console.log(`🚀 Running migrations on: ${dbName}`);
    testDb = knex(testConfig);
    await testDb.migrate.latest();
    console.log(`✅ Migrations completed on: ${dbName}`);
  } finally {
    if (testDb) {
      await testDb.destroy();
    }
  }
}