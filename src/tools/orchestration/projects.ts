import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { ProjectsParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Projects Tool - Comprehensive project management
 */
export class ProjectsTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: ProjectsParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('ProjectsTool executing', { action, params });

    switch (action) {
      case 'list':
        // listProjects() returns all projects regardless of team
        return client.projects.listProjects();

      case 'get':
        if (!params.projectId) {
          return ResponseFormatter.formatError('projectId is required for get action');
        }
        return client.projects.getProject(params.projectId);

      case 'create':
        if (!params.name) {
          return ResponseFormatter.formatError('name is required for create action');
        }
        // createProject(name, teamId?) - teamId is optional
        return client.projects.createProject(params.name, params.teamId);

      case 'rename':
        if (!params.projectId || !params.name) {
          return ResponseFormatter.formatError('projectId and name are required for rename action');
        }
        return client.projects.renameProject(params.projectId, params.name);

      case 'delete':
        if (!params.projectId) {
          return ResponseFormatter.formatError('projectId is required for delete action');
        }
        return client.projects.deleteProject(params.projectId);

      case 'duplicate':
        if (!params.projectId) {
          return ResponseFormatter.formatError('projectId is required for duplicate action');
        }
        return client.projects.duplicateProject(params.projectId, params.name);

      case 'move':
        if (!params.projectId || !params.targetTeamId) {
          return ResponseFormatter.formatError('projectId and targetTeamId are required for move action');
        }
        return client.projects.moveProject(params.projectId, params.targetTeamId);

      case 'files':
        if (!params.projectId) {
          return ResponseFormatter.formatError('projectId is required for files action');
        }
        return client.projects.getProjectFiles(params.projectId);

      case 'stats':
        if (!params.projectId) {
          return ResponseFormatter.formatError('projectId is required for stats action');
        }
        return client.projects.getProjectStats(params.projectId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
