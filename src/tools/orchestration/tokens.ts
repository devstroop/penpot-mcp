/**
 * Tokens Tool - Comprehensive design token management
 */

import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { TokensParams } from './types.js';
import { logger } from '../../logger.js';

export class TokensTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: TokensParams): Promise<MCPResponse> {
    const { action, fileId } = params;
    const client = this.clientFactory.createClient();

    logger.debug('TokensTool executing', { action, fileId });

    switch (action) {
      // Color operations
      case 'colors':
        return client.tokens.getColors(fileId);

      case 'color_get':
        if (!params.colorId) {
          return ResponseFormatter.formatError('colorId is required for color_get action');
        }
        return client.tokens.getColor(fileId, params.colorId);

      case 'color_create':
        if (!params.name || !params.color) {
          return ResponseFormatter.formatError('name and color are required for color_create action');
        }
        return client.tokens.createColor(fileId, params.name, params.color, params.opacity);

      case 'color_update':
        if (!params.colorId) {
          return ResponseFormatter.formatError('colorId is required for color_update action');
        }
        return client.tokens.updateColor(fileId, params.colorId, {
          name: params.name,
          color: params.color,
          opacity: params.opacity,
        });

      case 'color_delete':
        if (!params.colorId) {
          return ResponseFormatter.formatError('colorId is required for color_delete action');
        }
        return client.tokens.deleteColor(fileId, params.colorId);

      // Typography operations
      case 'typography':
        return client.tokens.getTypography(fileId);

      case 'typography_get':
        if (!params.typographyId) {
          return ResponseFormatter.formatError('typographyId is required for typography_get action');
        }
        // Get all typography and filter by ID
        const allTypo = await client.tokens.getTypography(fileId);
        if (allTypo.isError) return allTypo;
        // For now return the full list - specific get would need enhancement
        return allTypo;

      case 'typography_create':
        if (!params.name) {
          return ResponseFormatter.formatError('name is required for typography_create action');
        }
        return client.tokens.createTypography(fileId, params.name, {
          fontFamily: params.fontFamily,
          fontSize: params.fontSize,
          fontWeight: params.fontWeight,
          lineHeight: params.lineHeight,
        });

      case 'typography_update':
        if (!params.typographyId) {
          return ResponseFormatter.formatError('typographyId is required for typography_update action');
        }
        return ResponseFormatter.formatError('typography_update not yet implemented - use typography_create instead');

      case 'typography_delete':
        if (!params.typographyId) {
          return ResponseFormatter.formatError('typographyId is required for typography_delete action');
        }
        return ResponseFormatter.formatError('typography_delete not yet implemented');

      // All tokens
      case 'all':
        return client.tokens.getAllTokens(fileId);

      // Search
      case 'search':
        if (!params.query) {
          return ResponseFormatter.formatError('query is required for search action');
        }
        return client.tokens.searchTokens(fileId, params.query);

      // Export operations
      case 'export_css':
        return client.tokens.exportTokensCSS(fileId);

      case 'export_json':
        return client.tokens.exportTokensJSON(fileId);

      case 'export_scss':
        return client.tokens.exportTokensSCSS(fileId);

      case 'export_tailwind':
        return client.tokens.exportTokensTailwind(fileId);

      // Statistics
      case 'stats':
        return client.tokens.getTokenStats(fileId);

      default:
        return ResponseFormatter.formatError(
          `Unknown action: ${action}. Use: colors, color_get, color_create, color_update, color_delete, typography, typography_get, typography_create, typography_update, typography_delete, all, search, export_css, export_json, export_scss, export_tailwind, stats`
        );
    }
  }
}
