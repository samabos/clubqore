/**
 * Permission Middleware for role-based and scope-based authorization
 *
 * This middleware provides reusable permission checks for routes.
 * Supports both role-based (database lookup) and scope-based (JWT claim) authorization.
 */

// Track all resources used in routes for validation
const usedResources = new Set();

/**
 * Validate that all resources used in routes exist in the database.
 * Call this after routes are registered but before accepting traffic.
 *
 * @param {Knex} db - Database instance
 * @throws {Error} If any resource is missing from database
 */
export async function validateResources(db) {
  if (usedResources.size === 0) {
    console.log('⚠️  No resources registered for validation');
    return;
  }

  try {
    const dbResources = await db('resources').pluck('name');
    const dbResourceSet = new Set(dbResources);

    const missing = [...usedResources].filter(r => !dbResourceSet.has(r));

    if (missing.length > 0) {
      const error = `❌ Resource mismatch! The following resources are used in routes but not in database:\n   ${missing.join('\n   ')}\n\n   Fix: Add to backend/src/db/seeds/resources.js and run migrations`;
      console.error(error);

      // In development, throw to fail fast
      if (process.env.NODE_ENV === 'development') {
        throw new Error(error);
      }
    } else {
      console.log(`✅ All ${usedResources.size} route resources validated against database`);
    }
  } catch (error) {
    if (error.message?.includes('Resource mismatch')) {
      throw error;
    }
    // Table might not exist yet during initial setup
    console.warn('⚠️  Could not validate resources (table may not exist yet):', error.message);
  }
}

/**
 * Middleware to require specific scopes from JWT token
 * Scopes are embedded in the JWT during login and checked without database lookup.
 * Format: "resource:action" (e.g., "subscriptions:view", "billing:edit")
 *
 * @param {string} resource - Resource name (e.g., 'subscriptions', 'billing')
 * @param {string} action - Action type: 'view', 'create', 'edit', 'delete' (default: 'view')
 */
export function requireScope(resource, action = 'view') {
  // Track resource for startup validation
  usedResources.add(resource);

  const requiredScope = `${resource}:${action}`;

  return async function (request, reply) {
    // User should be attached by authenticate middleware
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get scopes from JWT (attached during authentication)
    const userScopes = request.user.scopes || [];

    if (!userScopes.includes(requiredScope)) {
      request.log.warn({
        userId: request.user.id,
        requiredScope,
        userScopes: userScopes.slice(0, 10), // Log first 10 scopes for debugging
        path: request.url
      }, 'Scope check failed');

      return reply.code(403).send({
        success: false,
        message: `Access denied. Required scope: ${requiredScope}`
      });
    }
  };
}

/**
 * Middleware to require any of the specified scopes
 * @param {string[]} scopes - Array of scope strings (e.g., ['subscriptions:view', 'billing:view'])
 */
export function requireAnyScope(scopes) {
  return async function (request, reply) {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication required'
      });
    }

    const userScopes = request.user.scopes || [];
    const hasAnyScope = scopes.some(scope => userScopes.includes(scope));

    if (!hasAnyScope) {
      request.log.warn({
        userId: request.user.id,
        requiredScopes: scopes,
        path: request.url
      }, 'Scope check failed - none of required scopes present');

      return reply.code(403).send({
        success: false,
        message: `Access denied. Required one of: ${scopes.join(', ')}`
      });
    }
  };
}

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
