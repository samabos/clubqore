import { recreateTestDatabase } from './setup.js';

async function setupTestDatabase() {
  try {
    console.log('🧪 Setting up test database...');
    await recreateTestDatabase();
    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    process.exit(1);
  }
}

setupTestDatabase();