# Contributing to Penpot MCP Server

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher
- A Penpot account (cloud or self-hosted)

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd penpot-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Fill in your Penpot credentials.

4. Build the project:
   ```bash
   npm run build
   ```

5. Run tests:
   ```bash
   npm test
   ```

## Code Style

This project uses ESLint and Prettier for code formatting.

- **ESLint**: Enforces code quality rules
- **Prettier**: Enforces consistent formatting

### Commands

```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
npm run format      # Format all files
npm run format:check # Check formatting
npm run typecheck   # TypeScript type checking
```

### Pre-commit Hooks

We use husky and lint-staged to automatically run linting and formatting on staged files before commit. This ensures consistent code quality.

## Project Structure

```
src/
├── api/                 # API clients for Penpot
│   ├── base/           # Base client, error handling, response formatting
│   └── domains/        # Domain-specific API clients
├── constants/          # Centralized constants
├── errors/             # Typed error hierarchy
├── schemas/            # Zod validation schemas
├── tools/              # MCP tool implementations
│   └── orchestration/  # High-level tool orchestrators
├── utils/              # Utility functions
├── config.ts           # Configuration management
├── logger.ts           # Logging utilities
├── server-core.ts      # Main MCP server
└── index.ts            # Entry point

tests/
├── mocks/              # Test mocks
├── unit/               # Unit tests
├── integration/        # Integration tests (future)
└── setup.ts            # Global test setup
```

## Adding a New Tool

1. **Create the schema** in `src/schemas/`:
   ```typescript
   // src/schemas/my-tool.schema.ts
   import { z } from 'zod';

   export const myToolParamsSchema = z.object({
     action: z.enum(['list', 'get', 'create']),
     id: z.string().uuid().optional(),
   });

   export type MyToolParams = z.infer<typeof myToolParamsSchema>;
   ```

2. **Create the orchestrator** in `src/tools/orchestration/`:
   ```typescript
   // src/tools/orchestration/my-tool.ts
   import { MCPResponse } from '../../api/base/index.js';
   import { ClientFactory } from '../../api/client-factory.js';
   import { MyToolParams } from '../../schemas/my-tool.schema.js';

   export class MyTool {
     constructor(private clientFactory: ClientFactory) {}

     async execute(params: MyToolParams): Promise<MCPResponse> {
       // Implementation
     }
   }
   ```

3. **Register the tool** in `src/tools/tool-registry.ts`:
   ```typescript
   import { myToolParamsSchema } from '../schemas/my-tool.schema.js';
   import { MyTool } from './orchestration/my-tool.js';

   toolRegistry.register({
     name: 'my_tool',
     schema: myToolParamsSchema,
     factory: (cf) => new MyTool(cf),
   });
   ```

4. **Add the tool definition** in `src/tools/tool-definitions.ts`

5. **Write tests** in `tests/unit/tools/my-tool.test.ts`

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(tools): add shape duplication support
fix(auth): handle session timeout correctly
docs(readme): update installation instructions
refactor(api): simplify error handling
test(logger): add sanitization tests
```

## Testing

### Running Tests

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

### Writing Tests

- Unit tests go in `tests/unit/`
- Use the mocks in `tests/mocks/`
- Follow the existing test patterns

Example:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { MyTool } from '../../src/tools/orchestration/my-tool.js';

describe('MyTool', () => {
  it('should list items', async () => {
    const mockFactory = createMockClientFactory();
    const tool = new MyTool(mockFactory);
    
    const result = await tool.execute({ action: 'list' });
    
    expect(result.isError).toBeFalsy();
  });
});
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Ensure tests pass: `npm test`
5. Ensure linting passes: `npm run lint`
6. Commit with conventional commit message
7. Push to your fork
8. Open a Pull Request

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated (if needed)
- [ ] Follows code style guidelines
- [ ] Conventional commit message used
- [ ] No breaking changes (or documented in PR)

## Reporting Issues

When reporting issues, please include:

1. **Environment**: Node.js version, OS
2. **Reproduction steps**: How to reproduce the issue
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Logs**: Any relevant error messages or logs

## Questions?

Feel free to open an issue for any questions about contributing.
