/**
 * Migration: Create RBAC (Role-Based Access Control) Tables
 *
 * Creates:
 * - resources: Defines pages, menus, features, and API endpoints
 * - role_permissions: Maps roles to resources with granular permissions
 */

export async function up(knex) {
  // Create resources table
  await knex.schema.createTable('resources', (table) => {
    table.increments('id').primary();
    table.string('name', 100).unique().notNullable(); // e.g., 'parent-dashboard', 'billing-settings'
    table.string('display_name', 255).notNullable(); // e.g., 'Parent Dashboard'
    table.string('type', 50).notNullable(); // 'page', 'menu', 'feature', 'api'
    table.string('path', 255); // e.g., '/app/parent-dashboard'
    table.integer('parent_id').unsigned().references('id').inTable('resources').onDelete('SET NULL');
    table.string('icon', 100); // Lucide icon name, e.g., 'Home', 'Users'
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create role_permissions table
  await knex.schema.createTable('role_permissions', (table) => {
    table.increments('id').primary();
    table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.integer('resource_id').unsigned().notNullable().references('id').inTable('resources').onDelete('CASCADE');
    table.boolean('can_view').defaultTo(false);
    table.boolean('can_create').defaultTo(false);
    table.boolean('can_edit').defaultTo(false);
    table.boolean('can_delete').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Unique constraint: one permission entry per role-resource pair
    table.unique(['role_id', 'resource_id']);
  });

  // Add indexes for performance
  await knex.schema.alterTable('resources', (table) => {
    table.index('type');
    table.index('is_active');
    table.index('parent_id');
  });

  await knex.schema.alterTable('role_permissions', (table) => {
    table.index('role_id');
    table.index('resource_id');
    table.index('is_active');
  });

  console.log('✅ Created resources and role_permissions tables');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('resources');
  console.log('✅ Dropped resources and role_permissions tables');
}
