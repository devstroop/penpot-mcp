import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { TeamParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Team Tool - Team and member management
 */
export class TeamTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: TeamParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('TeamTool executing', { action, params });

    switch (action) {
      case 'list':
        return client.team.listTeams();

      case 'get':
        if (!params.teamId) {
          return ResponseFormatter.formatError('teamId is required for get action');
        }
        return client.team.getTeam(params.teamId);

      case 'create':
        if (!params.name) {
          return ResponseFormatter.formatError('name is required for create action');
        }
        return client.team.createTeam(params.name);

      case 'rename':
        if (!params.teamId || !params.name) {
          return ResponseFormatter.formatError('teamId and name are required for rename action');
        }
        return client.team.renameTeam(params.teamId, params.name);

      case 'delete':
        if (!params.teamId) {
          return ResponseFormatter.formatError('teamId is required for delete action');
        }
        return client.team.deleteTeam(params.teamId);

      case 'members':
        if (!params.teamId) {
          return ResponseFormatter.formatError('teamId is required for members action');
        }
        return client.team.getTeamMembers(params.teamId);

      case 'invite':
        if (!params.teamId || !params.email) {
          return ResponseFormatter.formatError('teamId and email are required for invite action');
        }
        return client.team.inviteToTeam(params.teamId, params.email, params.role);

      case 'remove_member':
        if (!params.teamId || !params.memberId) {
          return ResponseFormatter.formatError('teamId and memberId are required for remove_member action');
        }
        return client.team.removeMember(params.teamId, params.memberId);

      case 'update_role':
        if (!params.teamId || !params.memberId || !params.role) {
          return ResponseFormatter.formatError('teamId, memberId and role are required for update_role action');
        }
        return client.team.updateMemberRole(params.teamId, params.memberId, params.role);

      case 'invitations':
        if (!params.teamId) {
          return ResponseFormatter.formatError('teamId is required for invitations action');
        }
        return client.team.getPendingInvitations(params.teamId);

      case 'cancel_invite':
        if (!params.invitationId) {
          return ResponseFormatter.formatError('invitationId is required for cancel_invite action');
        }
        return client.team.cancelInvitation(params.invitationId);

      case 'leave':
        if (!params.teamId) {
          return ResponseFormatter.formatError('teamId is required for leave action');
        }
        return client.team.leaveTeam(params.teamId);

      case 'stats':
        if (!params.teamId) {
          return ResponseFormatter.formatError('teamId is required for stats action');
        }
        return client.team.getTeamStats(params.teamId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
