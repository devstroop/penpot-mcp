import axios, { AxiosError } from 'axios';
import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'jpeg' | 'webp';
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';

// Error messages for storage-related issues
const STORAGE_ERROR_MESSAGES = {
  NO_STORAGE: 'Asset export is not available. S3/Minio storage is not configured on the server.',
  STORAGE_UNAVAILABLE:
    'Asset storage is temporarily unavailable. Please check server storage configuration.',
  EXPORT_FAILED: 'Export failed. This may be due to missing storage configuration (S3/Minio).',
};

export interface ExportParams {
  fileId: string;
  pageId: string;
  objectId: string;
  format?: ExportFormat;
  scale?: number;
  quality?: number;
}

export interface BatchExportParams {
  fileId: string;
  pageId: string;
  objectIds: string[];
  format?: ExportFormat;
  scale?: number;
  quality?: number;
}

export interface PageExportParams {
  fileId: string;
  pageId: string;
  format?: ExportFormat;
  scale?: number;
  includeBackground?: boolean;
}

export interface ExportResult {
  objectId: string;
  resourceId?: string;
  format: string;
  scale: number;
  contentType?: string;
  data?: string;
  size?: number;
  error?: string;
}

/**
 * Exports API Client - Full asset export operations
 * Handles PNG, SVG, PDF, JPEG, WebP exports with batch support
 */
export class ExportsAPIClient extends BaseAPIClient {
  /**
   * Check if an error is related to storage/assets not being available
   */
  private isStorageError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data = error.response?.data;
      const message = typeof data === 'string' ? data : JSON.stringify(data || '');

      // Common storage-related error indicators
      if (status === 500 || status === 502 || status === 503) {
        if (
          message.includes('storage') ||
          message.includes('s3') ||
          message.includes('minio') ||
          message.includes('asset') ||
          message.includes('resource') ||
          message.includes('bucket')
        ) {
          return true;
        }
      }

      // Connection refused to storage backend
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return true;
      }
    }

    const errorMessage = String(error).toLowerCase();
    return (
      errorMessage.includes('storage') ||
      errorMessage.includes('s3') ||
      errorMessage.includes('minio') ||
      errorMessage.includes('bucket')
    );
  }

  /**
   * Format a storage-related error with helpful message
   */
  private formatStorageError(operation: string, originalError?: unknown): MCPResponse {
    const details = originalError ? ` Details: ${String(originalError)}` : '';
    return ResponseFormatter.formatError(
      `${STORAGE_ERROR_MESSAGES.NO_STORAGE} Operation: ${operation}.${details}`
    );
  }

  /**
   * Fetch profile ID by calling the profile endpoint
   */
  private async fetchProfileId(): Promise<string | null> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-profile', {}, false);
      const data = this.normalizeTransitResponse(response) as { id?: string };
      return data.id || null;
    } catch (error) {
      logger.error('Failed to fetch profile ID', error);
      return null;
    }
  }

  /**
   * Create an export job and get the resource
   */
  async exportObject(params: ExportParams): Promise<MCPResponse> {
    const { fileId, pageId, objectId, format = 'png', scale = 1 } = params;

    try {
      await this.ensureAuthenticated();

      let profileId = this.getProfileId();
      if (!profileId) {
        // Try to fetch profile ID from API
        profileId = await this.fetchProfileId();
        if (!profileId) {
          return ResponseFormatter.formatError(
            'Profile ID not available. Please authenticate first.'
          );
        }
      }

      const authToken = this.getAuthToken();
      if (!authToken) {
        return ResponseFormatter.formatError(
          'Auth token not available. Please authenticate first.'
        );
      }

      // Create export job
      const exportUrl = `${this.config.baseURL}/export`;

      const payload = {
        '~:wait': true,
        '~:exports': [
          {
            '~:type': `~:${format}`,
            '~:suffix': '',
            '~:scale': scale,
            '~:page-id': `~u${pageId}`,
            '~:file-id': `~u${fileId}`,
            '~:name': '',
            '~:object-id': `~u${objectId}`,
          },
        ],
        '~:profile-id': `~u${profileId}`,
        '~:cmd': '~:export-shapes',
      };

      logger.debug('Creating export', { fileId, pageId, objectId, format, scale });

      const exportResponse = await axios.post(exportUrl, payload, {
        headers: {
          'Content-Type': 'application/transit+json',
          Accept: 'application/transit+json',
          Cookie: `auth-token=${authToken}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      const exportData = exportResponse.data;
      const resourceId = exportData['~:id'];

      if (!resourceId) {
        return ResponseFormatter.formatError('Export failed: Resource ID not returned');
      }

      // Get the resource URL
      const resourcePayload = {
        '~:wait': false,
        '~:cmd': '~:get-resource',
        '~:id': resourceId,
      };

      const resourceResponse = await axios.post(exportUrl, resourcePayload, {
        headers: {
          'Content-Type': 'application/transit+json',
          Accept: '*/*',
          Cookie: `auth-token=${authToken}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        responseType: 'arraybuffer',
      });

      // Convert to base64 for JSON transport
      const contentType = resourceResponse.headers['content-type'] || `image/${format}`;
      const base64Data = Buffer.from(resourceResponse.data).toString('base64');

      return ResponseFormatter.formatSuccess(
        {
          resourceId,
          objectId,
          format,
          scale,
          contentType,
          data: base64Data,
          size: resourceResponse.data.length,
        },
        `Exported ${format} (${resourceResponse.data.length} bytes)`
      );
    } catch (error) {
      // Check if this is a storage-related error
      if (this.isStorageError(error)) {
        return this.formatStorageError(`exportObject(${objectId})`, error);
      }
      return ErrorHandler.handle(error, `exportObject(${fileId}, ${pageId}, ${objectId})`);
    }
  }

  /**
   * Batch export multiple objects
   */
  async batchExport(params: BatchExportParams): Promise<MCPResponse> {
    const { fileId, pageId, objectIds, format = 'png', scale = 1 } = params;

    try {
      await this.ensureAuthenticated();

      let profileId = this.getProfileId();
      if (!profileId) {
        // Try to fetch profile ID from API
        profileId = await this.fetchProfileId();
        if (!profileId) {
          return ResponseFormatter.formatError(
            'Profile ID not available. Please authenticate first.'
          );
        }
      }

      const authToken = this.getAuthToken();
      if (!authToken) {
        return ResponseFormatter.formatError(
          'Auth token not available. Please authenticate first.'
        );
      }

      const results: ExportResult[] = [];
      const exportUrl = `${this.config.baseURL}/export`;

      // Create batch export payload
      const exports = objectIds.map((objectId) => ({
        '~:type': `~:${format}`,
        '~:suffix': '',
        '~:scale': scale,
        '~:page-id': `~u${pageId}`,
        '~:file-id': `~u${fileId}`,
        '~:name': '',
        '~:object-id': `~u${objectId}`,
      }));

      const payload = {
        '~:wait': true,
        '~:exports': exports,
        '~:profile-id': `~u${profileId}`,
        '~:cmd': '~:export-shapes',
      };

      logger.debug('Creating batch export', {
        fileId,
        pageId,
        objectCount: objectIds.length,
        format,
        scale,
      });

      try {
        const exportResponse = await axios.post(exportUrl, payload, {
          headers: {
            'Content-Type': 'application/transit+json',
            Accept: 'application/transit+json',
            Cookie: `auth-token=${authToken}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
        });

        const exportData = exportResponse.data;
        const resourceId = exportData['~:id'];

        if (resourceId) {
          // Single combined export (ZIP or similar)
          results.push({
            objectId: 'batch',
            resourceId,
            format,
            scale,
          });
        }
      } catch {
        // Fallback to individual exports if batch fails
        for (const objectId of objectIds) {
          try {
            const singleResult = await this.exportObject({
              fileId,
              pageId,
              objectId,
              format,
              scale,
            });

            if (!singleResult.isError) {
              const data = JSON.parse((singleResult.content[0] as any).text);
              results.push({
                objectId,
                resourceId: data.resourceId,
                format,
                scale,
                size: data.size,
              });
            } else {
              results.push({
                objectId,
                format,
                scale,
                error: 'Export failed',
              });
            }
          } catch (err) {
            results.push({
              objectId,
              format,
              scale,
              error: String(err),
            });
          }
        }
      }

      const successful = results.filter((r) => !r.error).length;
      const failed = results.filter((r) => r.error).length;

      return ResponseFormatter.formatSuccess(
        {
          results,
          summary: {
            total: objectIds.length,
            successful,
            failed,
            format,
            scale,
          },
        },
        `Batch export: ${successful} successful, ${failed} failed`
      );
    } catch (error) {
      if (this.isStorageError(error)) {
        return this.formatStorageError(`batchExport`, error);
      }
      return ErrorHandler.handle(error, `batchExport(${fileId}, ${pageId})`);
    }
  }

  /**
   * Export entire page
   */
  async exportPage(params: PageExportParams): Promise<MCPResponse> {
    const { fileId, pageId, format = 'pdf', scale = 1 } = params;

    try {
      await this.ensureAuthenticated();

      const profileId = this.getProfileId();
      if (!profileId) {
        return ResponseFormatter.formatError(
          'Profile ID not available. Please authenticate first.'
        );
      }

      const authToken = this.getAuthToken();
      if (!authToken) {
        return ResponseFormatter.formatError(
          'Auth token not available. Please authenticate first.'
        );
      }

      // Get page root frame
      const fileResponse = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(fileResponse) as {
        data?: {
          pagesIndex?: Record<string, { id?: string; objects?: Record<string, unknown> }>;
        };
      };

      const page = fileData.data?.pagesIndex?.[pageId];
      if (!page) {
        return ResponseFormatter.formatError(`Page not found: ${pageId}`);
      }

      // Find root frame (uuid-00000000-0000-0000-0000-000000000000 pattern)
      const rootFrame = Object.entries(page.objects || {}).find(([_id, obj]) => {
        const o = obj as Record<string, unknown>;
        return o['type'] === 'frame' && !o['parentId'];
      });

      if (!rootFrame) {
        return ResponseFormatter.formatError('No root frame found in page');
      }

      // Export the root frame
      return this.exportObject({
        fileId,
        pageId,
        objectId: rootFrame[0],
        format,
        scale,
      });
    } catch (error) {
      if (this.isStorageError(error)) {
        return this.formatStorageError(`exportPage`, error);
      }
      return ErrorHandler.handle(error, `exportPage(${fileId}, ${pageId})`);
    }
  }

  /**
   * Export multiple pages as PDF
   */
  async exportFileAsPdf(fileId: string, pageIds?: string[]): Promise<MCPResponse> {
    try {
      await this.ensureAuthenticated();

      const profileId = this.getProfileId();
      if (!profileId) {
        return ResponseFormatter.formatError(
          'Profile ID not available. Please authenticate first.'
        );
      }

      // Get file pages
      const fileResponse = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(fileResponse) as {
        data?: {
          pages?: string[];
        };
      };

      const allPageIds = pageIds || fileData.data?.pages || [];

      if (allPageIds.length === 0) {
        return ResponseFormatter.formatError('No pages found in file');
      }

      // Export pages as PDF
      const results: ExportResult[] = [];
      for (const pid of allPageIds) {
        const pageResult = await this.exportPage({
          fileId,
          pageId: pid,
          format: 'pdf',
          scale: 1,
        });

        if (!pageResult.isError) {
          const data = JSON.parse((pageResult.content[0] as any).text);
          results.push({
            objectId: pid,
            resourceId: data.resourceId,
            format: 'pdf',
            scale: 1,
            size: data.size,
          });
        } else {
          results.push({
            objectId: pid,
            format: 'pdf',
            scale: 1,
            error: 'Page export failed',
          });
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          results,
          summary: {
            totalPages: allPageIds.length,
            exported: results.filter((r) => !r.error).length,
          },
        },
        `Exported ${results.filter((r) => !r.error).length} pages as PDF`
      );
    } catch (error) {
      if (this.isStorageError(error)) {
        return this.formatStorageError(`exportFileAsPdf`, error);
      }
      return ErrorHandler.handle(error, `exportFileAsPdf(${fileId})`);
    }
  }

  /**
   * Get export URL without downloading the data
   */
  async getExportUrl(params: ExportParams): Promise<MCPResponse> {
    const { fileId, pageId, objectId, format = 'png', scale = 1 } = params;

    try {
      await this.ensureAuthenticated();

      const profileId = this.getProfileId();
      if (!profileId) {
        return ResponseFormatter.formatError(
          'Profile ID not available. Please authenticate first.'
        );
      }

      const authToken = this.getAuthToken();
      if (!authToken) {
        return ResponseFormatter.formatError(
          'Auth token not available. Please authenticate first.'
        );
      }

      // Create export job
      const exportUrl = `${this.config.baseURL}/export`;

      const payload = {
        '~:wait': true,
        '~:exports': [
          {
            '~:type': `~:${format}`,
            '~:suffix': '',
            '~:scale': scale,
            '~:page-id': `~u${pageId}`,
            '~:file-id': `~u${fileId}`,
            '~:name': '',
            '~:object-id': `~u${objectId}`,
          },
        ],
        '~:profile-id': `~u${profileId}`,
        '~:cmd': '~:export-shapes',
      };

      const exportResponse = await axios.post(exportUrl, payload, {
        headers: {
          'Content-Type': 'application/transit+json',
          Accept: 'application/transit+json',
          Cookie: `auth-token=${authToken}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      const exportData = exportResponse.data;
      const resourceId = exportData['~:id'];

      if (!resourceId) {
        return ResponseFormatter.formatError('Export failed: Resource ID not returned');
      }

      return ResponseFormatter.formatSuccess(
        {
          resourceId,
          format,
          scale,
          exportUrl,
          note: 'Use the resourceId to download the exported asset',
        },
        `Export created: ${resourceId}`
      );
    } catch (error) {
      if (this.isStorageError(error)) {
        return this.formatStorageError(`getExportUrl`, error);
      }
      return ErrorHandler.handle(error, `getExportUrl(${fileId}, ${pageId}, ${objectId})`);
    }
  }

  /**
   * Export with multiple scales (1x, 2x, 3x, etc.)
   */
  async exportMultiScale(params: ExportParams, scales: number[] = [1, 2, 3]): Promise<MCPResponse> {
    const { fileId, pageId, objectId, format = 'png' } = params;

    try {
      const results: ExportResult[] = [];

      for (const scale of scales) {
        const result = await this.exportObject({
          fileId,
          pageId,
          objectId,
          format,
          scale,
        });

        if (!result.isError) {
          const data = JSON.parse((result.content[0] as any).text);
          results.push({
            objectId,
            resourceId: data.resourceId,
            format,
            scale,
            size: data.size,
          });
        } else {
          results.push({
            objectId,
            format,
            scale,
            error: 'Export failed',
          });
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          objectId,
          results,
          scales,
        },
        `Exported at ${scales.length} scales`
      );
    } catch (error) {
      return ErrorHandler.handle(error, `exportMultiScale(${fileId}, ${pageId}, ${objectId})`);
    }
  }

  /**
   * Export with multiple formats
   */
  async exportMultiFormat(
    params: ExportParams,
    formats: ExportFormat[] = ['png', 'svg']
  ): Promise<MCPResponse> {
    const { fileId, pageId, objectId, scale = 1 } = params;

    try {
      const results: ExportResult[] = [];

      for (const format of formats) {
        const result = await this.exportObject({
          fileId,
          pageId,
          objectId,
          format,
          scale,
        });

        if (!result.isError) {
          const data = JSON.parse((result.content[0] as any).text);
          results.push({
            objectId,
            resourceId: data.resourceId,
            format,
            scale,
            size: data.size,
          });
        } else {
          results.push({
            objectId,
            format,
            scale,
            error: 'Export failed',
          });
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          objectId,
          results,
          formats,
        },
        `Exported in ${formats.length} formats`
      );
    } catch (error) {
      return ErrorHandler.handle(error, `exportMultiFormat(${fileId}, ${pageId}, ${objectId})`);
    }
  }

  /**
   * List exportable objects in a page
   */
  async listExportableObjects(fileId: string, pageId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as {
        data?: {
          pagesIndex?: Record<string, { objects?: Record<string, unknown> }>;
        };
      };

      const page = fileData.data?.pagesIndex?.[pageId];
      if (!page) {
        return ResponseFormatter.formatError(`Page not found: ${pageId}`);
      }

      // Filter for exportable objects (frames, groups, components, etc.)
      const exportableTypes = [
        'frame',
        'group',
        'rect',
        'circle',
        'path',
        'text',
        'image',
        'svg-raw',
        'bool',
      ];

      const objects = Object.entries(page.objects || {})
        .filter(([, obj]) => {
          const type = (obj as Record<string, unknown>)['type'] as string;
          return exportableTypes.includes(type?.toLowerCase());
        })
        .map(([id, obj]) => {
          const o = obj as Record<string, unknown>;
          return {
            id,
            name: o['name'],
            type: o['type'],
            width: o['width'],
            height: o['height'],
            hasExportSettings: !!(o['exports'] && (o['exports'] as unknown[]).length > 0),
          };
        });

      return ResponseFormatter.formatList(objects, 'exportableObject', {
        total: objects.length,
        pageId,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `listExportableObjects(${fileId}, ${pageId})`);
    }
  }

  /**
   * Get export presets/settings for an object
   */
  async getExportSettings(fileId: string, pageId: string, objectId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const fileData = this.normalizeTransitResponse(response) as {
        data?: {
          pagesIndex?: Record<string, { objects?: Record<string, unknown> }>;
        };
      };

      const page = fileData.data?.pagesIndex?.[pageId];
      if (!page) {
        return ResponseFormatter.formatError(`Page not found: ${pageId}`);
      }

      const object = page.objects?.[objectId] as Record<string, unknown> | undefined;
      if (!object) {
        return ResponseFormatter.formatError(`Object not found: ${objectId}`);
      }

      const exports = object['exports'] || [];

      return ResponseFormatter.formatSuccess(
        {
          objectId,
          name: object['name'],
          type: object['type'],
          exports,
          hasSettings: (exports as unknown[]).length > 0,
        },
        `Export settings for ${object['name']}`
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getExportSettings(${fileId}, ${pageId}, ${objectId})`);
    }
  }

  /**
   * Download a previously created export by resource ID
   */
  async downloadExport(resourceId: string): Promise<MCPResponse> {
    try {
      await this.ensureAuthenticated();

      const authToken = this.getAuthToken();
      if (!authToken) {
        return ResponseFormatter.formatError(
          'Auth token not available. Please authenticate first.'
        );
      }

      const exportUrl = `${this.config.baseURL}/export`;

      const resourcePayload = {
        '~:wait': false,
        '~:cmd': '~:get-resource',
        '~:id': resourceId,
      };

      const resourceResponse = await axios.post(exportUrl, resourcePayload, {
        headers: {
          'Content-Type': 'application/transit+json',
          Accept: '*/*',
          Cookie: `auth-token=${authToken}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        responseType: 'arraybuffer',
      });

      const contentType = resourceResponse.headers['content-type'] || 'application/octet-stream';
      const base64Data = Buffer.from(resourceResponse.data).toString('base64');

      return ResponseFormatter.formatSuccess(
        {
          resourceId,
          contentType,
          data: base64Data,
          size: resourceResponse.data.length,
        },
        `Downloaded export (${resourceResponse.data.length} bytes)`
      );
    } catch (error) {
      if (this.isStorageError(error)) {
        return this.formatStorageError(`downloadExport`, error);
      }
      return ErrorHandler.handle(error, `downloadExport(${resourceId})`);
    }
  }

  /**
   * Preview a page or frame - optimized for AI visual feedback
   * ISSUE-003: Visual Preview capability
   *
   * Returns a PNG image that can be displayed or analyzed by vision models.
   * Automatically finds the best frame to preview or exports the entire page.
   */
  async preview(params: {
    fileId: string;
    pageId: string;
    objectId?: string; // Optional specific object to preview
    maxWidth?: number; // Max width for output (default 800)
    maxHeight?: number; // Max height for output (default 600)
    quality?: 'low' | 'medium' | 'high'; // Affects scale
  }): Promise<MCPResponse> {
    const {
      fileId,
      pageId,
      objectId,
      maxWidth = 800,
      maxHeight = 600,
      quality = 'medium',
    } = params;

    try {
      await this.ensureAuthenticated();

      let profileId = this.getProfileId();
      if (!profileId) {
        // Try to fetch profile ID from API
        profileId = await this.fetchProfileId();
        if (!profileId) {
          return ResponseFormatter.formatError(
            'Profile ID not available. Please authenticate first.'
          );
        }
      }

      const authToken = this.getAuthToken();
      if (!authToken) {
        return ResponseFormatter.formatError(
          'Auth token not available. Please authenticate first.'
        );
      }

      // Get file data to find objects
      let fileResponse: unknown;
      try {
        fileResponse = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);
      } catch (fetchError) {
        return ResponseFormatter.formatError(`Failed to fetch file: ${String(fetchError)}`, {
          fileId,
        });
      }

      // Normalize transit response first
      const fileData = this.normalizeTransitResponse(fileResponse) as {
        name?: string;
        data?: {
          pagesIndex?: Record<
            string,
            {
              name?: string;
              objects?: Record<string, unknown>;
            }
          >;
          'pages-index'?: Record<
            string,
            {
              name?: string;
              objects?: Record<string, unknown>;
            }
          >;
        };
      };

      // Try both key formats (the normalizer converts pages-index to pagesIndex)
      const pagesIndex = fileData.data?.pagesIndex || fileData.data?.['pages-index'];
      // The page IDs might still have ~u prefix in the keys
      const page = pagesIndex?.[pageId] || pagesIndex?.[`~u${pageId}`];

      if (!page) {
        const debugInfo = {
          hasData: !!fileData.data,
          dataKeys: fileData.data ? Object.keys(fileData.data).slice(0, 10) : [],
          hasPagesIndex: !!pagesIndex,
          pagesIndexKeys: pagesIndex ? Object.keys(pagesIndex).slice(0, 5) : [],
          requestedPageId: pageId,
        };
        return ResponseFormatter.formatError(`Page not found: ${pageId}`, debugInfo);
      }

      const fileName = fileData.name || 'Untitled';

      // Find the object to preview
      let targetObjectId = objectId;
      let targetObject: Record<string, unknown> | undefined;

      if (objectId) {
        // Use the specified object - try both with and without ~u prefix
        targetObject = (page.objects?.[objectId] || page.objects?.[`~u${objectId}`]) as
          | Record<string, unknown>
          | undefined;
        if (!targetObject) {
          return ResponseFormatter.formatError(`Object not found: ${objectId}`);
        }
      } else {
        // Find the best frame to preview (first frame, or largest)
        const frames = Object.entries(page.objects || {})
          .filter(([, obj]) => {
            const o = obj as Record<string, unknown>;
            return o['type'] === 'frame' && !o['hidden'];
          })
          .map(([id, obj]) => {
            const o = obj as Record<string, unknown>;
            const width = (o['width'] as number) || 0;
            const height = (o['height'] as number) || 0;
            // Remove ~u prefix from id if present
            const cleanId = id.startsWith('~u') ? id.slice(2) : id;
            return { id: cleanId, width, height, area: width * height, obj: o };
          })
          .sort((a, b) => b.area - a.area); // Sort by area, largest first

        if (frames.length > 0) {
          targetObjectId = frames[0].id;
          targetObject = frames[0].obj;
        }
      }

      if (!targetObjectId || !targetObject) {
        return ResponseFormatter.formatError(
          'No suitable object found for preview. Try specifying an objectId.'
        );
      }

      // Calculate scale based on quality and size constraints
      const objWidth = (targetObject['width'] as number) || maxWidth;
      const objHeight = (targetObject['height'] as number) || maxHeight;

      let scale: number;
      switch (quality) {
        case 'low':
          scale = Math.min(0.5, maxWidth / objWidth, maxHeight / objHeight);
          break;
        case 'high':
          scale = Math.min(2, maxWidth / objWidth, maxHeight / objHeight);
          break;
        default: // medium
          scale = Math.min(1, maxWidth / objWidth, maxHeight / objHeight);
      }
      scale = Math.max(0.1, scale); // Ensure minimum scale

      // Export the object
      const exportUrl = `${this.config.baseURL}/export`;

      const payload = {
        '~:wait': true,
        '~:exports': [
          {
            '~:type': '~:png',
            '~:suffix': '',
            '~:scale': scale,
            '~:page-id': `~u${pageId}`,
            '~:file-id': `~u${fileId}`,
            '~:name': '',
            '~:object-id': `~u${targetObjectId}`,
          },
        ],
        '~:profile-id': `~u${profileId}`,
        '~:cmd': '~:export-shapes',
      };

      logger.debug('Creating preview export', { fileId, pageId, targetObjectId, scale, quality });

      const exportResponse = await axios.post(exportUrl, payload, {
        headers: {
          'Content-Type': 'application/transit+json',
          Accept: 'application/transit+json',
          Cookie: `auth-token=${authToken}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      const exportData = exportResponse.data;
      const resourceId = exportData['~:id'];

      if (!resourceId) {
        return ResponseFormatter.formatError(
          'Preview export failed: Resource ID not returned. Storage may not be configured.'
        );
      }

      // Get the actual image data
      const resourcePayload = {
        '~:wait': false,
        '~:cmd': '~:get-resource',
        '~:id': resourceId,
      };

      const resourceResponse = await axios.post(exportUrl, resourcePayload, {
        headers: {
          'Content-Type': 'application/transit+json',
          Accept: '*/*',
          Cookie: `auth-token=${authToken}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        responseType: 'arraybuffer',
      });

      const base64Data = Buffer.from(resourceResponse.data).toString('base64');
      const sizeKB = Math.round(resourceResponse.data.length / 1024);

      // Return preview as an actual displayable image
      return ResponseFormatter.formatImage(base64Data, 'image/png', {
        fileName: fileName,
        pageName: page.name,
        objectId: targetObjectId,
        objectName: targetObject['name'],
        objectType: targetObject['type'],
        originalWidth: objWidth,
        originalHeight: objHeight,
        scale,
        quality,
        outputWidth: Math.round(objWidth * scale),
        outputHeight: Math.round(objHeight * scale),
        size: resourceResponse.data.length,
        sizeKB,
        message: `Preview: ${targetObject['name'] || 'Untitled'} (${sizeKB}KB)`,
      });
    } catch (error) {
      if (this.isStorageError(error)) {
        return this.formatStorageError(`preview`, error);
      }
      return ErrorHandler.handle(error, `preview(${fileId}, ${pageId})`);
    }
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): MCPResponse {
    const formats = [
      {
        format: 'png',
        description: 'Portable Network Graphics - Raster format with transparency',
        scales: [0.5, 1, 2, 3, 4],
      },
      { format: 'svg', description: 'Scalable Vector Graphics - Vector format', scales: [1] },
      { format: 'pdf', description: 'Portable Document Format - Print-ready', scales: [1, 2] },
      { format: 'jpeg', description: 'JPEG Image - Lossy compression', scales: [0.5, 1, 2, 3, 4] },
      { format: 'webp', description: 'WebP Image - Modern web format', scales: [0.5, 1, 2, 3, 4] },
    ];

    return ResponseFormatter.formatList(formats, 'format', {
      total: formats.length,
    });
  }
}
