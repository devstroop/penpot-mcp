/**
 * Global Test Setup
 *
 * Configures the test environment with:
 * - Environment variable mocking
 * - Global test utilities
 * - Custom matchers (if needed)
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock environment variables for all tests
beforeAll(() => {
  // Set required env vars for tests
  process.env['PENPOT_USERNAME'] = 'test@example.com';
  process.env['PENPOT_PASSWORD'] = 'test-password';
  process.env['PENPOT_API_URL'] = 'https://test.penpot.app/api';
  process.env['LOG_LEVEL'] = 'error'; // Minimize log noise in tests
  process.env['MCP_SERVER'] = 'false';
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// Global cleanup
afterAll(() => {
  vi.resetAllMocks();
});

/**
 * Helper to create a mock MCPResponse
 */
export function createMockResponse(data: unknown, isError = false) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
    isError,
  };
}

/**
 * Helper to create a mock Axios response
 */
export function createMockAxiosResponse<T>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: { headers: {} as any },
  };
}

/**
 * Sample UUIDs for testing
 */
export const TEST_IDS = {
  projectId: '550e8400-e29b-41d4-a716-446655440001',
  fileId: '550e8400-e29b-41d4-a716-446655440002',
  pageId: '550e8400-e29b-41d4-a716-446655440003',
  teamId: '550e8400-e29b-41d4-a716-446655440004',
  componentId: '550e8400-e29b-41d4-a716-446655440005',
  objectId: '550e8400-e29b-41d4-a716-446655440006',
};
