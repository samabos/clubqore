export async function up(knex) {
  const exists = await knex.schema.hasTable('email_templates');
  if (exists) return;

  await knex.schema.createTable('email_templates', (table) => {
    table.increments('id').primary();
    table.string('template_key').notNullable().unique().comment('Unique identifier for the template');
    table.string('name').notNullable().comment('Human-readable name');
    table.string('description').comment('Description of when this template is used');
    table.string('subject').notNullable().comment('Email subject line (supports {{variables}}');
    table.text('body_text').notNullable().comment('Plain text version (supports {{variables}}');
    table.text('body_html').notNullable().comment('HTML version (supports {{variables}}');
    table.jsonb('variables').comment('List of available variables for this template');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('template_key');
    table.index('is_active');
  });
}

export async function down(knex) {
  const exists = await knex.schema.hasTable('email_templates');
  if (!exists) return;
  await knex.schema.dropTable('email_templates');
}
