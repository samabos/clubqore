/**
 * Migration: Create seasons, training_sessions, matches, and related tables
 *
 * This migration creates the foundation for managing club seasons, training sessions,
 * and matches with full support for draft/publish workflows, team assignments,
 * and match result tracking.
 */

export async function up(knex) {
  // 1. Create seasons table
  await knex.schema.createTable('seasons', (table) => {
    table.increments('id').primary();
    table.integer('club_id').unsigned().notNullable()
      .references('id').inTable('clubs').onDelete('CASCADE');
    table.string('name', 100).notNullable(); // e.g., "2024-2025 Season", "Spring 2024"
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.index(['club_id', 'is_active']);
    table.index('start_date');
  });

  // 2. Create training_sessions table
  await knex.schema.createTable('training_sessions', (table) => {
    table.increments('id').primary();
    table.integer('season_id').unsigned().nullable()
      .references('id').inTable('seasons').onDelete('SET NULL');
    table.integer('club_id').unsigned().notNullable()
      .references('id').inTable('clubs').onDelete('CASCADE');
    table.string('title', 200).notNullable();
    table.text('description').nullable();
    table.enum('session_type', ['training', 'practice', 'conditioning', 'tactical', 'friendly', 'other'])
      .defaultTo('training');
    table.date('date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.string('location', 200).nullable(); // Venue/field name
    table.integer('coach_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.integer('max_participants').unsigned().nullable();
    table.enum('status', ['draft', 'published', 'scheduled', 'completed', 'cancelled'])
      .defaultTo('draft');
    table.integer('created_by').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    table.index(['club_id', 'status']);
    table.index(['season_id']);
    table.index(['date', 'start_time']);
    table.index('created_by');
  });

  // 3. Create training_session_teams junction table (many-to-many)
  await knex.schema.createTable('training_session_teams', (table) => {
    table.increments('id').primary();
    table.integer('training_session_id').unsigned().notNullable()
      .references('id').inTable('training_sessions').onDelete('CASCADE');
    table.integer('team_id').unsigned().notNullable()
      .references('id').inTable('teams').onDelete('CASCADE');
    table.timestamp('assigned_at').defaultTo(knex.fn.now());

    table.unique(['training_session_id', 'team_id']);
    table.index('training_session_id');
    table.index('team_id');
  });

  // 4. Create matches table
  await knex.schema.createTable('matches', (table) => {
    table.increments('id').primary();
    table.integer('season_id').unsigned().nullable()
      .references('id').inTable('seasons').onDelete('SET NULL');
    table.integer('club_id').unsigned().notNullable()
      .references('id').inTable('clubs').onDelete('CASCADE');
    table.enum('match_type', ['friendly', 'league', 'cup', 'tournament', 'scrimmage'])
      .defaultTo('friendly');

    // Home team (always internal)
    table.integer('home_team_id').unsigned().notNullable()
      .references('id').inTable('teams').onDelete('CASCADE');

    // Away team (internal for scrimmages, null for external opponents)
    table.integer('away_team_id').unsigned().nullable()
      .references('id').inTable('teams').onDelete('CASCADE');

    // External opponent details (null for scrimmages)
    table.string('opponent_name', 200).nullable(); // External team name
    table.boolean('is_home').defaultTo(true); // Home or away match (for external)

    table.string('venue', 200).notNullable();
    table.date('date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').nullable();
    table.string('competition_name', 200).nullable(); // League/cup name

    // Results
    table.integer('home_score').unsigned().nullable();
    table.integer('away_score').unsigned().nullable();

    table.enum('status', ['draft', 'published', 'scheduled', 'in_progress', 'completed', 'cancelled'])
      .defaultTo('draft');
    table.integer('created_by').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    table.index(['club_id', 'status']);
    table.index(['season_id']);
    table.index(['date', 'start_time']);
    table.index('home_team_id');
    table.index('away_team_id');
    table.index('created_by');

    // Constraint: Either away_team_id OR opponent_name must be set
    table.check('(away_team_id IS NOT NULL) OR (opponent_name IS NOT NULL)');
  });

  // 5. Create match_events table (for goals, cards, substitutions)
  await knex.schema.createTable('match_events', (table) => {
    table.increments('id').primary();
    table.integer('match_id').unsigned().notNullable()
      .references('id').inTable('matches').onDelete('CASCADE');
    table.enum('event_type', ['goal', 'yellow_card', 'red_card', 'substitution_in', 'substitution_out'])
      .notNullable();
    table.integer('minute').unsigned().notNullable(); // Match minute when event occurred
    table.integer('player_id').unsigned().nullable()
      .references('id').inTable('user_children').onDelete('SET NULL'); // Player involved
    table.integer('team_id').unsigned().notNullable()
      .references('id').inTable('teams').onDelete('CASCADE'); // Which team
    table.text('details').nullable(); // Additional details (e.g., "assist by X", "penalty")
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('match_id');
    table.index(['match_id', 'minute']);
    table.index('player_id');
    table.index('team_id');
  });

  console.log('✅ Created seasons, training_sessions, matches, and related tables');
};

export async function down(knex) {
  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists('match_events');
  await knex.schema.dropTableIfExists('matches');
  await knex.schema.dropTableIfExists('training_session_teams');
  await knex.schema.dropTableIfExists('training_sessions');
  await knex.schema.dropTableIfExists('seasons');

  console.log('✅ Dropped seasons, training_sessions, matches, and related tables');
};
