/**
 * Migration: Create training_session_exceptions and match_exceptions tables
 * Date: 2026-01-14
 *
 * This migration creates exception tables to handle modifications to recurring events:
 * - Cancellations (cancel one occurrence)
 * - Reschedules (change date/time for one occurrence)
 * - Modifications (change any field for one occurrence)
 *
 * Part of Option B: Hybrid Virtual Recurrence with Exceptions architecture
 */

export async function up(knex) {
  // Create training_session_exceptions table
  await knex.schema.createTable('training_session_exceptions', table => {
    table.increments('id').primary();

    // Link to parent recurring session
    table.integer('training_session_id').unsigned().notNullable()
      .references('id').inTable('training_sessions').onDelete('CASCADE');

    // The occurrence date this exception applies to
    table.date('occurrence_date').notNullable();

    // Type of exception
    table.enum('exception_type', ['cancelled', 'rescheduled', 'modified']).notNullable();

    // Override fields (null = use parent value)
    table.date('override_date').nullable();
    table.time('override_start_time').nullable();
    table.time('override_end_time').nullable();
    table.string('override_title', 255).nullable();
    table.text('override_description').nullable();
    table.string('override_location', 255).nullable();
    table.integer('override_coach_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.integer('override_max_participants').unsigned().nullable();
    table.enum('override_status', ['draft', 'scheduled', 'completed', 'cancelled']).nullable();

    // Metadata
    table.integer('created_by').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    // Ensure one exception per occurrence
    table.unique(['training_session_id', 'occurrence_date']);

    table.index('training_session_id');
    table.index('occurrence_date');
  });

  // Create match_exceptions table (similar structure)
  await knex.schema.createTable('match_exceptions', table => {
    table.increments('id').primary();

    table.integer('match_id').unsigned().notNullable()
      .references('id').inTable('matches').onDelete('CASCADE');

    table.date('occurrence_date').notNullable();

    table.enum('exception_type', ['cancelled', 'rescheduled', 'modified']).notNullable();

    // Override fields
    table.date('override_date').nullable();
    table.time('override_start_time').nullable();
    table.time('override_end_time').nullable();
    table.string('override_venue', 255).nullable();
    table.string('override_opponent_name', 255).nullable();
    table.boolean('override_is_home').nullable();
    table.integer('override_home_score').unsigned().nullable();
    table.integer('override_away_score').unsigned().nullable();
    table.enum('override_status', ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled']).nullable();

    table.integer('created_by').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    table.unique(['match_id', 'occurrence_date']);

    table.index('match_id');
    table.index('occurrence_date');
  });

  console.log('✅ Created training_session_exceptions and match_exceptions tables');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('match_exceptions');
  await knex.schema.dropTableIfExists('training_session_exceptions');

  console.log('✅ Dropped exceptions tables');
}
