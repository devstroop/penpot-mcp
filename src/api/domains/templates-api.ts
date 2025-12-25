import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  category?: string;
}

/**
 * Templates API Client - Access and clone builtin templates
 * ISSUE-017: Templates
 *
 * Note: Template functionality in Penpot is primarily designed for self-hosted instances.
 * The SaaS version (design.penpot.app) may have limited template support via API.
 * Templates are loaded from server configuration files, not a database.
 */
export class TemplatesAPIClient extends BaseAPIClient {
  /**
   * Get all builtin templates
   *
   * Note: This endpoint returns templates configured on the server.
   * On SaaS instances, this may return an empty list or require special access.
   */
  async getBuiltinTemplates(): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-builtin-templates', {}, true);

      const data = this.normalizeTransitResponse(response);
      const templates = Array.isArray(data) ? data : [];

      return ResponseFormatter.formatList(templates, 'template', {
        total: templates.length,
        note:
          templates.length === 0
            ? 'No templates available. Templates are configured per-server and may not be available on all Penpot instances.'
            : undefined,
      });
    } catch (error) {
      logger.error('Failed to get templates', error);

      // Return informative message if endpoint is not available
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('404') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('CloudFlare')
      ) {
        return ResponseFormatter.formatSuccess(
          {
            templates: [],
            note: 'Builtin templates are not available on this Penpot instance. Templates are a server-side feature primarily used in self-hosted deployments.',
          },
          'Templates info'
        );
      }

      return ErrorHandler.handle(error, 'getBuiltinTemplates');
    }
  }

  /**
   * Clone a template to a project
   *
   * This creates a copy of a builtin template in the specified project.
   * Note: Template IDs are strings (not UUIDs) as they reference server config.
   */
  async cloneTemplate(projectId: string, templateId: string): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:project-id': `~u${projectId}`,
        '~:template-id': templateId, // Template ID is a string, not UUID
      };

      const response = await this.post<unknown>('/rpc/command/clone-template', payload, true);

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, 'Template cloned successfully');
    } catch (error) {
      logger.error('Failed to clone template', error);

      // Return informative message if cloning fails
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return ResponseFormatter.formatSuccess(
          {
            success: false,
            note: 'Template not found or cloning not available. Ensure the template ID is valid and templates are configured on this Penpot instance.',
          },
          'Clone template info'
        );
      }

      return ErrorHandler.handle(error, 'cloneTemplate');
    }
  }
}
