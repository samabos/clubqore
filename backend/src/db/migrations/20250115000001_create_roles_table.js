/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    .createTable('roles', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable().unique();
      table.string('display_name', 255).notNullable();
      table.text('description').nullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index('name');
      table.index('is_active');
    })
    .then(() => {
      // Insert default roles
      return knex('roles').insert([
        {
          name: 'club_manager',
          display_name: 'Club Manager',
          description: 'Manages club operations, members, and events',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'club_coach',
          display_name: 'Club Coach',
          description: 'Coaches and trains club members',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'member',
          display_name: 'Member',
          description: 'Regular club member with basic access',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'parent',
          display_name: 'Parent',
          description: 'Parent of club members with oversight capabilities',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('roles');
}
