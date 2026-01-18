/**
 * Seed: Resources and Role Permissions
 *
 * This seeds the RBAC system with the current as-is configuration
 * matching navigation.ts and router/index.tsx
 */

export async function seed(knex) {
  // Clear existing data (in correct order due to foreign keys)
  await knex('role_permissions').del();
  await knex('resources').del();

  // ===== INSERT RESOURCES =====
  const resources = [
    // Dashboards
    { name: 'admin-dashboard', display_name: 'Dashboard', type: 'page', path: '/app/admin-dashboard', icon: 'Home', sort_order: 1 },
    { name: 'club-manager-dashboard', display_name: 'Dashboard', type: 'page', path: '/app/club-manager-dashboard', icon: 'Home', sort_order: 1 },
    { name: 'member-dashboard', display_name: 'Dashboard', type: 'page', path: '/app/member-dashboard', icon: 'Home', sort_order: 1 },
    { name: 'parent-dashboard', display_name: 'Dashboard', type: 'page', path: '/app/parent-dashboard', icon: 'Home', sort_order: 1 },
    { name: 'staff-dashboard', display_name: 'Dashboard', type: 'page', path: '/app/staff-dashboard', icon: 'Home', sort_order: 1 },
    { name: 'team-manager-dashboard', display_name: 'Dashboard', type: 'page', path: '/app/team-manager-dashboard', icon: 'Home', sort_order: 1 },
    { name: 'super-admin-dashboard', display_name: 'Platform Overview', type: 'page', path: '/app/super-admin-dashboard', icon: 'LayoutDashboard', sort_order: 1 },

    // Admin shared
    { name: 'member-management', display_name: 'Member Management', type: 'page', path: '/app/members', icon: 'Users', sort_order: 2 },

    // Club management
    { name: 'club-setup', display_name: 'Club Details', type: 'page', path: '/app/club/setup', icon: 'Settings', sort_order: 3 },
    { name: 'club-personnel', display_name: 'Personnel', type: 'page', path: '/app/club/personnel', icon: 'UserCog', sort_order: 4 },
    { name: 'club-members', display_name: 'Club Members', type: 'page', path: '/app/club/members', icon: 'Users', sort_order: 5 },
    { name: 'teams', display_name: 'Teams', type: 'page', path: '/app/teams', icon: 'Shield', sort_order: 6 },

    // Club operations
    { name: 'seasons', display_name: 'Seasons', type: 'page', path: '/app/seasons', icon: 'Calendar', sort_order: 7 },
    { name: 'schedule', display_name: 'Schedule', type: 'page', path: '/app/schedule', icon: 'CalendarDays', sort_order: 8 },

    // Financials
    { name: 'membership-tiers', display_name: 'Membership Tiers', type: 'page', path: '/app/membership-tiers', icon: 'Layers', sort_order: 9 },
    { name: 'subscriptions', display_name: 'Subscriptions', type: 'page', path: '/app/subscriptions', icon: 'Repeat', sort_order: 10 },
    { name: 'billing', display_name: 'Billing & Invoices', type: 'page', path: '/app/billing', icon: 'Receipt', sort_order: 11 },
    { name: 'billing-settings', display_name: 'Billing Settings', type: 'page', path: '/app/billing/settings', icon: 'Settings', sort_order: 12 },

    // Member features
    { name: 'my-schedule', display_name: 'My Schedule', type: 'page', path: '/calendar', icon: 'Calendar', sort_order: 2 },
    { name: 'my-attendance', display_name: 'My Attendance', type: 'page', path: '/attendance', icon: 'CheckCircle', sort_order: 3 },

    // Parent features
    { name: 'parent-children', display_name: 'My Children', type: 'page', path: '/app/parent/children', icon: 'Users', sort_order: 2 },
    { name: 'parent-schedule', display_name: 'Schedules', type: 'page', path: '/app/parent/schedule', icon: 'Calendar', sort_order: 3 },
    { name: 'parent-subscriptions', display_name: 'Subscriptions', type: 'page', path: '/app/parent/subscriptions', icon: 'Repeat', sort_order: 4 },
    { name: 'parent-payment-methods', display_name: 'Payment Methods', type: 'page', path: '/app/parent/payment-methods', icon: 'Wallet', sort_order: 5 },
    { name: 'parent-billing', display_name: 'Bills & Invoices', type: 'page', path: '/app/parent/billing', icon: 'Receipt', sort_order: 6 },

    // Super admin features - reorganized with groups
    // Settings Group (parent)
    { name: 'super-admin-settings', display_name: 'Settings', type: 'group', path: null, icon: 'Settings', sort_order: 2 },
    // Settings children (will set parent_id after insert)
    { name: 'admin-settings', display_name: 'Platform Settings', type: 'page', path: '/app/admin/settings', icon: 'Sliders', sort_order: 1 },
    { name: 'admin-resources', display_name: 'Resources', type: 'page', path: '/app/admin/resources', icon: 'Boxes', sort_order: 2 },
    { name: 'admin-permissions', display_name: 'Permissions', type: 'page', path: '/app/admin/permissions', icon: 'ShieldCheck', sort_order: 3 },

    // Reports Group (parent)
    { name: 'super-admin-reports', display_name: 'Reports', type: 'group', path: null, icon: 'BarChart3', sort_order: 3 },
    // Reports children
    { name: 'admin-analytics', display_name: 'Analytics', type: 'page', path: '/app/admin/analytics', icon: 'TrendingUp', sort_order: 1 },
    { name: 'admin-audit-logs', display_name: 'Audit Logs', type: 'page', path: '/app/admin/audit-logs', icon: 'FileText', sort_order: 2 },

    // Operations Group (parent)
    { name: 'super-admin-operations', display_name: 'Operations', type: 'group', path: null, icon: 'Briefcase', sort_order: 4 },
    // Club Management subgroup
    { name: 'super-admin-club-management', display_name: 'Club Management', type: 'group', path: null, icon: 'Building2', sort_order: 1 },
    { name: 'admin-clubs', display_name: 'All Clubs', type: 'page', path: '/app/admin/clubs', icon: 'Building2', sort_order: 1 },
    { name: 'admin-club-approvals', display_name: 'Club Approvals', type: 'page', path: '/app/admin/clubs/approvals', icon: 'CheckCircle', sort_order: 2 },
    // Billing Management subgroup
    { name: 'super-admin-billing-management', display_name: 'Billing Management', type: 'group', path: null, icon: 'Receipt', sort_order: 2 },
    { name: 'admin-billing-settings', display_name: 'Club Billing Settings', type: 'page', path: '/app/admin/billing/settings', icon: 'Settings', sort_order: 1 },
    { name: 'admin-billing-jobs', display_name: 'Scheduled Invoice Jobs', type: 'page', path: '/app/admin/billing/jobs', icon: 'Calendar', sort_order: 2 },

    // Shared
    { name: 'communication', display_name: 'Messages', type: 'page', path: '/communication', icon: 'MessageSquare', sort_order: 90 },
    { name: 'profile', display_name: 'Profile', type: 'page', path: '/profile', icon: 'User', sort_order: 99 },
  ];

  await knex('resources').insert(resources);

  // Get inserted resources for ID lookup
  const insertedResources = await knex('resources').select('id', 'name');
  const resourceMap = {};
  insertedResources.forEach(r => {
    resourceMap[r.name] = r.id;
  });

  // Set parent_id relationships for super admin menu hierarchy
  const parentRelationships = [
    // Settings group children
    { child: 'admin-settings', parent: 'super-admin-settings' },
    { child: 'admin-resources', parent: 'super-admin-settings' },
    { child: 'admin-permissions', parent: 'super-admin-settings' },
    // Reports group children
    { child: 'admin-analytics', parent: 'super-admin-reports' },
    { child: 'admin-audit-logs', parent: 'super-admin-reports' },
    // Operations group children (subgroups)
    { child: 'super-admin-club-management', parent: 'super-admin-operations' },
    { child: 'super-admin-billing-management', parent: 'super-admin-operations' },
    // Club Management subgroup children
    { child: 'admin-clubs', parent: 'super-admin-club-management' },
    { child: 'admin-club-approvals', parent: 'super-admin-club-management' },
    // Billing Management subgroup children
    { child: 'admin-billing-settings', parent: 'super-admin-billing-management' },
    { child: 'admin-billing-jobs', parent: 'super-admin-billing-management' },
  ];

  for (const { child, parent } of parentRelationships) {
    const childId = resourceMap[child];
    const parentId = resourceMap[parent];
    if (childId && parentId) {
      await knex('resources').where({ id: childId }).update({ parent_id: parentId });
    }
  }

  // Get roles for ID lookup
  const roles = await knex('roles').select('id', 'name');
  const roleMap = {};
  roles.forEach(r => {
    roleMap[r.name] = r.id;
  });

  // ===== INSERT ROLE PERMISSIONS =====
  // Define which resources each role can access (with full CRUD for now)
  const rolePermissionsConfig = {
    admin: [
      'admin-dashboard', 'member-management', 'club-setup', 'club-personnel',
      'club-members', 'teams', 'communication', 'profile'
    ],
    club_manager: [
      'club-manager-dashboard', 'club-setup', 'club-personnel', 'club-members',
      'teams', 'seasons', 'schedule', 'membership-tiers', 'subscriptions',
      'billing', 'billing-settings', 'communication', 'profile'
    ],
    member: [
      'member-dashboard', 'my-schedule', 'my-attendance', 'communication', 'profile'
    ],
    parent: [
      'parent-dashboard', 'parent-children', 'parent-schedule',
      'parent-subscriptions', 'parent-payment-methods', 'parent-billing',
      'communication', 'profile'
    ],
    staff: [
      'staff-dashboard', 'communication', 'profile'
    ],
    team_manager: [
      'team-manager-dashboard', 'teams', 'schedule', 'communication', 'profile'
    ],
    super_admin: [
      'super-admin-dashboard',
      // Settings group and children
      'super-admin-settings', 'admin-settings', 'admin-resources', 'admin-permissions',
      // Reports group and children
      'super-admin-reports', 'admin-analytics', 'admin-audit-logs',
      // Operations group, subgroups, and children
      'super-admin-operations',
      'super-admin-club-management', 'admin-clubs', 'admin-club-approvals',
      'super-admin-billing-management', 'admin-billing-settings', 'admin-billing-jobs',
      // Shared
      'communication', 'profile'
    ],
  };

  const rolePermissions = [];

  for (const [roleName, resourceNames] of Object.entries(rolePermissionsConfig)) {
    const roleId = roleMap[roleName];
    if (!roleId) {
      console.warn(`⚠️ Role '${roleName}' not found in database, skipping...`);
      continue;
    }

    for (const resourceName of resourceNames) {
      const resourceId = resourceMap[resourceName];
      if (!resourceId) {
        console.warn(`⚠️ Resource '${resourceName}' not found, skipping...`);
        continue;
      }

      rolePermissions.push({
        role_id: roleId,
        resource_id: resourceId,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        is_active: true,
      });
    }
  }

  if (rolePermissions.length > 0) {
    await knex('role_permissions').insert(rolePermissions);
  }

  console.log(`✅ Seeded ${resources.length} resources`);
  console.log(`✅ Seeded ${rolePermissions.length} role permissions`);
}
