import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export interface Project {
  id: string;
  name: string;
  teamId: string;
  teamName?: string;
  createdAt?: string;
  modifiedAt?: string;
  isDefault?: boolean;
}

/**
 * Projects API Client - Full project management capabilities
 * Handles all project-related operations for Penpot
 */
export class ProjectsAPIClient extends BaseAPIClient {
  /**
   * List all projects for the authenticated user
   */
  async listProjects(): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown[]>('/rpc/command/get-all-projects', {}, false);

      const projects = this.normalizeTransitResponse(response) as Project[];

      return ResponseFormatter.formatList(projects, 'project', {
        total: projects.length,
      });
    } catch (error) {
      return ErrorHandler.handle(error, 'listProjects');
    }
  }

  /**
   * Get a specific project by ID
   */
  async getProject(projectId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown[]>('/rpc/command/get-all-projects', {}, false);

      const projects = this.normalizeTransitResponse(response) as Project[];
      const project = projects.find((p) => p.id === projectId);

      if (!project) {
        return ResponseFormatter.formatError(`Project not found: ${projectId}`);
      }

      return ResponseFormatter.formatSuccess(project, `Project: ${project.name}`);
    } catch (error) {
      return ErrorHandler.handle(error, `getProject(${projectId})`);
    }
  }

  /**
   * Create a new project
   */
  async createProject(name: string, teamId?: string): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:name': name,
      };

      if (teamId) {
        payload['~:team-id'] = `~u${teamId}`;
      }

      const response = await this.post<unknown>(
        '/rpc/command/create-project',
        payload,
        true // Use Transit+JSON
      );

      const project = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(project, `Project "${name}" created successfully`);
    } catch (error) {
      logger.error('Failed to create project', error);
      return ErrorHandler.handle(error, 'createProject');
    }
  }

  /**
   * Rename a project
   */
  async renameProject(projectId: string, newName: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${projectId}`,
        '~:name': newName,
      };

      const response = await this.post<unknown>('/rpc/command/rename-project', payload, true);

      const project = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(project, `Project renamed to "${newName}"`);
    } catch (error) {
      logger.error('Failed to rename project', error);
      return ErrorHandler.handle(error, 'renameProject');
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${projectId}`,
      };

      await this.post<unknown>('/rpc/command/delete-project', payload, true);

      return ResponseFormatter.formatSuccess(
        { deleted: true, projectId },
        `Project ${projectId} deleted`
      );
    } catch (error) {
      logger.error('Failed to delete project', error);
      return ErrorHandler.handle(error, 'deleteProject');
    }
  }

  /**
   * Duplicate a project
   */
  async duplicateProject(projectId: string, newName?: string): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:project-id': `~u${projectId}`,
      };

      if (newName) {
        payload['~:name'] = newName;
      }

      const response = await this.post<unknown>('/rpc/command/duplicate-project', payload, true);

      const project = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(project, 'Project duplicated successfully');
    } catch (error) {
      logger.error('Failed to duplicate project', error);
      return ErrorHandler.handle(error, 'duplicateProject');
    }
  }

  /**
   * Move project to another team
   */
  async moveProject(projectId: string, targetTeamId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:project-id': `~u${projectId}`,
        '~:team-id': `~u${targetTeamId}`,
      };

      const response = await this.post<unknown>('/rpc/command/move-project', payload, true);

      const project = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(project, `Project moved to team ${targetTeamId}`);
    } catch (error) {
      logger.error('Failed to move project', error);
      return ErrorHandler.handle(error, 'moveProject');
    }
  }

  /**
   * Get files in a project
   */
  async getProjectFiles(projectId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown[]>(
        '/rpc/command/get-project-files',
        { '~:project-id': `~u${projectId}` },
        true // Use Transit+JSON format
      );

      const files = this.normalizeTransitResponse(response) as unknown[];

      return ResponseFormatter.formatList(files, 'file', {
        total: files.length,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `getProjectFiles(${projectId})`);
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<MCPResponse> {
    try {
      const filesResult = await this.getProjectFiles(projectId);

      if (filesResult.isError) {
        return filesResult;
      }

      const files = (filesResult.content[0] as any)?.text
        ? JSON.parse((filesResult.content[0] as any).text).items
        : [];

      const stats = {
        projectId,
        totalFiles: files.length,
        files: files.map((f: any) => ({
          id: f.id,
          name: f.name,
          createdAt: f.createdAt,
          modifiedAt: f.modifiedAt,
        })),
      };

      return ResponseFormatter.formatSuccess(stats, `Project has ${files.length} files`);
    } catch (error) {
      logger.error('Failed to get project stats', error);
      return ErrorHandler.handle(error, 'getProjectStats');
    }
  }

  /**
   * Validate project exists and is accessible
   */
  async validateProject(projectId: string): Promise<MCPResponse> {
    try {
      const result = await this.getProject(projectId);

      if (result.isError) {
        return ResponseFormatter.formatError(`Project ${projectId} is not accessible`);
      }

      return ResponseFormatter.formatSuccess(
        { valid: true, accessible: true, projectId },
        `Project ${projectId} is valid and accessible`
      );
    } catch (error) {
      return ResponseFormatter.formatError(`Project ${projectId} validation failed: ${error}`);
    }
  }
}
