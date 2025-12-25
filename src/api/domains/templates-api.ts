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
 */
export class TemplatesAPIClient extends BaseAPIClient {
  /**
   * Get all builtin templates
   */
  async getBuiltinTemplates(): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/rpc/command/get-builtin-templates', {}, true);

      const data = this.normalizeTransitResponse(response);
      const templates = Array.isArray(data) ? data : [];

      return ResponseFormatter.formatList(templates, 'template', {
        total: templates.length,
      });
    } catch (error) {
      logger.error('Failed to get templates', error);
      return ErrorHandler.handle(error, 'getBuiltinTemplates');
    }
  }

  /**
   * Clone a template to a project
   */
  async cloneTemplate(projectId: string, templateId: string, name?: string): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:project-id': `~u${projectId}`,
        '~:template-id': `~u${templateId}`,
      };

      if (name) {
        payload['~:name'] = name;
      }

      const response = await this.post<unknown>('/rpc/command/clone-template', payload, true);

      const result = this.normalizeTransitResponse(response);

      return ResponseFormatter.formatSuccess(result, 'Template cloned successfully');
    } catch (error) {
      logger.error('Failed to clone template', error);
      return ErrorHandler.handle(error, 'cloneTemplate');
    }
  }
}
