import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { FontsParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Fonts Tool - Manage team fonts (ISSUE-014)
 */
export class FontsTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: FontsParams): Promise<MCPResponse> {
    const { action, teamId } = params;
    const client = this.clientFactory.createClient();

    logger.debug('FontsTool executing', { action, params });

    if (!teamId) {
      return ResponseFormatter.formatError('teamId is required for fonts operations');
    }

    switch (action) {
      case 'list':
        return client.fonts.getTeamFonts(teamId);

      case 'upload':
        if (!params.fontFamily) {
          return ResponseFormatter.formatError('fontFamily is required for upload action');
        }
        if (!params.base64Data && !params.fontData) {
          return ResponseFormatter.formatError(
            'base64Data or fontData is required for upload action'
          );
        }
        if (!params.filename) {
          return ResponseFormatter.formatError('filename is required for upload action');
        }

        if (params.base64Data) {
          return client.fonts.uploadFontBase64(teamId, {
            fontFamily: params.fontFamily,
            fontWeight: params.fontWeight,
            fontStyle: params.fontStyle,
            base64Data: params.base64Data,
            filename: params.filename,
          });
        } else if (params.fontData) {
          return client.fonts.uploadFont(teamId, {
            fontFamily: params.fontFamily,
            fontWeight: params.fontWeight,
            fontStyle: params.fontStyle,
            fontData: Buffer.from(params.fontData),
            filename: params.filename,
          });
        }
        return ResponseFormatter.formatError('Font data is required');

      case 'delete':
        if (!params.fontId) {
          return ResponseFormatter.formatError('fontId is required for delete action');
        }
        return client.fonts.deleteFont(teamId, params.fontId);

      case 'delete_variant':
        if (!params.fontVariantId) {
          return ResponseFormatter.formatError(
            'fontVariantId is required for delete_variant action'
          );
        }
        return client.fonts.deleteFontVariant(teamId, params.fontVariantId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
