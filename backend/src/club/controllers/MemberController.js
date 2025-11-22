import { MemberService } from '../services/MemberService.js';
import { ClubService } from '../services/ClubService.js';

export class MemberController {
  constructor(db) {
    this.db = db;
    this.memberService = new MemberService(db);
    this.clubService = new ClubService(db);
  }



  async getMyClubMembers(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.status(404).send({
          error: 'No club found for this user. Please create a club first before adding members.',
          message: 'You need to set up your club before you can add members. Please setup club first.',
          action: 'create_club'
        });
      }
      const members = await this.memberService.listMembersByClub(clubId);
      return reply.send({ success: true, data: members });
    } catch (err) {
      request.log.error('Error fetching my club members:', err);
      return reply.status(500).send({ error: err.message || 'Failed to fetch members' });
    }
  }

  async getMembersByClub(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;
      await this.memberService.assertUserInClub(userId, clubId);
      const members = await this.memberService.listMembersByClub(clubId);
      return reply.send({ success: true, data: members });
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message || 'Failed to fetch members' });
    }
  }

  async createMyClubMember(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.status(404).send({
          error: 'No club found for this user. Please create a club first before adding members.',
          message: 'You need to set up your club before you can add members. Please go to the Club Setup page to create your club.',
          action: 'create_club'
        });
      }
      const result = await this.memberService.createParentAndChildren(clubId, request.body);
      return reply.code(201).send(result);
    } catch (err) {
      const status = err.statusCode || 400;
      return reply.status(status).send({ error: err.message || 'Failed to create member' });
    }
  }

  async createClubMember(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;
      await this.memberService.assertUserInClub(userId, clubId);
      const result = await this.memberService.createParentAndChildren(clubId, request.body);
      return reply.code(201).send(result);
    } catch (err) {
      const status = err.statusCode || 400;
      return reply.status(status).send({ error: err.message || 'Failed to create member' });
    }
  }

  /**
   * GET /api/clubs/my-club/members/:memberId
   * Get a specific member by ID
   */
  async getMyClubMemberById(request, reply) {
    try {
      const { memberId } = request.params;
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.status(404).send({
          error: 'No club found for this user'
        });
      }
      const member = await this.memberService.getMemberById(clubId, parseInt(memberId));
      return reply.send({ success: true, member });
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message || 'Failed to fetch member' });
    }
  }

  /**
   * PUT /api/clubs/my-club/members/:memberId
   * Update a specific member
   */
  async updateMyClubMember(request, reply) {
    try {
      const { memberId } = request.params;
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.status(404).send({
          error: 'No club found for this user'
        });
      }
      const result = await this.memberService.updateMember(clubId, parseInt(memberId), request.body);
      return reply.send({ success: true, member: result });
    } catch (err) {
      const status = err.statusCode || 400;
      return reply.status(status).send({ error: err.message || 'Failed to update member' });
    }
  }

  async updateMemberStatus(request, reply) {
    try {
      const memberId = parseInt(request.params.id);
      const { status, contractEndDate } = request.body;
      const userId = request.user.id;

      // Get the manager's club ID
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.status(404).send({
          error: 'No club found for this user'
        });
      }

      // Update the member status
      const result = await this.memberService.updateMemberStatus(memberId, {
        status,
        contractEndDate: contractEndDate || new Date().toISOString().split('T')[0],
        isActive: status === 'Active'
      }, clubId);

      reply.code(200).send({
        success: true,
        message: 'Member status updated successfully',
        data: result
      });
    } catch (error) {
      request.log.error('Error updating member status:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update member status'
      });
    }
  }
}
