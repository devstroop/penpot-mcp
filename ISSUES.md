# Known Issues & Improvement Backlog

> **Last updated:** December 25, 2025  
> **Current Version:** 1.0.0  
> **Test Coverage:** ~60% (33 unit tests)  
> **Capability Coverage:** ~65% (see CAPABILITIES.md)

This document tracks architectural improvements, code quality issues, technical debt, and enhancement opportunities for the Penpot MCP Server. Issues are organized by priority and category.

## ✅ Completed Fixes

### Phase 1: Critical Security (Completed Dec 25, 2025)

- **C1** ✅ Runtime Parameter Validation - Added Zod schemas for all 15 tools
- **C2** ✅ Log Sanitization - Added sensitive data redaction to logger

Files created:
- `src/schemas/index.ts`
- `src/schemas/projects.schema.ts`
- `src/schemas/files.schema.ts`
- `src/schemas/components.schema.ts`
- `src/schemas/tokens.schema.ts`
- `src/schemas/exports.schema.ts`
- `src/schemas/comments.schema.ts`
- `src/schemas/team.schema.ts`
- `src/schemas/profile.schema.ts`
- `src/schemas/library.schema.ts`
- `src/schemas/search.schema.ts`
- `src/schemas/analyze.schema.ts`
- `src/schemas/shapes.schema.ts`
- `src/schemas/legacy.schema.ts`

Files modified:
- `src/logger.ts` - Added `sanitize()` method with `SENSITIVE_KEYS` list
- `src/server-core.ts` - Added `validateParams()` method using Zod schemas
- `src/tools/orchestration/types.ts` - Now re-exports types from schemas

Dependencies added:
- `zod` ^3.24.2

### Phase 2: Foundation (Completed Dec 25, 2025)

- **H4** ✅ Error Hierarchy - Created typed error classes with `toMCPResponse()`
- **M4** ✅ Config Validation - Added Zod schema validation for all env vars
- **M2** ✅ Constants Module - Centralized tool names, endpoints, actions
- **Quick Wins** ✅ LICENSE, .prettierrc, eslint.config.js, package.json scripts

Files created:
- `src/errors/index.ts` - PenpotError base class + AuthenticationError, NotFoundError, etc.
- `src/constants/index.ts` - TOOL_NAMES, ENDPOINTS, ACTIONS, DEFAULTS, HTTP_STATUS
- `LICENSE` - MIT License
- `.prettierrc` - Prettier configuration
- `eslint.config.js` - ESLint flat config

Files modified:
- `src/config.ts` - Added Zod schema validation with detailed error messages
- `package.json` - Added lint:fix, format, format:check, typecheck scripts

Dependencies added:
- `@eslint/js` ^9.x
- `typescript-eslint` ^8.x
- `prettier` ^3.x

### Phase 3: Architecture (Completed Dec 25, 2025)

- **H1** ✅ Tool Registry - Replaced 65-line switch with centralized registry
- **H3** ✅ Duplicate Validation - Now handled by schemas, tools assume valid input

Files created:
- `src/tools/tool-registry.ts` - Centralized tool registration, lazy initialization, validation

Files modified:
- `src/server-core.ts` - Reduced from ~280 lines to ~150 lines, uses toolRegistry
- `src/tools/index.ts` - Exports toolRegistry

Benefits:
- Tools instantiated once (lazy), not per request
- Single source of truth for tool → schema → factory mapping
- Adding new tools: one `toolRegistry.register()` call
- Validation centralized in registry, not duplicated in server-core

### Phase 4: Quality (Completed Dec 25, 2025)

- **H2** ✅ Test Infrastructure - Vitest config, mocks, 33 unit tests passing
- **M3** ✅ Retry with Backoff - Exponential backoff with jitter
- **M5** ✅ Enhanced Logging - Request/response verbose mode with timing

Files created:
- `vitest.config.ts` - Test configuration with coverage thresholds
- `tests/setup.ts` - Global test setup with env mocking
- `tests/mocks/axios.mock.ts` - Axios mocking utilities
- `tests/mocks/client-factory.mock.ts` - ClientFactory mock
- `tests/mocks/index.ts` - Mock barrel exports
- `tests/unit/logger.test.ts` - 15 tests for Logger class
- `tests/unit/config.test.ts` - 9 tests for config schema
- `tests/unit/retry.test.ts` - 9 tests for retry utilities
- `src/utils/retry.ts` - Retry with exponential backoff, jitter, predicates
- `src/utils/index.ts` - Utils barrel export

Files modified:
- `src/logger.ts` - Exported Logger class, added setLevel(), proper console methods
- `src/api/base/base-client.ts` - Added verbose logging, request timing, header sanitization

Dependencies added:
- `vitest` ^2.0.0
- `@vitest/coverage-v8` ^2.0.0

Test Coverage:
- 33 unit tests passing
- Config schema validation tested
- Logger sanitization tested
- Retry utility tested

### Phase 5: Polish (Completed Dec 25, 2025)

- **L4** ✅ Pre-commit Hooks - husky + lint-staged for automatic linting/formatting
- **Documentation** ✅ CONTRIBUTING.md, CHANGELOG.md

Files created:
- `.husky/pre-commit` - Pre-commit hook running lint-staged
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history

Files modified:
- `package.json` - Added lint-staged configuration

Dependencies added:
- `husky` ^9.x
- `lint-staged` ^16.x

---

## Remaining Work

The following items are lower priority and can be addressed in future versions:

- [Critical - Must Fix Before v1.1](#critical---must-fix-before-v11)
- [High Priority - Architecture](#high-priority---architecture)
- [Medium Priority - Code Quality](#medium-priority---code-quality)
- [Low Priority - Nice to Have](#low-priority---nice-to-have)
- [API/Feature Issues](#apifeature-issues)
- [Missing Files](#missing-files)
- [Dependencies](#dependencies)
- [Quick Wins Checklist](#quick-wins-checklist)

---

## Critical - Must Fix Before v1.1

### C1. No Runtime Parameter Validation ⚠️ SECURITY

**Location:** `src/server-core.ts` (all tool calls)

**Risk:** High - Malformed input can cause crashes or unexpected behavior

**Problem:** Type assertions (`as unknown as`) bypass TypeScript safety. MCP clients can send any data.

**Current Code:**
```typescript
// server-core.ts:110
return tool.execute(args as unknown as ProjectsParams);
```

**Impact:**
- Invalid UUIDs crash the API client
- Missing required params cause cryptic errors
- No input sanitization before API calls

**Solution:** Add Zod validation layer:
```typescript
// src/schemas/projects.schema.ts
import { z } from 'zod';

export const projectsParamsSchema = z.object({
  action: z.enum(['list', 'get', 'create', 'rename', 'delete', 'duplicate', 'move', 'files', 'stats']),
  projectId: z.string().uuid('Invalid project UUID').optional(),
  teamId: z.string().uuid('Invalid team UUID').optional(),
  name: z.string().min(1).max(255).optional(),
  targetTeamId: z.string().uuid('Invalid target team UUID').optional(),
}).refine(
  (data) => {
    // Validate required params per action
    if (['get', 'rename', 'delete', 'duplicate', 'files', 'stats'].includes(data.action)) {
      return !!data.projectId;
    }
    if (data.action === 'create') return !!data.name;
    if (data.action === 'move') return !!data.projectId && !!data.targetTeamId;
    return true;
  },
  { message: 'Missing required parameters for action' }
);

// Usage in server-core.ts
const validated = projectsParamsSchema.safeParse(args);
if (!validated.success) {
  throw new McpError(ErrorCode.InvalidParams, validated.error.message);
}
return tool.execute(validated.data);
```

**Files to Create:**
- `src/schemas/index.ts`
- `src/schemas/projects.schema.ts`
- `src/schemas/files.schema.ts`
- `src/schemas/components.schema.ts`
- `src/schemas/tokens.schema.ts`
- `src/schemas/exports.schema.ts`
- `src/schemas/comments.schema.ts`
- `src/schemas/team.schema.ts`
- `src/schemas/profile.schema.ts`
- `src/schemas/library.schema.ts`
- `src/schemas/search.schema.ts`
- `src/schemas/analyze.schema.ts`
- `src/schemas/shapes.schema.ts`

**Effort:** Medium (4-6 hours) | **Impact:** Critical

---

### C2. Sensitive Data Logging ⚠️ SECURITY

**Location:** `src/logger.ts`

**Risk:** High - Credentials could appear in logs

**Problem:** Logger outputs raw objects without sanitization:
```typescript
// logger.ts:37
private log(level: LogLevel, message: string, data?: unknown): void {
  // data could contain passwords, tokens, etc.
  const formatted = this.formatEntry(entry);
}
```

**Solution:**
```typescript
private readonly SENSITIVE_KEYS = ['password', 'token', 'auth', 'secret', 'key', 'cookie', 'credential'];

private sanitize(data: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]';
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => this.sanitize(item, depth + 1));
  }
  
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (this.SENSITIVE_KEYS.some(s => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = this.sanitize(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

private formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  if (entry.data !== undefined) {
    return `${base} ${JSON.stringify(this.sanitize(entry.data))}`;
  }
  return base;
}
```

**Effort:** Low (1-2 hours) | **Impact:** Critical

---

## High Priority - Architecture

### H1. Tool Registration Pattern Refactor

**Location:** `src/server-core.ts` (lines 93-161)

**Problem:** 65-line switch statement with 15 cases that creates new tool instances per request.

**Issues:**
1. Unmaintainable as tools grow
2. Memory churn from constant instantiation  
3. No centralized tool management
4. Duplicate validation logic in each case

**Current Code:**
```typescript
switch (name) {
  case 'projects': {
    const tool = new ProjectsTool(this.clientFactory);
    return tool.execute(args as unknown as ProjectsParams);
  }
  case 'files': {
    const tool = new FilesTool(this.clientFactory);
    return tool.execute(args as unknown as FilesParams);
  }
  // ... 13 more cases
}
```

**Solution:** Implement tool registry with lazy initialization:
```typescript
// src/tools/tool-registry.ts
import { z } from 'zod';
import { ClientFactory } from '../api/client-factory.js';
import { MCPResponse } from '../api/base/index.js';

interface ToolRegistration<T extends z.ZodType> {
  name: string;
  schema: T;
  factory: (clientFactory: ClientFactory) => { execute: (params: z.infer<T>) => Promise<MCPResponse> };
}

class ToolRegistry {
  private registrations = new Map<string, ToolRegistration<any>>();
  private instances = new Map<string, { execute: (params: any) => Promise<MCPResponse> }>();
  private clientFactory: ClientFactory | null = null;

  register<T extends z.ZodType>(registration: ToolRegistration<T>): void {
    this.registrations.set(registration.name, registration);
  }

  setClientFactory(factory: ClientFactory): void {
    this.clientFactory = factory;
    this.instances.clear(); // Reset instances when factory changes
  }

  async execute(name: string, args: unknown): Promise<MCPResponse> {
    const registration = this.registrations.get(name);
    if (!registration) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    // Validate params
    const validated = registration.schema.safeParse(args);
    if (!validated.success) {
      throw new McpError(ErrorCode.InvalidParams, validated.error.message);
    }

    // Get or create tool instance
    if (!this.instances.has(name)) {
      if (!this.clientFactory) throw new Error('ClientFactory not set');
      this.instances.set(name, registration.factory(this.clientFactory));
    }

    return this.instances.get(name)!.execute(validated.data);
  }

  getNames(): string[] {
    return Array.from(this.registrations.keys());
  }
}

export const toolRegistry = new ToolRegistry();

// Register all tools
import { projectsParamsSchema } from '../schemas/projects.schema.js';
import { ProjectsTool } from './orchestration/projects.js';

toolRegistry.register({
  name: 'projects',
  schema: projectsParamsSchema,
  factory: (cf) => new ProjectsTool(cf),
});
// ... register other tools
```

**New server-core.ts:**
```typescript
private async handleToolCall(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
  logger.debug('Handling tool call', { tool: name, args });
  return toolRegistry.execute(name, args);
}
```

**Effort:** Medium (4-6 hours) | **Impact:** High

---

### H2. Test Infrastructure Missing

**Location:** Project root

**Problem:** 
- Test files are `.cjs` scripts at root, not proper tests
- No test configuration
- No mocking infrastructure
- 0% code coverage

**Current Structure:**
```
test-all-tools.cjs      # Integration script
test-text.cjs           # Manual test
create-complete-design.cjs   # Demo script  
design-mobile-app.cjs   # Demo script
```

**Target Structure:**
```
tests/
├── setup.ts                    # Global test setup
├── mocks/
│   ├── axios.mock.ts          # HTTP mocking
│   ├── client-factory.mock.ts # API client mocks
│   └── transit-responses.ts   # Sample API responses
├── unit/
│   ├── config.test.ts
│   ├── logger.test.ts
│   ├── api/
│   │   ├── base-client.test.ts
│   │   ├── error-handler.test.ts
│   │   └── response-formatter.test.ts
│   └── tools/
│       ├── projects-tool.test.ts
│       ├── files-tool.test.ts
│       └── ...
├── integration/
│   ├── projects.test.ts
│   ├── files.test.ts
│   └── shapes.test.ts
└── e2e/
    └── design-workflow.test.ts
scripts/
├── demo/
│   ├── create-complete-design.ts
│   └── design-mobile-app.ts
└── test-manual.ts
```

**Files to Create:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/index.ts'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    setupFiles: ['tests/setup.ts'],
  },
});
```

**Effort:** Medium (6-8 hours) | **Impact:** High

---

### H3. Duplicate Code in Tool Execute Methods

**Location:** All `src/tools/orchestration/*.ts` files

**Problem:** Every tool has identical boilerplate pattern:
```typescript
// projects.ts
if (!params.projectId) {
  return ResponseFormatter.formatError('projectId is required for get action');
}

// files.ts  
if (!params.fileId) {
  return ResponseFormatter.formatError('fileId is required for get action');
}

// ... same pattern in all 15 tools
```

**Count:** ~150+ similar validation blocks across tools

**Solution:** With Zod schemas (C1), all validation happens before `execute()` is called. Tools can assume valid input:

```typescript
// Before: Manual validation in each tool
async execute(params: ProjectsParams): Promise<MCPResponse> {
  switch (params.action) {
    case 'get':
      if (!params.projectId) {
        return ResponseFormatter.formatError('projectId is required');
      }
      return client.projects.getProject(params.projectId);
  }
}

// After: Schema-validated, clean execute
async execute(params: ProjectsParams): Promise<MCPResponse> {
  switch (params.action) {
    case 'get':
      // projectId guaranteed by schema
      return client.projects.getProject(params.projectId!);
  }
}
```

**Effort:** Low (included with C1) | **Impact:** High

---

### H4. Error Handling Inconsistency

**Location:** `src/api/base/error-handler.ts`, all API clients

**Problem:** 
1. `ErrorHandler.handle()` returns `MCPResponse` but sometimes errors are thrown
2. Some methods return error response, others throw
3. No typed error classes for programmatic handling

**Example Inconsistency:**
```typescript
// projects-api.ts - returns error response
async listProjects(): Promise<MCPResponse> {
  try {
    // ...
  } catch (error) {
    return ErrorHandler.handle(error, 'listProjects'); // Returns MCPResponse
  }
}

// base-client.ts - throws error
private async handleResponseError(error: AxiosError): Promise<never> {
  // ...
  throw error; // Throws
}
```

**Solution:** Create typed error hierarchy:
```typescript
// src/errors/index.ts
export class PenpotError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode?: number,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PenpotError';
    Error.captureStackTrace(this, this.constructor);
  }

  toMCPResponse(): MCPResponse {
    return ResponseFormatter.formatError(this.message, {
      code: this.code,
      statusCode: this.statusCode,
      ...this.context,
    });
  }
}

export enum ErrorCode {
  AUTHENTICATION_FAILED = 'AUTH_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CLOUDFLARE_BLOCKED = 'CLOUDFLARE_BLOCKED',
  API_ERROR = 'API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AuthenticationError extends PenpotError {
  constructor(message = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, ErrorCode.AUTHENTICATION_FAILED, 401, context);
  }
}

export class RateLimitError extends PenpotError {
  constructor(public readonly retryAfter?: number) {
    super('Rate limited. Please wait before making more requests.', ErrorCode.RATE_LIMITED, 429, { retryAfter });
  }
}

export class NotFoundError extends PenpotError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, ErrorCode.NOT_FOUND, 404, { resource, id });
  }
}

export class CloudFlareError extends PenpotError {
  constructor() {
    super(
      'CloudFlare protection detected. Please log in via browser first.',
      ErrorCode.CLOUDFLARE_BLOCKED,
      403
    );
  }
}
```

**Usage:**
```typescript
// In API client
async getProject(projectId: string): Promise<MCPResponse> {
  try {
    // ...
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }
  } catch (error) {
    if (error instanceof PenpotError) {
      return error.toMCPResponse();
    }
    return ErrorHandler.handle(error, `getProject(${projectId})`);
  }
}
```

**Effort:** Medium (4-5 hours) | **Impact:** High

---

## Medium Priority - Code Quality

### M1. Transit+JSON Parser Incomplete

**Location:** `src/api/base/base-client.ts` (lines 153-200)

**Problem:** Hardcoded cache key mappings don't cover all Transit formats:
```typescript
const transitCache: Record<string, string> = {
  '^A': 'id',
  '^=': 'name',
  '^4': 'type',
  '^T': 'width',
  '^18': 'height',
  // ... incomplete
};
```

**Issues:**
- Cache keys are dynamic per response
- Missing array handling for some formats
- Edge cases cause data loss

**Solution Options:**
1. **Option A:** Use `transit-js` library (official Transit implementation)
2. **Option B:** Build comprehensive dynamic parser

**Option B Implementation:**
```typescript
class TransitParser {
  private cache: string[] = [];

  parse(data: unknown): unknown {
    this.cache = [];
    return this.parseValue(data);
  }

  private parseValue(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    
    if (Array.isArray(value)) {
      if (value.length > 0 && value[0] === '^ ') {
        return this.parseTransitMap(value);
      }
      return value.map(v => this.parseValue(v));
    }
    
    if (typeof value === 'string') {
      return this.parseTransitString(value);
    }
    
    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        const key = this.parseTransitString(k);
        result[String(key)] = this.parseValue(v);
      }
      return result;
    }
    
    return value;
  }

  private parseTransitMap(arr: unknown[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (let i = 1; i < arr.length - 1; i += 2) {
      let key = String(arr[i]);
      
      if (key.startsWith('^')) {
        const cacheIndex = this.getCacheIndex(key);
        if (cacheIndex < this.cache.length) {
          key = this.cache[cacheIndex];
        }
      } else {
        const normalizedKey = this.parseTransitString(key);
        this.cache.push(String(normalizedKey));
        key = String(normalizedKey);
      }
      
      result[key] = this.parseValue(arr[i + 1]);
    }
    return result;
  }

  private parseTransitString(value: string): string {
    if (value.startsWith('~u')) return value.slice(2);
    if (value.startsWith('~:')) return value.slice(2);
    if (value.startsWith('~#')) return value.slice(2);
    if (value.startsWith('~m')) return value.slice(2);
    return value;
  }

  private getCacheIndex(ref: string): number {
    const char = ref.charAt(1);
    if (char >= '0' && char <= '9') return parseInt(char, 10);
    return char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  }
}
```

**Effort:** High (6-8 hours) | **Impact:** Medium

---

### M2. Magic Strings Throughout Codebase

**Location:** Multiple files

**Problem:** Hardcoded strings for tool names, actions, endpoints scattered everywhere.

**Solution:** Create constants module:
```typescript
// src/constants/index.ts
export const TOOL_NAMES = {
  PROJECTS: 'projects',
  FILES: 'files',
  COMPONENTS: 'components',
  TOKENS: 'tokens',
  EXPORTS: 'exports',
  COMMENTS: 'comments',
  TEAM: 'team',
  PROFILE: 'profile',
  LIBRARY: 'library',
  SEARCH: 'search',
  ANALYZE: 'analyze',
  SHAPES: 'shapes',
  NAVIGATE: 'navigate',
  INSPECT: 'inspect',
  ASSETS: 'assets',
} as const;

export type ToolName = typeof TOOL_NAMES[keyof typeof TOOL_NAMES];

export const ENDPOINTS = {
  LOGIN: '/rpc/command/login-with-password',
  GET_ALL_PROJECTS: '/rpc/command/get-all-projects',
  CREATE_PROJECT: '/rpc/command/create-project',
  GET_FILE: '/rpc/command/get-file',
  UPDATE_FILE: '/rpc/command/update-file',
  // ... all endpoints
} as const;

export const ACTIONS = {
  PROJECTS: ['list', 'get', 'create', 'rename', 'delete', 'duplicate', 'move', 'files', 'stats'] as const,
  FILES: ['get', 'create', 'rename', 'delete', 'duplicate', 'move', 'pages', 'page', 'objects', 'object', 'tree', 'search', 'analyze', 'history', 'snapshot', 'add_frame', 'add_rectangle', 'add_ellipse', 'add_text', 'add_path', 'modify_object', 'delete_object'] as const,
} as const;
```

**Effort:** Medium (3-4 hours) | **Impact:** Medium

---

### M3. Retry Logic Too Simplistic

**Location:** `src/api/base/base-client.ts` (lines 96-105)

**Problem:** Basic retry without exponential backoff, jitter, or circuit breaker.

**Solution:**
```typescript
// src/utils/retry.ts
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBase: 2,
  jitter: true,
};

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: unknown, attempt: number) => boolean,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  let lastError: unknown;
  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === cfg.maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }
      
      let delay = Math.min(
        cfg.baseDelay * Math.pow(cfg.exponentialBase, attempt - 1),
        cfg.maxDelay
      );
      
      if (cfg.jitter) {
        delay = delay * (0.5 + Math.random());
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

**Effort:** Low (2-3 hours) | **Impact:** Medium

---

### M4. Config Validation Incomplete

**Location:** `src/config.ts`

**Problem:** Minimal validation, no coercion, unhelpful error messages.

**Solution:**
```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PENPOT_USERNAME: z.string().email('PENPOT_USERNAME must be a valid email'),
  PENPOT_PASSWORD: z.string().min(1, 'PENPOT_PASSWORD is required'),
  PENPOT_API_URL: z.string().url().default('https://design.penpot.app/api'),
  PENPOT_PROJECT_ID: z.string().uuid().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PORT: z.coerce.number().min(1).max(65535).default(3002),
});

export type EnvConfig = z.infer<typeof envSchema>;
```

**Effort:** Low (1-2 hours) | **Impact:** Medium

---

### M5. Missing Request/Response Logging for Debugging

**Location:** `src/api/base/base-client.ts`

**Problem:** Only minimal logging, hard to debug API issues.

**Solution:** Add configurable verbose logging with sanitization.

**Effort:** Low (1-2 hours) | **Impact:** Medium

---

## Low Priority - Nice to Have

### L1. Missing JSDoc Documentation

**Location:** All public methods

**Problem:** Public APIs lack documentation.

**Effort:** High (8+ hours) | **Impact:** Low

---

### L2. Package.json Incomplete

**Location:** `package.json`

**Missing Fields:**
```json
{
  "author": "Your Name <email@example.com>",
  "repository": { "type": "git", "url": "..." },
  "bugs": { "url": "..." },
  "files": ["dist", "README.md", "LICENSE"]
}
```

**Effort:** Low (30 mins) | **Impact:** Low

---

### L3. Index Barrel Exports Not Optimized

**Location:** All `index.ts` files

**Problem:** Using `export *` impacts tree-shaking.

**Solution:** Use explicit `export type` for types.

**Effort:** Low (1 hour) | **Impact:** Low

---

### L4. Add Pre-commit Hooks

**Solution:** Add husky + lint-staged

**Effort:** Low (1 hour) | **Impact:** Low

---

## API/Feature Issues

### F1. Token Creation Fails with revn Conflicts

**Status:** ⚠️ Partially Working

**Problem:** Creating color/typography tokens often fails due to revision conflicts.

**Solution:** Batch operations in single API call.

**Effort:** Low (1-2 hours) | **Impact:** High for token workflows

---

### F2. Some API Endpoints Return Different Formats

**Status:** ⚠️ Inconsistent

**Problem:** API responses vary between Transit+JSON arrays and plain JSON.

**Affected:** get-teams, get-comment-threads

**Effort:** Medium (3-4 hours) | **Impact:** Medium

---

### F3. Page Management Not Implemented

**Status:** ❌ Not Implemented

**Missing:** Create page, delete page, rename page, reorder pages

**Effort:** Low (2 hours) | **Impact:** Medium

---

## Missing Files

| File | Purpose | Priority |
|------|---------|----------|
| `LICENSE` | MIT license | High |
| `vitest.config.ts` | Test config | High |
| `eslint.config.js` | Linting | Medium |
| `.prettierrc` | Formatting | Medium |
| `CHANGELOG.md` | Version history | Low |
| `CONTRIBUTING.md` | Contribution guide | Low |
| `src/errors/index.ts` | Error classes | High |
| `src/constants/index.ts` | Constants | Medium |
| `src/schemas/*.ts` | Zod schemas | Critical |
| `src/utils/retry.ts` | Retry utils | Medium |
| `tests/setup.ts` | Test setup | High |

### Config Templates

**eslint.config.js:**
```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  }
);
```

**.prettierrc:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

## Dependencies

### Required
```json
{ "dependencies": { "zod": "^3.23.0" } }
```

### Recommended Dev
```json
{
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0",
    "typescript-eslint": "^8.0.0"
  }
}
```

---

## Quick Wins Checklist

- [ ] **C2** - Add log sanitization (30 mins)
- [ ] **L2** - Update package.json metadata (30 mins)
- [ ] Add LICENSE file (5 mins)
- [ ] Add .prettierrc (10 mins)
- [ ] Add eslint.config.js (15 mins)
- [ ] Move test scripts to scripts/ (15 mins)
- [ ] Create src/constants/index.ts (30 mins)

---

## Implementation Order

### Phase 1: Critical Security (Day 1)
1. C2 - Log sanitization
2. C1 - Zod schemas (partial)

### Phase 2: Foundation (Days 2-3)
3. H4 - Error hierarchy
4. M4 - Config validation
5. M2 - Constants module
6. Quick wins

### Phase 3: Architecture (Days 4-5)
7. C1 - Complete Zod schemas
8. H1 - Tool registry
9. H3 - Remove duplicate validation

### Phase 4: Quality (Days 6-7)
10. H2 - Test infrastructure
11. M3 - Retry with backoff
12. M5 - Enhanced logging

### Phase 5: Polish (Week 2)
13. M1 - Transit parser
14. L1 - JSDoc docs
15. F1-F3 - API issues
16. L4 - Pre-commit hooks

---

## Notes

- Reference in commits: `fix(C1): add Zod validation for projects tool`
- Priority: Critical > High > Medium > Low
- Effort: Low (<2h), Medium (2-6h), High (>6h)
- Security issues (C1, C2) must be fixed before public release
- Target: 60% coverage for v1.1, 80% for v2.0
