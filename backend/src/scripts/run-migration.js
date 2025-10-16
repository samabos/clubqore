import knex from 'knex';
import config from '../../knexfile.js';

async function runMigration() {
  const db = knex(config.development);
  
  try {
    console.log('🔄 Running migrations...');
    await db.migrate.latest();
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await db.destroy();
  }
}

runMigration();
