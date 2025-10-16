/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
    return knex.schema.createTable('tokens', function (table) {
        table.increments('id').primary();
        table.string('token_id').notNullable().unique();
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.enum('type', ['access', 'refresh']).notNullable();
        table.timestamp('expires_at').notNullable();
        table.boolean('revoked').defaultTo(false);
        table.timestamps(true, true);
        
        table.index(['token_id', 'revoked']);
        table.index(['user_id', 'type']);
        table.index('expires_at');
      });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
    return knex.schema.dropTable('tokens');
}
