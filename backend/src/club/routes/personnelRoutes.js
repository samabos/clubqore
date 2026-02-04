/**
 * @deprecated OBSOLETE - This file has been moved to personnel/routes/
 * This file is kept temporarily for reference and can be safely deleted.
 * New location: backend/src/personnel/routes/personnelRoutes.js
 */
/**
 * Personnel routes for club personnel management
 * Handles team managers and staff
 */
export async function personnelRoutes(fastify, options) {
  const { personnelController, authenticate } = options;

  /**
   * GET /api/clubs/:clubId/personnel
   * Get all personnel for a club
   */
  fastify.get('/:clubId/personnel', {
    preHandler: [authenticate]
  }, (request, reply) => personnelController.getClubPersonnel(request, reply));

  /**
   * POST /api/clubs/:clubId/personnel
   * Add new personnel to a club
   */
  fastify.post('/:clubId/personnel', {
    preHandler: [authenticate]
  }, (request, reply) => personnelController.addPersonnelToClub(request, reply));

  /**
   * PUT /api/clubs/personnel/:userRoleId
   * Update personnel information
   */
  fastify.put('/personnel/:userRoleId', {
    preHandler: [authenticate]
  }, (request, reply) => personnelController.updatePersonnel(request, reply));

  /**
   * DELETE /api/clubs/personnel/:userRoleId
   * Remove personnel from club
   */
  fastify.delete('/personnel/:userRoleId', {
    preHandler: [authenticate]
  }, (request, reply) => personnelController.removePersonnelFromClub(request, reply));

  /**
   * GET /api/clubs/:clubId/personnel/team-managers
   * Get team managers for a club
   */
  fastify.get('/:clubId/personnel/team-managers', {
    preHandler: [authenticate]
  }, (request, reply) => personnelController.getClubTeamManagers(request, reply));
}
