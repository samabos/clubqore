/**
 * Permission Middleware for role-based authorization
 *
 * This middleware provides reusable permission checks for routes
 */

/**
 * Middleware to require specific roles
 * @param {string[]} allowedRoles - Array of role names that are allowed
 */
export function requireRole(allowedRoles) {
  return async function (request, reply) {
    const userId = request.user?.id;

    if (!userId) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      // Get user roles
      const userRoles = await request.server.db('user_roles')
        .where({ user_id: userId, is_active: true })
        .select('role_id');

      const roleIds = userRoles.map(r => r.role_id);

      const roles = await request.server.db('roles')
        .whereIn('id', roleIds)
        .select('name');

      const roleNames = roles.map(r => r.name);

      // Check if user has any of the allowed roles
      const hasPermission = roleNames.some(role => allowedRoles.includes(role));

      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      // Attach roles to request for use in controllers
      request.userRoles = roleNames;
    } catch (error) {
      request.log.error('Error checking user roles:', error);
      return reply.code(500).send({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
}

/**
 * Check if user is a club manager
 */
export function requireClubManager() {
  return requireRole(['club_manager', 'admin']);
}

/**
 * Check if user is a team manager or club manager
 */
export function requireTeamOrClubManager() {
  return requireRole(['team_manager', 'club_manager', 'admin']);
}

/**
 * Helper function to check if user manages a specific team
 * Use this in controllers after requireTeamOrClubManager middleware
 */
export async function userManagesTeam(db, userId, teamId) {
  const team = await db('teams')
    .where({ id: teamId, manager_id: userId })
    .first();

  return !!team;
}

/**
 * Helper function to check if user is a club manager (not team manager)
 * Use this in controllers to differentiate between club and team managers
 */
export async function isClubManager(db, userId) {
  const userRoles = await db('user_roles')
    .where({ user_id: userId, is_active: true })
    .select('role_id');

  const roleIds = userRoles.map(r => r.role_id);

  const roles = await db('roles')
    .whereIn('id', roleIds)
    .select('name');

  const roleNames = roles.map(r => r.name);

  return roleNames.includes('club_manager') || roleNames.includes('admin');
}

/**
 * Helper function to check if user is only a team manager (not also a club manager)
 */
export async function isOnlyTeamManager(db, userId) {
  const userRoles = await db('user_roles')
    .where({ user_id: userId, is_active: true })
    .select('role_id');

  const roleIds = userRoles.map(r => r.role_id);

  const roles = await db('roles')
    .whereIn('id', roleIds)
    .select('name');

  const roleNames = roles.map(r => r.name);

  return roleNames.includes('team_manager') && !roleNames.includes('club_manager') && !roleNames.includes('admin');
}

/**
 * Helper function to get teams managed by a user
 */
export async function getTeamsManagedByUser(db, userId) {
  const teams = await db('teams')
    .where({ manager_id: userId })
    .select('id', 'name');

  return teams;
}
