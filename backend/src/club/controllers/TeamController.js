import { TeamService } from '../services/TeamService.js';
import { ClubService } from '../services/ClubService.js';
import { UserService } from '../../auth/services/userService.js';

export class TeamController {
  constructor(db) {
    this.db = db;
    this.teamService = new TeamService(db);
    this.clubService = new ClubService(db);
    this.userService = new UserService(db);
  }

  // Create team
  async createTeam(request, reply) {
    try {
      const teamData = request.body;
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const result = await this.teamService.createTeam(clubId, teamData);
      reply.code(201).send(result);
    } catch (error) {
      request.log.error('Error creating team:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to create team'
      });
    }
  }

  // Get all teams for user's club
  async getTeams(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        // Check if user is admin - if so, return all teams
        const adminRole = await this.db('user_roles')
          .where({ user_id: userId, role: 'admin', is_active: true })
          .first();
        
        if (adminRole) {
          // For admin users, get all teams
          const allTeams = await this.db('teams')
            .leftJoin('users', 'teams.manager_id', 'users.id')
            .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
            .select(
              'teams.*',
              'users.id as manager_user_id',
              'users.email as manager_email',
              'user_profiles.first_name as manager_first_name',
              'user_profiles.last_name as manager_last_name',
              'user_profiles.avatar as manager_avatar'
            )
            .orderBy('teams.created_at', 'desc');

          // Get member counts for each team
          const teamsWithCounts = await Promise.all(
            allTeams.map(async (team) => {
              const [memberCount] = await this.db('user_accounts')
                .count('* as count')
                .where({ team_id: team.id, role: 'member' });

              return {
                ...team,
                manager_count: team.manager_user_id ? 1 : 0,
                member_count: parseInt(memberCount.count)
              };
            })
          );

          return reply.code(200).send({
            success: true,
            data: teamsWithCounts
          });
        }

        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const teams = await this.teamService.getTeamsByClub(clubId);
      reply.code(200).send({
        success: true,
        data: teams
      });
    } catch (error) {
      request.log.error('Error fetching teams:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to fetch teams'
      });
    }
  }

  // Get team details with managers and members
  async getTeamById(request, reply) {
    try {
      const teamId = parseInt(request.params.teamId);
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const team = await this.teamService.getTeamById(teamId);

      // Verify team belongs to user's club
      if (team.club_id !== clubId) {
        return reply.code(403).send({
          success: false,
          message: 'Access denied to this team'
        });
      }

      reply.code(200).send({
        success: true,
        data: team
      });
    } catch (error) {
      request.log.error('Error fetching team:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to fetch team'
      });
    }
  }

  // Update team
  async updateTeam(request, reply) {
    try {
      const teamId = parseInt(request.params.teamId);
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      const teamData = request.body;

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Verify team belongs to user's club
      const team = await this.teamService.getTeamById(teamId);
      if (team.club_id !== clubId) {
        return reply.code(403).send({
          success: false,
          message: 'Access denied to this team'
        });
      }

      const result = await this.teamService.updateTeam(teamId, teamData);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating team:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update team'
      });
    }
  }

  // Delete team
  async deleteTeam(request, reply) {
    try {
      const teamId = parseInt(request.params.teamId);
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      // If user is not associated with a club, allow admins to proceed
      let isAdmin = false;
      if (!clubId) {
        const adminRole = await this.db('user_roles')
          .where({ user_id: userId, role: 'admin', is_active: true })
          .first();
        isAdmin = !!adminRole;
        if (!isAdmin) {
          return reply.code(400).send({
            success: false,
            message: 'User is not associated with a club'
          });
        }
      }

      // Check if team exists (and belongs to user's club if not admin)
      const teamQuery = this.db('teams').where({ id: teamId });
      if (!isAdmin) {
        teamQuery.andWhere({ club_id: clubId });
      }
      const team = await teamQuery.first();

      if (!team) {
        return reply.code(404).send({
          success: false,
          message: 'Team not found or access denied'
        });
      }

      const result = await this.teamService.deleteTeam(teamId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error deleting team:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to delete team'
      });
    }
  }

  // Assign team manager
  async assignTeamManager(request, reply) {
    try {
      const teamId = parseInt(request.params.teamId);
      const { userId: managerUserId } = request.body;
      const currentUserId = request.user.id;
      const clubId = await this.userService.getUserClubId(currentUserId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      if (!managerUserId) {
        return reply.code(400).send({
          success: false,
          message: 'User ID is required'
        });
      }

      // Verify team belongs to user's club
      const team = await this.teamService.getTeamById(teamId);
      if (team.club_id !== clubId) {
        return reply.code(403).send({
          success: false,
          message: 'Access denied to this team'
        });
      }

      const result = await this.teamService.assignTeamManager(teamId, managerUserId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error assigning team manager:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to assign team manager'
      });
    }
  }

  // Remove team manager
  async removeTeamManager(request, reply) {
    try {
      const teamId = parseInt(request.params.teamId);
      const managerUserId = parseInt(request.params.userId);
      const currentUserId = request.user.id;
      const clubId = await this.userService.getUserClubId(currentUserId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Verify team belongs to user's club
      const team = await this.teamService.getTeamById(teamId);
      if (team.club_id !== clubId) {
        return reply.code(403).send({
          success: false,
          message: 'Access denied to this team'
        });
      }

      const result = await this.teamService.removeTeamManager(teamId, managerUserId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error removing team manager:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to remove team manager'
      });
    }
  }

  // Get team managers
  async getTeamManagers(request, reply) {
    try {
      const teamId = parseInt(request.params.teamId);
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Verify team belongs to user's club
      const team = await this.teamService.getTeamById(teamId);
      if (team.club_id !== clubId) {
        return reply.code(403).send({
          success: false,
          message: 'Access denied to this team'
        });
      }

      const managers = await this.teamService.getTeamManagers(teamId);
      reply.code(200).send({
        success: true,
        data: managers
      });
    } catch (error) {
      request.log.error('Error fetching team managers:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to fetch team managers'
      });
    }
  }

  // Assign member to team
  async assignMemberToTeam(request, reply) {
    try {
      const teamId = parseInt(request.params.teamId);
      const { memberId } = request.body;
      const currentUserId = request.user.id;
      const clubId = await this.userService.getUserClubId(currentUserId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      if (!memberId) {
        return reply.code(400).send({
          success: false,
          message: 'Member ID is required'
        });
      }

      // Verify team belongs to user's club
      const team = await this.teamService.getTeamById(teamId);
      if (team.club_id !== clubId) {
        return reply.code(403).send({
          success: false,
          message: 'Access denied to this team'
        });
      }

      const result = await this.teamService.assignMemberToTeam(memberId, teamId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error assigning member to team:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to assign member to team'
      });
    }
  }

  // Remove member from team
  async removeMemberFromTeam(request, reply) {
    try {
      const teamId = parseInt(request.params.teamId);
      const memberId = parseInt(request.params.memberId);
      const currentUserId = request.user.id;
      const clubId = await this.userService.getUserClubId(currentUserId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Verify team belongs to user's club
      const team = await this.teamService.getTeamById(teamId);
      if (team.club_id !== clubId) {
        return reply.code(403).send({
          success: false,
          message: 'Access denied to this team'
        });
      }

      const result = await this.teamService.removeMemberFromTeam(memberId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error removing member from team:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to remove member from team'
      });
    }
  }

  // Get team members
  async getTeamMembers(request, reply) {
    try {
      const teamId = parseInt(request.params.teamId);
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Verify team belongs to user's club
      const team = await this.teamService.getTeamById(teamId);
      if (team.club_id !== clubId) {
        return reply.code(403).send({
          success: false,
          message: 'Access denied to this team'
        });
      }

      const members = await this.teamService.getTeamMembers(teamId);
      reply.code(200).send({
        success: true,
        data: members
      });
    } catch (error) {
      request.log.error('Error fetching team members:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to fetch team members'
      });
    }
  }

  // Get assigned players in club
  async getAssignedChildrenInClub(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(403).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const assignedChildren = await this.teamService.getAssignedChildrenInClub(clubId);
      reply.code(200).send({
        success: true,
        data: assignedChildren
      });
    } catch (error) {
      request.log.error('Error fetching assigned players in club:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to fetch assigned players in club'
      });
    }
  }
}
