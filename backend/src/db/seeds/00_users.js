import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Get super admin credentials from environment
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@clubqore.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'ClubQore Administrator';

  // Ensure all required roles exist (needed for resources.js role_permissions)
  const requiredRoles = [
    { name: 'super_admin', display_name: 'Super Administrator', description: 'Full platform access - Service provider administrator' },
    { name: 'admin', display_name: 'Club Administrator', description: 'Club-level administrator with full club access' },
  ];

  for (const role of requiredRoles) {
    const existing = await knex('roles').where('name', role.name).first();
    if (!existing) {
      await knex('roles').insert({
        name: role.name,
        display_name: role.display_name,
        description: role.description,
        is_active: true,
      });
      console.log(`✅ Role created: ${role.name}`);
    }
  }

  // Check if super admin already exists
  const existingSuperAdmin = await knex('users')
    .where('email', superAdminEmail)
    .first();

  if (existingSuperAdmin) {
    console.log(`✅ Super admin already exists: ${superAdminEmail}`);
    return;
  }

  // Get super_admin role for user creation
  const superAdminRole = await knex('roles').where('name', 'super_admin').first();

  // Hash password
  const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

  // Insert super admin user
  const [userId] = await knex('users').insert([
    {
      email: superAdminEmail,
      password: hashedPassword,
      name: superAdminName,
      account_type: 'service_provider',
      is_onboarded: true,
      email_verified: true,
      email_verified_at: knex.fn.now(),
      club_id: null, // Super admin not associated with any club
    },
  ]).returning('id');

  const finalUserId = typeof userId === 'object' ? userId.id : userId;

  // Link user to super_admin role in user_roles table
  await knex('user_roles').insert([
    {
      user_id: finalUserId,
      role_id: superAdminRole.id,
      club_id: null, // Platform-wide access
      is_active: true,
    }
  ]);

  console.log('✅ Super admin account created successfully');
  console.log(`   Email: ${superAdminEmail}`);
  console.log(`   Password: ${superAdminPassword}`);
  console.log(`   Role: super_admin`);
  console.log('⚠️  IMPORTANT: Change the password after first login!');
}
