import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

import { ConfigManager } from './config.js';
import { logger } from './logger.js';
import { ClientFactory } from './api/client-factory.js';
import { createToolDefinitions, ToolDefinition } from './tools/index.js';
import { toolRegistry } from './tools/tool-registry.js';
import { MCPResponse } from './api/base/index.js';
import { DEFAULTS } from './constants/index.js';

// Type adapter to convert MCPResponse to CallToolResult
function toCallToolResult(response: MCPResponse): CallToolResult {
  return {
    content: response.content,
    isError: response.isError,
  };
}

export class PenpotMCPServer {
  private server: Server;
  private clientFactory: ClientFactory;
  private config: ConfigManager;
  private transport: Transport | null = null;
  private toolDefinitions: ToolDefinition[];

  constructor() {
    this.config = new ConfigManager();
    this.config.validate();

    const penpotConfig = this.config.get();

    logger.info('Initializing Penpot MCP Server', {
      baseUrl: penpotConfig.baseUrl,
      hasDefaultProjectId: this.config.hasDefaultProjectId(),
    });

    // Initialize client factory
    this.clientFactory = new ClientFactory({
      baseURL: penpotConfig.baseUrl,
      username: penpotConfig.username,
      password: penpotConfig.password,
      timeout: DEFAULTS.TIMEOUT,
      retryAttempts: DEFAULTS.RETRY_ATTEMPTS,
      retryDelay: DEFAULTS.RETRY_DELAY,
    });

    // Configure tool registry with client factory
    toolRegistry.setClientFactory(this.clientFactory);

    // Generate tool definitions
    this.toolDefinitions = createToolDefinitions();

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'penpot-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    logger.info('Penpot MCP Server initialized', {
      toolCount: this.toolDefinitions.length,
      registeredTools: toolRegistry.count,
    });
  }

  private setupToolHandlers(): void {
    // Register tool list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.toolDefinitions,
    }));

    // Register tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
      const { name, arguments: args = {} } = request.params;

      try {
        const response = await this.handleToolCall(name, args as Record<string, unknown>);
        return toCallToolResult(response);
      } catch (error) {
        logger.error('Tool execution error', {
          tool: name,
          error: error instanceof Error ? error.message : error,
        });

        if (error instanceof McpError) {
          throw error;
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  /**
   * Handle tool calls using the centralized tool registry.
   * Validation and instantiation are handled by the registry.
   */
  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
    logger.debug('Handling tool call', { tool: name, args });
    return toolRegistry.execute(name, args);
  }

  public onConnectionClose(handler: () => void | Promise<void>): void {
    this.server.onclose = () => {
      Promise.resolve(handler()).catch((error) => {
        logger.error('Error while handling MCP connection close', error);
      });
    };
  }

  public onConnectionError(handler: (error: Error) => void | Promise<void>): void {
    this.server.onerror = (error: Error) => {
      Promise.resolve(handler(error)).catch((handlerError) => {
        logger.error('Error while handling MCP connection error', handlerError);
      });
    };
  }

  async connect(transport: Transport): Promise<void> {
    this.transport = transport;
    await this.server.connect(transport);
    logger.info('Penpot MCP Server connected', {
      transport: transport.constructor?.name ?? 'UnknownTransport',
      toolCount: this.toolDefinitions.length,
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.connect(transport);
    logger.info('Penpot MCP Server running with stdio transport');
  }

  async cleanup(options: { disconnect?: boolean } = {}): Promise<void> {
    if (options.disconnect && this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        logger.warn('Error while closing MCP transport during cleanup', error);
      }
    }

    // Clear tool instances
    toolRegistry.clearInstances();

    this.transport = null;
    logger.info('Server resources cleaned up');
  }
}
