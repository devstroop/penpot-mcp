# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Pre-commit hooks with husky and lint-staged (Phase 5)
- CONTRIBUTING.md guide for contributors
- CHANGELOG.md for version tracking

## [1.0.0] - 2025-12-25

### Added

#### Phase 4: Quality
- **Test Infrastructure**: Vitest configuration with coverage thresholds
  - `vitest.config.ts` for test configuration
  - `tests/setup.ts` for global test setup
  - `tests/mocks/` directory with axios and client-factory mocks
  - 33 unit tests for logger, config, and retry utilities
- **Retry Utility**: `src/utils/retry.ts` with exponential backoff and jitter
  - `retryWithBackoff()` function with configurable options
  - `withRetry()` wrapper for any async function
  - Configurable retry conditions
- **Enhanced Logging**: Verbose request/response logging in base-client
  - Request ID tracking for correlation
  - Request timing information
  - Header sanitization for security

#### Phase 3: Architecture
- **Tool Registry**: `src/tools/tool-registry.ts`
  - Centralized tool registration and management
  - Lazy tool instantiation (only when first called)
  - Schema-based validation at registry level
  - Replaced 65-line switch statement in server-core.ts

#### Phase 2: Foundation
- **Error Hierarchy**: `src/errors/index.ts`
  - `PenpotError` base class with `toMCPResponse()` method
  - Specialized errors: `AuthenticationError`, `NotFoundError`, `RateLimitError`, `CloudFlareError`, `ValidationError`, `InternalError`
  - Consistent error handling across the codebase
- **Constants Module**: `src/constants/index.ts`
  - `TOOL_NAMES`, `ENDPOINTS`, `ACTIONS`, `DEFAULTS`, `HTTP_STATUS`
  - Eliminates magic strings throughout codebase
- **Config Validation**: Zod schema validation in `src/config.ts`
  - URL validation and normalization
  - Log level enum validation
  - Helpful error messages
- **Project Tooling**:
  - ESLint configuration (`eslint.config.js`)
  - Prettier configuration (`.prettierrc`)
  - MIT License file
  - Package.json scripts for linting, formatting, and type checking

#### Phase 1: Critical Security
- **Runtime Parameter Validation**: Zod schemas for all 15 tools
  - `src/schemas/*.ts` - 14 schema files
  - `validateParams()` method in server-core.ts
  - Type-safe parameter handling
- **Log Sanitization**: Sensitive data redaction in logger
  - `SENSITIVE_KEYS` list for automatic redaction
  - `sanitize()` method for deep object sanitization
  - Prevents credential exposure in logs

### Changed
- `src/server-core.ts` reduced from ~280 to ~150 lines
- `src/logger.ts` now exports `Logger` class (was only exporting instance)
- Logger uses proper console methods (debug, info, warn, error)
- Tool types now re-exported from schemas

### Security
- Runtime validation prevents malformed input from causing crashes
- Sensitive data (passwords, tokens, cookies) automatically redacted from logs
- API request headers sanitized before logging

## [0.1.0] - 2025-12-01

### Added
- Initial implementation of Penpot MCP Server
- 15 MCP tools for Penpot platform integration:
  - `projects`: Project management (list, create, rename, delete, etc.)
  - `files`: File operations (get, create, modify, etc.)
  - `components`: Component management
  - `tokens`: Design token operations
  - `exports`: Export functionality
  - `comments`: Comment management
  - `team`: Team operations
  - `profile`: User profile access
  - `library`: Library management
  - `search`: Search functionality
  - `analyze`: Design analysis
  - `shapes`: Shape operations
  - `navigate`: Navigation helpers
  - `inspect`: Design inspection
  - `assets`: Asset management
- API client architecture with Transit+JSON support
- Basic error handling
- Configuration via environment variables
- README with usage instructions
- CAPABILITIES.md documenting all tool capabilities
