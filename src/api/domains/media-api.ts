import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';
import FormData from 'form-data';
import axios from 'axios';

/**
 * Media API Client
 * Handles image/media upload and management in Penpot files
 *
 * ISSUE-001: Image/Media Upload Support
 */
export class MediaAPIClient extends BaseAPIClient {
  /**
   * Upload an image from a URL to a Penpot file
   * Uses: /rpc/command/create-file-media-object-from-url
   */
  async uploadFromUrl(fileId: string, url: string, name?: string): Promise<MCPResponse> {
    try {
      await this.ensureAuthenticated();

      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:is-local': true,
        '~:url': url,
        '~:name': name || this.extractFilename(url) || 'image',
      };

      logger.file('debug', 'Uploading media from URL', { fileId, url, name });

      const response = await this.postTransit<unknown>(
        '/rpc/command/create-file-media-object-from-url',
        payload
      );

      const result = this.normalizeTransitResponse(response) as Record<string, unknown>;

      return ResponseFormatter.formatSuccess(
        {
          id: result['id'],
          name: result['name'],
          width: result['width'],
          height: result['height'],
          mtype: result['mtype'],
        },
        `Image uploaded from URL: ${url}`
      );
    } catch (error) {
      logger.file('error', 'Failed to upload media from URL', { fileId, url, error });
      return ErrorHandler.handle(error, 'uploadFromUrl');
    }
  }

  /**
   * Upload a local image file to a Penpot file
   * Uses: /rpc/command/upload-file-media-object (multipart)
   */
  async uploadFile(
    fileId: string,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string = 'image/png'
  ): Promise<MCPResponse> {
    try {
      await this.ensureAuthenticated();

      const formData = new FormData();
      formData.append('file-id', fileId);
      formData.append('is-local', 'true');
      formData.append('name', filename);
      formData.append('content', fileBuffer, {
        filename: filename,
        contentType: mimeType,
      });

      logger.file('debug', 'Uploading media file', { fileId, filename, size: fileBuffer.length });

      const response = await axios.post(
        `${this.config.baseURL}/rpc/command/upload-file-media-object`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Cookie: `auth-token=${this.getAuthToken()}`,
          },
        }
      );

      const result = this.normalizeTransitResponse(response.data) as Record<string, unknown>;

      return ResponseFormatter.formatSuccess(
        {
          id: result['id'],
          name: result['name'],
          width: result['width'],
          height: result['height'],
          mtype: result['mtype'],
        },
        `Image file uploaded: ${filename}`
      );
    } catch (error) {
      logger.file('error', 'Failed to upload media file', { fileId, filename, error });
      return ErrorHandler.handle(error, 'uploadFile');
    }
  }

  /**
   * Upload an image from base64 data
   */
  async uploadFromBase64(
    fileId: string,
    base64Data: string,
    filename: string,
    mimeType: string = 'image/png'
  ): Promise<MCPResponse> {
    try {
      // Remove data URL prefix if present
      const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      return this.uploadFile(fileId, buffer, filename, mimeType);
    } catch (error) {
      logger.file('error', 'Failed to upload from base64', { fileId, filename, error });
      return ErrorHandler.handle(error, 'uploadFromBase64');
    }
  }

  /**
   * Get media objects in a file
   */
  async listMedia(fileId: string): Promise<MCPResponse> {
    try {
      await this.ensureAuthenticated();

      // Get file details which includes media
      const response = await this.post<unknown>('/rpc/command/get-file', { id: fileId }, false);

      const data = this.normalizeTransitResponse(response) as Record<string, unknown>;
      const media = data['media'] || {};

      const mediaList = Object.entries(media).map(([id, item]) => ({
        id,
        ...(item as Record<string, unknown>),
      }));

      return ResponseFormatter.formatSuccess(
        { media: mediaList, count: mediaList.length },
        `Found ${mediaList.length} media object(s)`
      );
    } catch (error) {
      logger.file('error', 'Failed to list media', { fileId, error });
      return ErrorHandler.handle(error, 'listMedia');
    }
  }

  /**
   * Delete a media object from a file
   */
  async deleteMedia(fileId: string, mediaId: string): Promise<MCPResponse> {
    try {
      await this.ensureAuthenticated();

      const payload = {
        '~:file-id': `~u${fileId}`,
        '~:object-id': `~u${mediaId}`,
      };

      await this.postTransit<unknown>('/rpc/command/delete-file-media-object', payload);

      return ResponseFormatter.formatSuccess(
        { deleted: mediaId },
        `Media object deleted: ${mediaId}`
      );
    } catch (error) {
      logger.file('error', 'Failed to delete media', { fileId, mediaId, error });
      return ErrorHandler.handle(error, 'deleteMedia');
    }
  }

  /**
   * Helper: Extract filename from URL
   */
  private extractFilename(url: string): string | null {
    try {
      const pathname = new URL(url).pathname;
      const segments = pathname.split('/');
      const filename = segments[segments.length - 1];
      return filename || null;
    } catch {
      return null;
    }
  }
}
