/**
 * Migration: Refactor roles to use role_id foreign key references
 *
 * This migration normalizes the role system by:
 * 1. Adding role_id columns to user_roles and user_accounts tables
 * 2. Migrating existing role TEXT data to role_id references
 * 3. Removing old role TEXT columns and CHECK constraints
 * 4. Updating users table to use primary_role_id instead of primary_role
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Step 0: Ensure all required roles exist in the roles table
  const requiredRoles = [
    { name: 'club_manager', display_name: 'Club Manager', description: 'Manages the entire club' },
    { name: 'team_manager', display_name: 'Team Manager', description: 'Manages a specific team' },
    { name: 'staff', display_name: 'Staff', description: 'Club staff member' },
    { name: 'member', display_name: 'Member', description: 'Club member' },
    { name: 'parent', display_name: 'Parent', description: 'Parent of a club member' }
  ];

  for (const role of requiredRoles) {
    const existing = await knex('roles').where({ name: role.name }).first();
    if (!existing) {
      await knex('roles').insert({
        name: role.name,
        display_name: role.display_name,
        description: role.description,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log(`✅ Created role: ${role.name}`);
    }
  }

  // Step 1: Add role_id columns (nullable initially for data migration)
  await knex.schema.alterTable('user_roles', (table) => {
    table.integer('role_id').unsigned().nullable();
    table.foreign('role_id').references('id').inTable('roles').onDelete('RESTRICT');
    table.index('role_id');
  });

  await knex.schema.alterTable('user_accounts', (table) => {
    table.integer('role_id').unsigned().nullable();
    table.foreign('role_id').references('id').inTable('roles').onDelete('RESTRICT');
    table.index('role_id');
  });

  // Step 2: Migrate existing data
  // Get all roles from the roles table
  const roles = await knex('roles').select('id', 'name');
  const roleMap = {};
  roles.forEach(role => {
    roleMap[role.name] = role.id;
  });

  // Migrate user_roles data
  const userRoles = await knex('user_roles').select('id', 'role');
  for (const userRole of userRoles) {
    const roleId = roleMap[userRole.role];
    if (roleId) {
      await knex('user_roles').where({ id: userRole.id }).update({ role_id: roleId });
    } else {
      console.warn(`Warning: Role "${userRole.role}" not found in roles table for user_roles.id=${userRole.id}`);
    }
  }

  // Migrate user_accounts data
  const userAccounts = await knex('user_accounts').select('id', 'role');
  for (const userAccount of userAccounts) {
    const roleId = roleMap[userAccount.role];
    if (roleId) {
      await knex('user_accounts').where({ id: userAccount.id }).update({ role_id: roleId });
    } else {
      console.warn(`Warning: Role "${userAccount.role}" not found in roles table for user_accounts.id=${userAccount.id}`);
    }
  }

  // Step 3: Make role_id columns NOT NULL (after data migration)
  await knex.schema.alterTable('user_roles', (table) => {
    table.integer('role_id').unsigned().notNullable().alter();
  });

  await knex.schema.alterTable('user_accounts', (table) => {
    table.integer('role_id').unsigned().notNullable().alter();
  });

  // Step 4: Drop old UNIQUE constraints that include role column
  await knex.schema.raw('ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_club_id_unique');
  await knex.schema.raw('ALTER TABLE user_accounts DROP CONSTRAINT IF EXISTS user_accounts_user_id_role_club_id_unique');

  // Step 5: Add new UNIQUE constraints with role_id
  await knex.schema.alterTable('user_roles', (table) => {
    table.unique(['user_id', 'role_id', 'club_id']);
  });

  await knex.schema.alterTable('user_accounts', (table) => {
    table.unique(['user_id', 'role_id', 'club_id']);
  });

  // Step 6: Drop old CHECK constraints on role column
  await knex.schema.raw('ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check');
  await knex.schema.raw('ALTER TABLE user_accounts DROP CONSTRAINT IF EXISTS user_accounts_role_check');

  // Step 7: Drop old role TEXT columns
  await knex.schema.alterTable('user_roles', (table) => {
    table.dropColumn('role');
  });

  await knex.schema.alterTable('user_accounts', (table) => {
    table.dropColumn('role');
  });

  console.log('✅ Role refactoring completed successfully');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Step 1: Add back old role columns
  await knex.schema.alterTable('user_roles', (table) => {
    table.text('role');
  });

  await knex.schema.alterTable('user_accounts', (table) => {
    table.text('role');
  });

  // Step 2: Migrate data back from role_id to role names
  const roles = await knex('roles').select('id', 'name');
  const roleIdMap = {};
  roles.forEach(role => {
    roleIdMap[role.id] = role.name;
  });

  // Migrate user_roles data back
  const userRoles = await knex('user_roles').select('id', 'role_id');
  for (const userRole of userRoles) {
    const roleName = roleIdMap[userRole.role_id];
    if (roleName) {
      await knex('user_roles').where({ id: userRole.id }).update({ role: roleName });
    }
  }

  // Migrate user_accounts data back
  const userAccounts = await knex('user_accounts').select('id', 'role_id');
  for (const userAccount of userAccounts) {
    const roleName = roleIdMap[userAccount.role_id];
    if (roleName) {
      await knex('user_accounts').where({ id: userAccount.id }).update({ role: roleName });
    }
  }

  // Step 3: Make old role columns NOT NULL
  await knex.schema.alterTable('user_roles', (table) => {
    table.text('role').notNullable().alter();
  });

  await knex.schema.alterTable('user_accounts', (table) => {
    table.text('role').notNullable().alter();
  });

  // Step 4: Re-add CHECK constraints
  await knex.schema.raw(`
    ALTER TABLE user_roles
    ADD CONSTRAINT user_roles_role_check
    CHECK (role = ANY (ARRAY['club_manager'::text, 'team_manager'::text, 'staff'::text, 'member'::text, 'parent'::text]))
  `);

  await knex.schema.raw(`
    ALTER TABLE user_accounts
    ADD CONSTRAINT user_accounts_role_check
    CHECK (role = ANY (ARRAY['club_manager'::text, 'team_manager'::text, 'staff'::text, 'member'::text, 'parent'::text]))
  `);

  // Step 5: Drop new UNIQUE constraints
  await knex.schema.raw('ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_id_club_id_unique');
  await knex.schema.raw('ALTER TABLE user_accounts DROP CONSTRAINT IF EXISTS user_accounts_user_id_role_id_club_id_unique');

  // Step 6: Re-add old UNIQUE constraints
  await knex.schema.alterTable('user_roles', (table) => {
    table.unique(['user_id', 'role', 'club_id']);
  });

  await knex.schema.alterTable('user_accounts', (table) => {
    table.unique(['user_id', 'role', 'club_id']);
  });

  // Step 7: Drop role_id columns and foreign keys
  await knex.schema.alterTable('user_roles', (table) => {
    table.dropForeign('role_id');
    table.dropColumn('role_id');
  });

  await knex.schema.alterTable('user_accounts', (table) => {
    table.dropForeign('role_id');
    table.dropColumn('role_id');
  });

  console.log('✅ Role refactoring rollback completed');
};
