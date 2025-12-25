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
import { z } from 'zod';

import { ConfigManager } from './config.js';
import { logger } from './logger.js';
import { ClientFactory } from './api/client-factory.js';
import { createToolDefinitions, ToolDefinition } from './tools/index.js';
import { MCPResponse, ResponseFormatter } from './api/base/index.js';
import {
  // New comprehensive tools
  ProjectsTool,
  FilesTool,
  ComponentsTool,
  TokensTool,
  ExportsTool,
  CommentsTool,
  TeamTool,
  ProfileTool,
  LibraryTool,
  SearchTool,
  AnalyzeTool,
  ShapesTool,
  // Legacy tools
  NavigateTool,
  InspectTool,
  AssetsTool,
} from './tools/orchestration/index.js';

// Import Zod schemas for runtime validation
import {
  projectsParamsSchema,
  filesParamsSchema,
  componentsParamsSchema,
  tokensParamsSchema,
  exportsParamsSchema,
  commentsParamsSchema,
  teamParamsSchema,
  profileParamsSchema,
  libraryParamsSchema,
  searchParamsSchema,
  analyzeParamsSchema,
  shapesParamsSchema,
  navigateParamsSchema,
  inspectParamsSchema,
  assetsParamsSchema,
} from './schemas/index.js';

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
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    });

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
    logger.info('Penpot MCP Server initialized', { toolCount: this.toolDefinitions.length });
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
        logger.error('Tool execution error', { tool: name, error: error instanceof Error ? error.message : error });

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

  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
    logger.debug('Handling tool call', { tool: name, args });

    switch (name) {
      // ==================== New Comprehensive Tools ====================

      // Projects tool
      case 'projects': {
        const validated = this.validateParams(projectsParamsSchema, args);
        const tool = new ProjectsTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Files tool
      case 'files': {
        const validated = this.validateParams(filesParamsSchema, args);
        const tool = new FilesTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Components tool
      case 'components': {
        const validated = this.validateParams(componentsParamsSchema, args);
        const tool = new ComponentsTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Tokens tool
      case 'tokens': {
        const validated = this.validateParams(tokensParamsSchema, args);
        const tool = new TokensTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Exports tool
      case 'exports': {
        const validated = this.validateParams(exportsParamsSchema, args);
        const tool = new ExportsTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Comments tool
      case 'comments': {
        const validated = this.validateParams(commentsParamsSchema, args);
        const tool = new CommentsTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Team tool
      case 'team': {
        const validated = this.validateParams(teamParamsSchema, args);
        const tool = new TeamTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Profile tool
      case 'profile': {
        const validated = this.validateParams(profileParamsSchema, args);
        const tool = new ProfileTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Library tool
      case 'library': {
        const validated = this.validateParams(libraryParamsSchema, args);
        const tool = new LibraryTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Search tool
      case 'search': {
        const validated = this.validateParams(searchParamsSchema, args);
        const tool = new SearchTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Analyze tool
      case 'analyze': {
        const validated = this.validateParams(analyzeParamsSchema, args);
        const tool = new AnalyzeTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Shapes tool
      case 'shapes': {
        const validated = this.validateParams(shapesParamsSchema, args);
        const tool = new ShapesTool(this.clientFactory);
        return tool.execute(validated);
      }

      // ==================== Legacy Tools (backward compatibility) ====================

      // Navigation tool
      case 'navigate': {
        const validated = this.validateParams(navigateParamsSchema, args);
        const tool = new NavigateTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Inspection tool
      case 'inspect': {
        const validated = this.validateParams(inspectParamsSchema, args);
        const tool = new InspectTool(this.clientFactory);
        return tool.execute(validated);
      }

      // Assets tool
      case 'assets': {
        const validated = this.validateParams(assetsParamsSchema, args);
        const tool = new AssetsTool(this.clientFactory);
        return tool.execute(validated);
      }

      default:
        logger.warn('Unknown tool requested', { tool: name });
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  }

  /**
   * Validates parameters against a Zod schema.
   * Throws McpError with InvalidParams code if validation fails.
   */
  private validateParams<T extends z.ZodType>(schema: T, args: unknown): z.infer<T> {
    const result = schema.safeParse(args);
    if (!result.success) {
      const zodError = result.error;
      const errorMessage = zodError.issues
        .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      logger.warn('Parameter validation failed', { errors: zodError.issues });
      throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${errorMessage}`);
    }
    return result.data;
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

    this.transport = null;
    logger.info('Server resources cleaned up');
  }
}
