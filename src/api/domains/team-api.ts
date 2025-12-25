import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export interface Team {
  id: string;
  name: string;
  isDefault?: boolean;
  members?: TeamMember[];
  projects?: string[];
  createdAt?: string;
  modifiedAt?: string;
}

export interface TeamMember {
  id: string;
  email?: string;
  name?: string;
  role?: 'owner' | 'admin' | 'editor' | 'viewer';
  isOwner?: boolean;
  isAdmin?: boolean;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role?: string;
  status?: 'pending' | 'accepted' | 'expired';
  createdAt?: string;
}

/**
 * Team API Client - Full team management capabilities
 * Handles all team-related operations for Penpot
 */
export class TeamAPIClient extends BaseAPIClient {
  
  /**
   * Get all teams for current user
   */
  async listTeams(): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-teams',
        {},
        false
      );
      
      const teams = this.normalizeTransitResponse(response) || [];
      
      return ResponseFormatter.formatList(teams as unknown[], 'team', {
        total: (teams as unknown[]).length,
      });
    } catch (error) {
      logger.error('Failed to list teams', error);
      return ErrorHandler.handle(error, 'listTeams');
    }
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${teamId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/get-team',
        payload,
        true
      );
      
      const team = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(team, `Team retrieved`);
    } catch (error) {
      logger.error('Failed to get team', error);
      return ErrorHandler.handle(error, 'getTeam');
    }
  }

  /**
   * Create a new team
   */
  async createTeam(name: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:name': name,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/create-team',
        payload,
        true
      );
      
      const team = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(team, `Team "${name}" created`);
    } catch (error) {
      logger.error('Failed to create team', error);
      return ErrorHandler.handle(error, 'createTeam');
    }
  }

  /**
   * Rename a team
   */
  async renameTeam(teamId: string, newName: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${teamId}`,
        '~:name': newName,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/update-team',
        payload,
        true
      );
      
      const team = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(team, `Team renamed to "${newName}"`);
    } catch (error) {
      logger.error('Failed to rename team', error);
      return ErrorHandler.handle(error, 'renameTeam');
    }
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${teamId}`,
      };
      
      await this.post<unknown>(
        '/rpc/command/delete-team',
        payload,
        true
      );
      
      return ResponseFormatter.formatSuccess({ deleted: true, teamId }, 'Team deleted');
    } catch (error) {
      logger.error('Failed to delete team', error);
      return ErrorHandler.handle(error, 'deleteTeam');
    }
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/get-team-members',
        payload,
        true
      );
      
      const members = this.normalizeTransitResponse(response) || [];
      
      return ResponseFormatter.formatList(members as unknown[], 'member', {
        teamId,
      });
    } catch (error) {
      logger.error('Failed to get team members', error);
      return ErrorHandler.handle(error, 'getTeamMembers');
    }
  }

  /**
   * Invite member to team
   */
  async inviteToTeam(teamId: string, email: string, role: string = 'editor'): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
        '~:email': email,
        '~:role': `~:${role}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/create-team-invitation',
        payload,
        true
      );
      
      const invitation = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(invitation, `Invitation sent to ${email}`);
    } catch (error) {
      logger.error('Failed to invite to team', error);
      return ErrorHandler.handle(error, 'inviteToTeam');
    }
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, memberId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
        '~:member-id': `~u${memberId}`,
      };
      
      await this.post<unknown>(
        '/rpc/command/delete-team-member',
        payload,
        true
      );
      
      return ResponseFormatter.formatSuccess({ removed: true, memberId }, 'Member removed from team');
    } catch (error) {
      logger.error('Failed to remove member', error);
      return ErrorHandler.handle(error, 'removeMember');
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(teamId: string, memberId: string, role: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
        '~:member-id': `~u${memberId}`,
        '~:role': `~:${role}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/update-team-member-role',
        payload,
        true
      );
      
      const member = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(member, `Member role updated to ${role}`);
    } catch (error) {
      logger.error('Failed to update member role', error);
      return ErrorHandler.handle(error, 'updateMemberRole');
    }
  }

  /**
   * Get pending invitations
   */
  async getPendingInvitations(teamId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/get-team-invitations',
        payload,
        true
      );
      
      const invitations = this.normalizeTransitResponse(response) || [];
      
      return ResponseFormatter.formatList(invitations as unknown[], 'invitation', {
        teamId,
      });
    } catch (error) {
      logger.error('Failed to get invitations', error);
      return ErrorHandler.handle(error, 'getPendingInvitations');
    }
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${invitationId}`,
      };
      
      await this.post<unknown>(
        '/rpc/command/delete-team-invitation',
        payload,
        true
      );
      
      return ResponseFormatter.formatSuccess({ cancelled: true, invitationId }, 'Invitation cancelled');
    } catch (error) {
      logger.error('Failed to cancel invitation', error);
      return ErrorHandler.handle(error, 'cancelInvitation');
    }
  }

  /**
   * Leave team
   */
  async leaveTeam(teamId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${teamId}`,
      };
      
      await this.post<unknown>(
        '/rpc/command/leave-team',
        payload,
        true
      );
      
      return ResponseFormatter.formatSuccess({ left: true, teamId }, 'Left team');
    } catch (error) {
      logger.error('Failed to leave team', error);
      return ErrorHandler.handle(error, 'leaveTeam');
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(teamId: string): Promise<MCPResponse> {
    try {
      // Get members
      const membersResult = await this.getTeamMembers(teamId);
      
      // Get team details
      const teamResult = await this.getTeam(teamId);
      
      if (membersResult.isError || teamResult.isError) {
        return ResponseFormatter.formatError('Failed to get team stats');
      }
      
      const members = JSON.parse((membersResult.content[0] as any).text)?.items || [];
      
      const stats = {
        teamId,
        memberCount: members.length,
        roleDistribution: members.reduce((acc: Record<string, number>, m: TeamMember) => {
          const role = m.role || 'unknown';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {}),
      };
      
      return ResponseFormatter.formatSuccess(stats, `Team has ${members.length} members`);
    } catch (error) {
      logger.error('Failed to get team stats', error);
      return ErrorHandler.handle(error, 'getTeamStats');
    }
  }
}
