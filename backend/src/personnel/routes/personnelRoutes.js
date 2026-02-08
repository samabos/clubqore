import { requireScope } from '../../auth/permissionMiddleware.js';

/**
 * Personnel routes for club personnel management
 * Handles team managers and staff
 */
export async function personnelRoutes(fastify, options) {
  const { personnelController, authenticate } = options;

  // Scope middleware for club-personnel resource
  const viewScope = requireScope('club-personnel', 'view');
  const createScope = requireScope('club-personnel', 'create');
  const editScope = requireScope('club-personnel', 'edit');
  const deleteScope = requireScope('club-personnel', 'delete');

  /**
   * GET /api/clubs/:clubId/personnel
   * Get all personnel for a club
   */
  fastify.get('/:clubId/personnel', {
    preHandler: [authenticate, viewScope]
  }, (request, reply) => personnelController.getClubPersonnel(request, reply));

  /**
   * POST /api/clubs/:clubId/personnel
   * Add new personnel to a club
   */
  fastify.post('/:clubId/personnel', {
    preHandler: [authenticate, createScope]
  }, (request, reply) => personnelController.addPersonnelToClub(request, reply));

  /**
   * PUT /api/clubs/personnel/:userRoleId
   * Update personnel information
   */
  fastify.put('/personnel/:userRoleId', {
    preHandler: [authenticate, editScope]
  }, (request, reply) => personnelController.updatePersonnel(request, reply));

  /**
   * DELETE /api/clubs/personnel/:userRoleId
   * Remove personnel from club
   */
  fastify.delete('/personnel/:userRoleId', {
    preHandler: [authenticate, deleteScope]
  }, (request, reply) => personnelController.removePersonnelFromClub(request, reply));

  /**
   * GET /api/clubs/:clubId/personnel/team-managers
   * Get team managers for a club
   */
  fastify.get('/:clubId/personnel/team-managers', {
    preHandler: [authenticate, viewScope]
  }, (request, reply) => personnelController.getClubTeamManagers(request, reply));
}
