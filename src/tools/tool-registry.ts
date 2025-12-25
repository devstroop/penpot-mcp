/**
 * Tool Registry
 *
 * Centralized registry for all MCP tools with:
 * - Lazy initialization (tools created on first use)
 * - Automatic Zod schema validation
 * - Type-safe execution
 * - Single source of truth for tool management
 */

import { z } from 'zod';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { ClientFactory } from '../api/client-factory.js';
import { MCPResponse } from '../api/base/index.js';
import { logger } from '../logger.js';

// Import all tools
import {
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
  MediaTool,
  FontsTool,
  ShareTool,
  WebhooksTool,
  TemplatesTool,
  TrashTool,
  AccessTokensTool,
  NavigateTool,
  InspectTool,
  AssetsTool,
} from './orchestration/index.js';

// Import all schemas
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
  mediaParamsSchema,
  fontsParamsSchema,
  shareParamsSchema,
  webhooksParamsSchema,
  templatesParamsSchema,
  trashParamsSchema,
  accessTokensParamsSchema,
  navigateParamsSchema,
  inspectParamsSchema,
  assetsParamsSchema,
} from '../schemas/index.js';

import { TOOL_NAMES } from '../constants/index.js';

/**
 * Interface for a tool that can execute with validated params
 */
interface ExecutableTool<T> {
  execute(params: T): Promise<MCPResponse>;
}

/**
 * Tool registration entry containing schema and factory
 */
interface ToolRegistration<TSchema extends z.ZodType = z.ZodType> {
  name: string;
  schema: TSchema;
  factory: (clientFactory: ClientFactory) => ExecutableTool<z.infer<TSchema>>;
}

/**
 * Tool Registry class
 * Manages tool registration, instantiation, and execution
 */
class ToolRegistry {
  private registrations = new Map<string, ToolRegistration>();
  private instances = new Map<string, ExecutableTool<unknown>>();
  private clientFactory: ClientFactory | null = null;

  /**
   * Register a tool with its schema and factory function
   */
  register<T extends z.ZodType>(registration: ToolRegistration<T>): void {
    if (this.registrations.has(registration.name)) {
      logger.warn(`Tool '${registration.name}' is already registered, overwriting`);
    }
    this.registrations.set(registration.name, registration);
  }

  /**
   * Set the client factory for creating tool instances
   * Clears existing instances when factory changes
   */
  setClientFactory(factory: ClientFactory): void {
    this.clientFactory = factory;
    this.instances.clear();
    logger.debug('Client factory set, tool instances cleared');
  }

  /**
   * Execute a tool by name with the given arguments
   * Handles validation and lazy instantiation
   */
  async execute(name: string, args: unknown): Promise<MCPResponse> {
    const registration = this.registrations.get(name);

    if (!registration) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    // Validate params using the tool's schema
    const result = registration.schema.safeParse(args);
    if (!result.success) {
      const errorMessage = result.error.issues
        .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      logger.warn('Parameter validation failed', { tool: name, errors: result.error.issues });
      throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${errorMessage}`);
    }

    // Get or create tool instance (lazy initialization)
    let instance = this.instances.get(name);
    if (!instance) {
      if (!this.clientFactory) {
        throw new Error('ClientFactory not set. Call setClientFactory() first.');
      }
      instance = registration.factory(this.clientFactory);
      this.instances.set(name, instance);
      logger.debug(`Tool instance created: ${name}`);
    }

    // Execute with validated params
    return instance.execute(result.data);
  }

  /**
   * Check if a tool is registered
   */
  has(name: string): boolean {
    return this.registrations.has(name);
  }

  /**
   * Get all registered tool names
   */
  getNames(): string[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get count of registered tools
   */
  get count(): number {
    return this.registrations.size;
  }

  /**
   * Clear all instances (useful for testing)
   */
  clearInstances(): void {
    this.instances.clear();
  }
}

// Create singleton registry instance
export const toolRegistry = new ToolRegistry();

// ==================== Register All Tools ====================

// Projects tool
toolRegistry.register({
  name: TOOL_NAMES.PROJECTS,
  schema: projectsParamsSchema,
  factory: (cf) => new ProjectsTool(cf),
});

// Files tool
toolRegistry.register({
  name: TOOL_NAMES.FILES,
  schema: filesParamsSchema,
  factory: (cf) => new FilesTool(cf),
});

// Components tool
toolRegistry.register({
  name: TOOL_NAMES.COMPONENTS,
  schema: componentsParamsSchema,
  factory: (cf) => new ComponentsTool(cf),
});

// Tokens tool
toolRegistry.register({
  name: TOOL_NAMES.TOKENS,
  schema: tokensParamsSchema,
  factory: (cf) => new TokensTool(cf),
});

// Exports tool
toolRegistry.register({
  name: TOOL_NAMES.EXPORTS,
  schema: exportsParamsSchema,
  factory: (cf) => new ExportsTool(cf),
});

// Comments tool
toolRegistry.register({
  name: TOOL_NAMES.COMMENTS,
  schema: commentsParamsSchema,
  factory: (cf) => new CommentsTool(cf),
});

// Team tool
toolRegistry.register({
  name: TOOL_NAMES.TEAM,
  schema: teamParamsSchema,
  factory: (cf) => new TeamTool(cf),
});

// Profile tool
toolRegistry.register({
  name: TOOL_NAMES.PROFILE,
  schema: profileParamsSchema,
  factory: (cf) => new ProfileTool(cf),
});

// Library tool
toolRegistry.register({
  name: TOOL_NAMES.LIBRARY,
  schema: libraryParamsSchema,
  factory: (cf) => new LibraryTool(cf),
});

// Search tool
toolRegistry.register({
  name: TOOL_NAMES.SEARCH,
  schema: searchParamsSchema,
  factory: (cf) => new SearchTool(cf),
});

// Analyze tool
toolRegistry.register({
  name: TOOL_NAMES.ANALYZE,
  schema: analyzeParamsSchema,
  factory: (cf) => new AnalyzeTool(cf),
});

// Shapes tool
toolRegistry.register({
  name: TOOL_NAMES.SHAPES,
  schema: shapesParamsSchema,
  factory: (cf) => new ShapesTool(cf),
});

// Media tool
toolRegistry.register({
  name: TOOL_NAMES.MEDIA,
  schema: mediaParamsSchema,
  factory: (cf) => new MediaTool(cf),
});

// Fonts tool
toolRegistry.register({
  name: TOOL_NAMES.FONTS,
  schema: fontsParamsSchema,
  factory: (cf) => new FontsTool(cf),
});

// Share tool
toolRegistry.register({
  name: TOOL_NAMES.SHARE,
  schema: shareParamsSchema,
  factory: (cf) => new ShareTool(cf),
});

// Webhooks tool
toolRegistry.register({
  name: TOOL_NAMES.WEBHOOKS,
  schema: webhooksParamsSchema,
  factory: (cf) => new WebhooksTool(cf),
});

// Templates tool
toolRegistry.register({
  name: TOOL_NAMES.TEMPLATES,
  schema: templatesParamsSchema,
  factory: (cf) => new TemplatesTool(cf),
});

// Trash tool
toolRegistry.register({
  name: TOOL_NAMES.TRASH,
  schema: trashParamsSchema,
  factory: (cf) => new TrashTool(cf),
});

// Access Tokens tool
toolRegistry.register({
  name: TOOL_NAMES.ACCESS_TOKENS,
  schema: accessTokensParamsSchema,
  factory: (cf) => new AccessTokensTool(cf),
});

// ==================== Legacy Tools ====================

// Navigate tool (legacy)
toolRegistry.register({
  name: TOOL_NAMES.NAVIGATE,
  schema: navigateParamsSchema,
  factory: (cf) => new NavigateTool(cf),
});

// Inspect tool (legacy)
toolRegistry.register({
  name: TOOL_NAMES.INSPECT,
  schema: inspectParamsSchema,
  factory: (cf) => new InspectTool(cf),
});

// Assets tool (legacy)
toolRegistry.register({
  name: TOOL_NAMES.ASSETS,
  schema: assetsParamsSchema,
  factory: (cf) => new AssetsTool(cf),
});

logger.debug(`Tool registry initialized with ${toolRegistry.count} tools`);
