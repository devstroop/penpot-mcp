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
  // Types
  ProjectsParams,
  FilesParams,
  ComponentsParams,
  TokensParams,
  ExportsParams,
  CommentsParams,
  TeamParams,
  ProfileParams,
  LibraryParams,
  SearchParams,
  AnalyzeParams,
  ShapesParams,
  NavigateParams,
  InspectParams,
  AssetsParams,
} from './tools/orchestration/index.js';

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
        const tool = new ProjectsTool(this.clientFactory);
        return tool.execute(args as unknown as ProjectsParams);
      }

      // Files tool
      case 'files': {
        const tool = new FilesTool(this.clientFactory);
        return tool.execute(args as unknown as FilesParams);
      }

      // Components tool
      case 'components': {
        const tool = new ComponentsTool(this.clientFactory);
        return tool.execute(args as unknown as ComponentsParams);
      }

      // Tokens tool
      case 'tokens': {
        const tool = new TokensTool(this.clientFactory);
        return tool.execute(args as unknown as TokensParams);
      }

      // Exports tool
      case 'exports': {
        const tool = new ExportsTool(this.clientFactory);
        return tool.execute(args as unknown as ExportsParams);
      }

      // Comments tool
      case 'comments': {
        const tool = new CommentsTool(this.clientFactory);
        return tool.execute(args as unknown as CommentsParams);
      }

      // Team tool
      case 'team': {
        const tool = new TeamTool(this.clientFactory);
        return tool.execute(args as unknown as TeamParams);
      }

      // Profile tool
      case 'profile': {
        const tool = new ProfileTool(this.clientFactory);
        return tool.execute(args as unknown as ProfileParams);
      }

      // Library tool
      case 'library': {
        const tool = new LibraryTool(this.clientFactory);
        return tool.execute(args as unknown as LibraryParams);
      }

      // Search tool
      case 'search': {
        const tool = new SearchTool(this.clientFactory);
        return tool.execute(args as unknown as SearchParams);
      }

      // Analyze tool
      case 'analyze': {
        const tool = new AnalyzeTool(this.clientFactory);
        return tool.execute(args as unknown as AnalyzeParams);
      }

      // Shapes tool
      case 'shapes': {
        const tool = new ShapesTool(this.clientFactory);
        return tool.execute(args as unknown as ShapesParams);
      }

      // ==================== Legacy Tools (backward compatibility) ====================

      // Navigation tool
      case 'navigate': {
        const tool = new NavigateTool(this.clientFactory);
        return tool.execute(args as unknown as NavigateParams);
      }

      // Inspection tool
      case 'inspect': {
        const tool = new InspectTool(this.clientFactory);
        return tool.execute(args as unknown as InspectParams);
      }

      // Assets tool
      case 'assets': {
        const tool = new AssetsTool(this.clientFactory);
        return tool.execute(args as unknown as AssetsParams);
      }

      default:
        logger.warn('Unknown tool requested', { tool: name });
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
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
