/**
 * Migration: Remove 'published' status from training_sessions and matches
 * Date: 2026-01-14
 *
 * This migration:
 * 1. Updates all 'published' status to 'scheduled' in both tables
 * 2. Recreates the status enum without 'published'
 */

export async function up(knex) {
  // Update existing 'published' statuses to 'scheduled'
  await knex('training_sessions')
    .where('status', 'published')
    .update({ status: 'scheduled' });

  await knex('matches')
    .where('status', 'published')
    .update({ status: 'scheduled' });

  // For SQLite: We need to recreate the tables without the 'published' enum value
  // SQLite doesn't support ALTER COLUMN, so we need to recreate the tables

  // Check if we're using SQLite
  const isSQLite = knex.client.config.client === 'sqlite3';

  if (isSQLite) {
    // Recreate training_sessions table
    await knex.schema.renameTable('training_sessions', 'training_sessions_old');

    await knex.schema.createTable('training_sessions', table => {
      table.increments('id').primary();
      table.integer('season_id').unsigned().nullable()
        .references('id').inTable('seasons').onDelete('SET NULL');
      table.integer('club_id').unsigned().notNullable()
        .references('id').inTable('clubs').onDelete('CASCADE');
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.enum('session_type', ['training', 'practice', 'conditioning', 'tactical', 'friendly', 'other'])
        .defaultTo('practice');
      table.date('date').notNullable();
      table.time('start_time').notNullable();
      table.time('end_time').notNullable();
      table.string('location', 255).nullable();
      table.integer('coach_id').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL');
      table.integer('max_participants').unsigned().nullable();
      table.enum('status', ['draft', 'scheduled', 'completed', 'cancelled'])
        .defaultTo('draft');
      table.integer('created_by').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
      table.boolean('is_recurring').defaultTo(false);
      table.enum('recurrence_pattern', ['daily', 'weekly', 'biweekly', 'monthly']).nullable();
      table.specificType('recurrence_days', 'TEXT').nullable();
      table.date('recurrence_end_date').nullable();
      table.integer('parent_session_id').unsigned().nullable()
        .references('id').inTable('training_sessions').onDelete('CASCADE');

      table.index(['club_id', 'date']);
      table.index('coach_id');
      table.index('status');
    });

    // Copy data
    await knex.raw(`
      INSERT INTO training_sessions
      SELECT * FROM training_sessions_old
    `);

    await knex.schema.dropTable('training_sessions_old');

    // Recreate matches table
    await knex.schema.renameTable('matches', 'matches_old');

    await knex.schema.createTable('matches', table => {
      table.increments('id').primary();
      table.integer('season_id').unsigned().nullable()
        .references('id').inTable('seasons').onDelete('SET NULL');
      table.integer('club_id').unsigned().notNullable()
        .references('id').inTable('clubs').onDelete('CASCADE');
      table.enum('match_type', ['friendly', 'league', 'cup', 'tournament', 'scrimmage'])
        .defaultTo('friendly');
      table.integer('home_team_id').unsigned().nullable()
        .references('id').inTable('teams').onDelete('CASCADE');
      table.integer('away_team_id').unsigned().nullable()
        .references('id').inTable('teams').onDelete('CASCADE');
      table.string('opponent_name', 255).nullable();
      table.boolean('is_home').defaultTo(true);
      table.string('venue', 255).nullable();
      table.date('date').notNullable();
      table.time('start_time').notNullable();
      table.time('end_time').nullable();
      table.string('competition_name', 255).nullable();
      table.integer('home_score').unsigned().nullable();
      table.integer('away_score').unsigned().nullable();
      table.enum('status', ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'])
        .defaultTo('draft');
      table.integer('created_by').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);

      table.index(['club_id', 'date']);
      table.index('home_team_id');
      table.index('away_team_id');
      table.index('status');
    });

    // Copy data
    await knex.raw(`
      INSERT INTO matches
      SELECT * FROM matches_old
    `);

    await knex.schema.dropTable('matches_old');
  } else {
    // For PostgreSQL/MySQL: Use ALTER TYPE or ALTER COLUMN
    // This is a simplified approach - adjust based on your database
    console.log('Non-SQLite database detected. Manual enum update may be required.');
  }
}

export async function down(knex) {
  // Rollback: Add 'published' back to the enum
  // Note: This is a destructive operation and should be carefully considered

  const isSQLite = knex.client.config.client === 'sqlite3';

  if (isSQLite) {
    // Recreate with 'published' status
    await knex.schema.renameTable('training_sessions', 'training_sessions_old');

    await knex.schema.createTable('training_sessions', table => {
      table.increments('id').primary();
      table.integer('season_id').unsigned().nullable()
        .references('id').inTable('seasons').onDelete('SET NULL');
      table.integer('club_id').unsigned().notNullable()
        .references('id').inTable('clubs').onDelete('CASCADE');
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.enum('session_type', ['training', 'practice', 'conditioning', 'tactical', 'friendly', 'other'])
        .defaultTo('practice');
      table.date('date').notNullable();
      table.time('start_time').notNullable();
      table.time('end_time').notNullable();
      table.string('location', 255).nullable();
      table.integer('coach_id').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL');
      table.integer('max_participants').unsigned().nullable();
      table.enum('status', ['draft', 'published', 'scheduled', 'completed', 'cancelled'])
        .defaultTo('draft');
      table.integer('created_by').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
      table.boolean('is_recurring').defaultTo(false);
      table.enum('recurrence_pattern', ['daily', 'weekly', 'biweekly', 'monthly']).nullable();
      table.specificType('recurrence_days', 'TEXT').nullable();
      table.date('recurrence_end_date').nullable();
      table.integer('parent_session_id').unsigned().nullable()
        .references('id').inTable('training_sessions').onDelete('CASCADE');

      table.index(['club_id', 'date']);
      table.index('coach_id');
      table.index('status');
    });

    await knex.raw(`INSERT INTO training_sessions SELECT * FROM training_sessions_old`);
    await knex.schema.dropTable('training_sessions_old');

    // Recreate matches table
    await knex.schema.renameTable('matches', 'matches_old');

    await knex.schema.createTable('matches', table => {
      table.increments('id').primary();
      table.integer('season_id').unsigned().nullable()
        .references('id').inTable('seasons').onDelete('SET NULL');
      table.integer('club_id').unsigned().notNullable()
        .references('id').inTable('clubs').onDelete('CASCADE');
      table.enum('match_type', ['friendly', 'league', 'cup', 'tournament', 'scrimmage'])
        .defaultTo('friendly');
      table.integer('home_team_id').unsigned().nullable()
        .references('id').inTable('teams').onDelete('CASCADE');
      table.integer('away_team_id').unsigned().nullable()
        .references('id').inTable('teams').onDelete('CASCADE');
      table.string('opponent_name', 255).nullable();
      table.boolean('is_home').defaultTo(true);
      table.string('venue', 255).nullable();
      table.date('date').notNullable();
      table.time('start_time').notNullable();
      table.time('end_time').nullable();
      table.string('competition_name', 255).nullable();
      table.integer('home_score').unsigned().nullable();
      table.integer('away_score').unsigned().nullable();
      table.enum('status', ['draft', 'published', 'scheduled', 'in_progress', 'completed', 'cancelled'])
        .defaultTo('draft');
      table.integer('created_by').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);

      table.index(['club_id', 'date']);
      table.index('home_team_id');
      table.index('away_team_id');
      table.index('status');
    });

    await knex.raw(`INSERT INTO matches SELECT * FROM matches_old`);
    await knex.schema.dropTable('matches_old');
  }
}
