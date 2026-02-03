/**
 * Create contact_submissions table for storing contact form submissions
 */

export async function up(knex) {
  await knex.schema.createTable('contact_submissions', (table) => {
    table.increments('id').primary();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable();
    table.string('club_name', 255).nullable();
    table.integer('estimated_members').nullable();
    table.text('message').notNullable();
    table.string('status', 20).notNullable().defaultTo('new');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Index for listing/filtering
    table.index(['status', 'created_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('contact_submissions');
}
