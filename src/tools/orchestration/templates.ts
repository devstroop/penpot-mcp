import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { TemplatesParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Templates Tool - Access and clone builtin templates
 */
export class TemplatesTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: TemplatesParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('TemplatesTool executing', { action, params });

    switch (action) {
      case 'list':
        return client.templates.getBuiltinTemplates();

      case 'clone':
        if (!params.projectId || !params.templateId) {
          return ResponseFormatter.formatError(
            'projectId and templateId are required for clone action'
          );
        }
        return client.templates.cloneTemplate(params.projectId, params.templateId, params.name);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
