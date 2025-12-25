import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export interface SharedLibrary {
  id: string;
  name: string;
  projectId: string;
  teamId?: string;
  isShared?: boolean;
  components?: Record<string, unknown>;
  colors?: Record<string, LibraryColor>;
  typographies?: Record<string, LibraryTypography>;
}

export interface LibraryColor {
  id: string;
  name: string;
  color?: string;
  opacity?: number;
  gradient?: unknown;
  fileId?: string;
  path?: string;
}

export interface LibraryTypography {
  id: string;
  name: string;
  fontId?: string;
  fontFamily?: string;
  fontVariantId?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  path?: string;
}

export interface LibraryComponent {
  id: string;
  name: string;
  path?: string;
  annotation?: string;
  mainInstanceId?: string;
  mainInstancePage?: string;
  objects?: Record<string, unknown>;
}

/**
 * Library API Client - Shared library management
 * Handles all shared library operations for Penpot
 */
export class LibraryAPIClient extends BaseAPIClient {
  
  /**
   * Get shared libraries for a team/project
   */
  async getSharedLibraries(teamId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/get-team-shared-files',
        payload,
        true
      );
      
      const libraries = this.normalizeTransitResponse(response) || [];
      
      return ResponseFormatter.formatList(libraries as unknown[], 'shared_library', {
        teamId,
      });
    } catch (error) {
      logger.error('Failed to get shared libraries', error);
      return ErrorHandler.handle(error, 'getSharedLibraries');
    }
  }

  /**
   * Link a shared library to a file
   */
  async linkLibrary(fileId: string, libraryId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:library-id': `~u${libraryId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/link-file-to-library',
        payload,
        true
      );
      
      const result = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(result, `Library linked to file`);
    } catch (error) {
      logger.error('Failed to link library', error);
      return ErrorHandler.handle(error, 'linkLibrary');
    }
  }

  /**
   * Unlink a shared library from a file
   */
  async unlinkLibrary(fileId: string, libraryId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:library-id': `~u${libraryId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/unlink-file-from-library',
        payload,
        true
      );
      
      const result = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(result, `Library unlinked from file`);
    } catch (error) {
      logger.error('Failed to unlink library', error);
      return ErrorHandler.handle(error, 'unlinkLibrary');
    }
  }

  /**
   * Get libraries linked to a file
   */
  async getLinkedLibraries(fileId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/get-file-libraries',
        payload,
        true
      );
      
      const libraries = this.normalizeTransitResponse(response) || [];
      
      return ResponseFormatter.formatList(libraries as unknown[], 'linked_library', {
        fileId,
      });
    } catch (error) {
      logger.error('Failed to get linked libraries', error);
      return ErrorHandler.handle(error, 'getLinkedLibraries');
    }
  }

  /**
   * Publish file as shared library
   */
  async publishAsLibrary(fileId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/set-file-shared',
        payload,
        true
      );
      
      const result = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(result, 'File published as shared library');
    } catch (error) {
      logger.error('Failed to publish library', error);
      return ErrorHandler.handle(error, 'publishAsLibrary');
    }
  }

  /**
   * Unpublish shared library
   */
  async unpublishLibrary(fileId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:is-shared': false,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/set-file-shared',
        payload,
        true
      );
      
      const result = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(result, 'Library unpublished');
    } catch (error) {
      logger.error('Failed to unpublish library', error);
      return ErrorHandler.handle(error, 'unpublishLibrary');
    }
  }

  /**
   * Get library summary (components, colors, typographies count)
   */
  async getLibrarySummary(fileId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:features': [],
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/get-file-summary',
        payload,
        true
      );
      
      const summary = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(summary, 'Library summary retrieved');
    } catch (error) {
      logger.error('Failed to get library summary', error);
      return ErrorHandler.handle(error, 'getLibrarySummary');
    }
  }

  /**
   * Sync library updates to linked files
   */
  async syncLibraryUpdates(fileId: string, libraryId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:library-id': `~u${libraryId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/sync-file',
        payload,
        true
      );
      
      const result = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(result, 'Library updates synced');
    } catch (error) {
      logger.error('Failed to sync library', error);
      return ErrorHandler.handle(error, 'syncLibraryUpdates');
    }
  }

  /**
   * Get library colors
   */
  async getLibraryColors(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );
      
      const fileData = this.normalizeTransitResponse(response) as any;
      const colors = fileData?.data?.colorsIndex || {};
      
      const colorList = Object.entries(colors).map(([id, color]) => ({
        id,
        ...(color as object),
      }));
      
      return ResponseFormatter.formatList(colorList, 'color', {
        fileId,
        total: colorList.length,
      });
    } catch (error) {
      logger.error('Failed to get library colors', error);
      return ErrorHandler.handle(error, 'getLibraryColors');
    }
  }

  /**
   * Get library typographies
   */
  async getLibraryTypographies(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );
      
      const fileData = this.normalizeTransitResponse(response) as any;
      const typographies = fileData?.data?.typographiesIndex || {};
      
      const typoList = Object.entries(typographies).map(([id, typo]) => ({
        id,
        ...(typo as object),
      }));
      
      return ResponseFormatter.formatList(typoList, 'typography', {
        fileId,
        total: typoList.length,
      });
    } catch (error) {
      logger.error('Failed to get library typographies', error);
      return ErrorHandler.handle(error, 'getLibraryTypographies');
    }
  }

  /**
   * Get library components
   */
  async getLibraryComponents(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );
      
      const fileData = this.normalizeTransitResponse(response) as any;
      const components = fileData?.data?.componentsIndex || {};
      
      const componentList = Object.entries(components).map(([id, comp]) => ({
        id,
        ...(comp as object),
      }));
      
      return ResponseFormatter.formatList(componentList, 'component', {
        fileId,
        total: componentList.length,
      });
    } catch (error) {
      logger.error('Failed to get library components', error);
      return ErrorHandler.handle(error, 'getLibraryComponents');
    }
  }

  /**
   * Search across libraries
   */
  async searchLibraries(teamId: string, query: string, type?: 'component' | 'color' | 'typography'): Promise<MCPResponse> {
    try {
      // Get all shared libraries first
      const librariesResult = await this.getSharedLibraries(teamId);
      
      if (librariesResult.isError) {
        return librariesResult;
      }
      
      const libraries = JSON.parse((librariesResult.content[0] as any).text)?.items || [];
      const pattern = new RegExp(query, 'i');
      const matches: Array<{
        libraryId: string;
        libraryName: string;
        type: string;
        id: string;
        name: string;
      }> = [];
      
      // Search in each library
      for (const lib of libraries) {
        const fileResponse = await this.post<unknown>(
          '/rpc/command/get-file',
          { id: lib.id },
          false
        );
        
        const fileData = this.normalizeTransitResponse(fileResponse) as any;
        const data = fileData?.data || {};
        
        // Search components
        if (!type || type === 'component') {
          for (const [id, comp] of Object.entries(data.componentsIndex || {})) {
            const c = comp as LibraryComponent;
            if (pattern.test(c.name || '')) {
              matches.push({
                libraryId: lib.id,
                libraryName: lib.name,
                type: 'component',
                id,
                name: c.name,
              });
            }
          }
        }
        
        // Search colors
        if (!type || type === 'color') {
          for (const [id, color] of Object.entries(data.colorsIndex || {})) {
            const c = color as LibraryColor;
            if (pattern.test(c.name || '')) {
              matches.push({
                libraryId: lib.id,
                libraryName: lib.name,
                type: 'color',
                id,
                name: c.name,
              });
            }
          }
        }
        
        // Search typographies
        if (!type || type === 'typography') {
          for (const [id, typo] of Object.entries(data.typographiesIndex || {})) {
            const t = typo as LibraryTypography;
            if (pattern.test(t.name || '')) {
              matches.push({
                libraryId: lib.id,
                libraryName: lib.name,
                type: 'typography',
                id,
                name: t.name,
              });
            }
          }
        }
      }
      
      return ResponseFormatter.formatList(matches, 'search_result', {
        query,
        type: type || 'all',
        total: matches.length,
      });
    } catch (error) {
      logger.error('Failed to search libraries', error);
      return ErrorHandler.handle(error, 'searchLibraries');
    }
  }
}
