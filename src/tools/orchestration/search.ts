import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { SearchParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Search Tool - Global search across Penpot workspace
 */
export class SearchTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: SearchParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('SearchTool executing', { action, query: params.query });

    switch (action) {
      case 'files':
        return this.searchFiles(params);

      case 'objects':
        if (!params.fileId || !params.query) {
          return ResponseFormatter.formatError('fileId and query are required for objects search');
        }
        // searchObjects(fileId, query, pageId?)
        return client.files.searchObjects(params.fileId, params.query, params.pageId);

      case 'components':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for components search');
        }
        return client.components.searchComponents(params.fileId, params.query || '');

      case 'colors':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for colors search');
        }
        return client.tokens.searchTokens(params.fileId, params.query || '');

      case 'typography':
        if (!params.fileId) {
          return ResponseFormatter.formatError('fileId is required for typography search');
        }
        return client.tokens.searchTokens(params.fileId, params.query || '');

      case 'recent':
        return client.profile.getRecentFiles();

      case 'global':
        return this.globalSearch(params);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }

  private async searchFiles(params: SearchParams): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();
    const query = params.query?.toLowerCase() || '';
    
    try {
      // Get all projects (listProjects returns all projects)
      const projectsResult = await client.projects.listProjects();
      if (projectsResult.isError) {
        return projectsResult;
      }

      const projects = JSON.parse((projectsResult.content[0] as any).text)?.data?.project || [];
      const matchingFiles: any[] = [];

      // Filter by project if specified
      const targetProjects = params.projectId
        ? projects.filter((p: any) => p.id === params.projectId)
        : projects;

      for (const project of targetProjects.slice(0, 5)) { // Limit to 5 projects
        const filesResult = await client.projects.getProjectFiles(project.id);
        if (filesResult.isError) continue;

        const files = JSON.parse((filesResult.content[0] as any).text)?.data?.file || [];
        
        for (const file of files) {
          if (!query || file.name?.toLowerCase().includes(query)) {
            matchingFiles.push({
              ...file,
              projectId: project.id,
              projectName: project.name,
            });
          }
        }
      }

      const limited = matchingFiles.slice(0, params.limit || 20);

      return ResponseFormatter.formatList(limited, 'file', {
        total: limited.length,
        query,
      });
    } catch (error) {
      logger.error('File search failed', error);
      return ResponseFormatter.formatError(`Search failed: ${error}`);
    }
  }

  private async globalSearch(params: SearchParams): Promise<MCPResponse> {
    const query = params.query || '';
    
    if (!query) {
      return ResponseFormatter.formatError('query is required for global search');
    }

    const results: Record<string, any[]> = {
      files: [],
      objects: [],
      components: [],
      tokens: [],
    };

    try {
      // Search files
      const filesResult = await this.searchFiles({ ...params, action: 'files' });
      if (!filesResult.isError) {
        results.files = JSON.parse((filesResult.content[0] as any).text)?.data?.file || [];
      }

      // If fileId provided, search within it
      if (params.fileId) {
        const client = this.clientFactory.createClient();

        // Search objects - searchObjects(fileId, query, pageId?)
        const objectsResult = await client.files.searchObjects(params.fileId, query, params.pageId);
        if (!objectsResult.isError) {
          results.objects = JSON.parse((objectsResult.content[0] as any).text)?.data?.object || [];
        }

        // Search components
        const componentsResult = await client.components.searchComponents(params.fileId, query);
        if (!componentsResult.isError) {
          results.components = JSON.parse((componentsResult.content[0] as any).text)?.data?.component || [];
        }

        // Search tokens
        const tokensResult = await client.tokens.searchTokens(params.fileId, query);
        if (!tokensResult.isError) {
          const tokensData = JSON.parse((tokensResult.content[0] as any).text)?.data;
          results.tokens = [...(tokensData?.colors || []), ...(tokensData?.typography || [])];
        }
      }

      return ResponseFormatter.formatSuccess({
        query,
        results,
        summary: {
          files: results.files.length,
          objects: results.objects.length,
          components: results.components.length,
          tokens: results.tokens.length,
          total: results.files.length + results.objects.length + results.components.length + results.tokens.length,
        },
      }, `Found matches for "${query}"`);
    } catch (error) {
      logger.error('Global search failed', error);
      return ResponseFormatter.formatError(`Search failed: ${error}`);
    }
  }
}
