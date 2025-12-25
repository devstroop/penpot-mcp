import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';
import FormData from 'form-data';

export interface FontVariant {
  id: string;
  fontId: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  teamId: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface Font {
  id: string;
  name: string;
  family: string;
  teamId: string;
  variants: FontVariant[];
  createdAt?: string;
  modifiedAt?: string;
}

/**
 * Font API Client - Team font management (ISSUE-014)
 * Handles custom font upload, listing, and deletion
 *
 * Note: Font management requires team edition permissions.
 * The Penpot API uses 'get-font-variants' to retrieve fonts.
 */
export class FontAPIClient extends BaseAPIClient {
  /**
   * Get all font variants for a team
   * Uses the get-font-variants endpoint with team-id parameter
   */
  async getTeamFonts(teamId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
      };

      // Penpot uses get-font-variants, not get-team-fonts
      const response = await this.post<unknown>('/rpc/command/get-font-variants', payload, true);

      const fonts = this.normalizeTransitResponse(response);

      // Format fonts for better readability
      const formattedFonts = Array.isArray(fonts)
        ? fonts.map((f) => this.formatFont(f as Record<string, unknown>))
        : fonts;

      return ResponseFormatter.formatSuccess(
        { fonts: formattedFonts, count: Array.isArray(formattedFonts) ? formattedFonts.length : 0 },
        'Team fonts retrieved'
      );
    } catch (error) {
      logger.error('Failed to get team fonts', error);

      // Handle CloudFlare or permission errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('CloudFlare') || errorMessage.includes('403')) {
        return ResponseFormatter.formatSuccess(
          {
            fonts: [],
            note: 'Font management requires authentication with proper permissions. Ensure your access token has team edition permissions.',
          },
          'Font access info'
        );
      }

      return ErrorHandler.handle(error, 'getTeamFonts');
    }
  }

  /**
   * Upload a font file to a team
   * Supports .ttf, .otf, .woff, .woff2 formats
   */
  async uploadFont(
    teamId: string,
    options: {
      fontFamily: string;
      fontWeight?: string;
      fontStyle?: string;
      fontData: Buffer;
      filename: string;
    }
  ): Promise<MCPResponse> {
    try {
      const { fontFamily, fontWeight = '400', fontStyle = 'normal', fontData, filename } = options;

      // Determine MIME type from filename
      const ext = filename.toLowerCase().split('.').pop();
      const mimeTypes: Record<string, string> = {
        ttf: 'font/ttf',
        otf: 'font/otf',
        woff: 'font/woff',
        woff2: 'font/woff2',
      };
      const mimeType = mimeTypes[ext || ''] || 'application/octet-stream';

      // Create form data
      const formData = new FormData();
      formData.append('team-id', teamId);
      formData.append('font-family', fontFamily);
      formData.append('font-weight', fontWeight);
      formData.append('font-style', fontStyle);
      formData.append('data', fontData, {
        filename: filename,
        contentType: mimeType,
      });

      const response = await this.postNodeFormData<unknown>(
        '/rpc/command/create-font-variant',
        formData
      );

      const result = this.normalizeTransitResponse(response) as Record<string, unknown>;

      return ResponseFormatter.formatSuccess(
        this.formatFont(result),
        `Font "${fontFamily}" (${fontWeight} ${fontStyle}) uploaded`
      );
    } catch (error) {
      logger.error('Failed to upload font', error);
      return ErrorHandler.handle(error, 'uploadFont');
    }
  }

  /**
   * Upload a font from base64 data
   */
  async uploadFontBase64(
    teamId: string,
    options: {
      fontFamily: string;
      fontWeight?: string;
      fontStyle?: string;
      base64Data: string;
      filename: string;
    }
  ): Promise<MCPResponse> {
    const { base64Data, ...rest } = options;

    // Convert base64 to buffer
    const fontData = Buffer.from(base64Data, 'base64');

    return this.uploadFont(teamId, { ...rest, fontData });
  }

  /**
   * Delete a font from a team
   */
  async deleteFont(teamId: string, fontId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
        '~:id': `~u${fontId}`,
      };

      await this.post<unknown>('/rpc/command/delete-font', payload, true);

      return ResponseFormatter.formatSuccess({ deleted: true, fontId }, 'Font deleted');
    } catch (error) {
      logger.error('Failed to delete font', error);
      return ErrorHandler.handle(error, 'deleteFont');
    }
  }

  /**
   * Delete a specific font variant
   */
  async deleteFontVariant(teamId: string, fontVariantId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:team-id': `~u${teamId}`,
        '~:id': `~u${fontVariantId}`,
      };

      await this.post<unknown>('/rpc/command/delete-font-variant', payload, true);

      return ResponseFormatter.formatSuccess(
        { deleted: true, fontVariantId },
        'Font variant deleted'
      );
    } catch (error) {
      logger.error('Failed to delete font variant', error);
      return ErrorHandler.handle(error, 'deleteFontVariant');
    }
  }

  /**
   * Format font object for consistent output
   */
  private formatFont(font: Record<string, unknown>): Record<string, unknown> {
    return {
      id: font['id'] || font['~:id'],
      fontId: font['font-id'] || font['~:font-id'],
      fontFamily: font['font-family'] || font['~:font-family'],
      fontWeight: font['font-weight'] || font['~:font-weight'],
      fontStyle: font['font-style'] || font['~:font-style'],
      teamId: font['team-id'] || font['~:team-id'],
      name: font['name'] || font['~:name'],
      variants: font['variants'] || font['~:variants'],
      createdAt: font['created-at'] || font['~:created-at'],
      modifiedAt: font['modified-at'] || font['~:modified-at'],
    };
  }
}
