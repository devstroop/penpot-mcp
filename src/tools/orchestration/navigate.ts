/**
 * Navigate Tool - Project and file navigation
 */

import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { NavigateParams } from './types.js';

export class NavigateTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: NavigateParams): Promise<MCPResponse> {
    const { action } = params;

    switch (action) {
      case 'projects':
        return this.listProjects();
      case 'files':
        return this.listFiles(params);
      case 'pages':
        return this.listPages(params);
      case 'search':
        return this.searchFiles(params);
      default:
        return ResponseFormatter.formatError(
          `Unknown action: ${action}. Use: projects, files, pages, search`
        );
    }
  }

  private async listProjects(): Promise<MCPResponse> {
    const client = this.clientFactory.createProjectsClient();
    return client.listProjects();
  }

  private async listFiles(params: NavigateParams): Promise<MCPResponse> {
    const { projectId } = params;

    if (!projectId) {
      return ResponseFormatter.formatError('projectId is required for files action');
    }

    const client = this.clientFactory.createProjectsClient();
    return client.getProjectFiles(projectId);
  }

  private async listPages(params: NavigateParams): Promise<MCPResponse> {
    const { fileId } = params;

    if (!fileId) {
      return ResponseFormatter.formatError('fileId is required for pages action');
    }

    const client = this.clientFactory.createFilesClient();
    return client.getFilePages(fileId);
  }

  private async searchFiles(params: NavigateParams): Promise<MCPResponse> {
    const { query } = params;

    if (!query) {
      return ResponseFormatter.formatError('query is required for search action');
    }

    // Get all projects and search through files
    const projectsClient = this.clientFactory.createProjectsClient();
    const projectsResponse = await projectsClient.listProjects();

    if (projectsResponse.isError) {
      return projectsResponse;
    }

    try {
      const projectsContent = projectsResponse.content[0];
      const projectsData = JSON.parse(
        projectsContent.type === 'text' ? projectsContent.text : '{}'
      );
      const projects = projectsData.data?.projects || [];

      const lowerQuery = query.toLowerCase();
      const matches: Array<{
        projectId: string;
        projectName: string;
        fileId: string;
        fileName: string;
      }> = [];

      for (const project of projects) {
        const filesResponse = await projectsClient.getProjectFiles(project.id);
        if (!filesResponse.isError) {
          const filesContent = filesResponse.content[0];
          const filesData = JSON.parse(filesContent.type === 'text' ? filesContent.text : '{}');
          const files = filesData.data?.files || [];

          for (const file of files) {
            if (file.name?.toLowerCase().includes(lowerQuery)) {
              matches.push({
                projectId: project.id,
                projectName: project.name,
                fileId: file.id,
                fileName: file.name,
              });
            }
          }
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          query,
          matches,
          count: matches.length,
        },
        `Found ${matches.length} files matching "${query}"`
      );
    } catch (error) {
      return ResponseFormatter.formatError(`Search failed: ${error}`);
    }
  }
}
