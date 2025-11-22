export async function up(knex) {
  const exists = await knex.schema.hasTable('email_outbox');
  if (exists) return;

  await knex.schema.createTable('email_outbox', (table) => {
    table.increments('id').primary();
    table.string('to_email').notNullable().index();
    table.string('subject').notNullable();
    table.text('body_text');
    table.text('body_html');
    table.string('template');
    table.jsonb('template_data');
    table.enu('status', ['pending', 'sent', 'failed']).notNullable().defaultTo('pending');
    table.string('provider_message_id');
    table.text('error_message');
    table.timestamp('sent_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  const exists = await knex.schema.hasTable('email_outbox');
  if (!exists) return;
  await knex.schema.dropTable('email_outbox');
}


