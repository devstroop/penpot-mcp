/**
 * Axios Mock Utilities
 *
 * Provides helpers for mocking Axios requests in tests
 */

import { vi } from 'vitest';
import type { AxiosInstance, AxiosResponse } from 'axios';

/**
 * Creates a mock Axios instance for testing
 */
export function createMockAxiosInstance(): {
  instance: Partial<AxiosInstance>;
  mockPost: ReturnType<typeof vi.fn>;
  mockGet: ReturnType<typeof vi.fn>;
} {
  const mockPost = vi.fn();
  const mockGet = vi.fn();

  const instance: Partial<AxiosInstance> = {
    post: mockPost,
    get: mockGet,
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    } as any,
    defaults: {
      headers: {
        common: {},
      },
    } as any,
  };

  return { instance, mockPost, mockGet };
}

/**
 * Creates a successful Axios response
 */
export function mockAxiosSuccess<T>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: { headers: {} } as any,
  };
}

/**
 * Creates an Axios error response
 */
export function mockAxiosError(message: string, status = 500) {
  const error = new Error(message) as any;
  error.response = {
    status,
    data: { error: message },
  };
  error.isAxiosError = true;
  return error;
}

/**
 * Mock Transit+JSON response data
 */
export const MOCK_TRANSIT_RESPONSES = {
  // Login response
  login: {
    '~:id': '~u550e8400-e29b-41d4-a716-446655440000',
    '~:email': 'test@example.com',
    '~:fullname': 'Test User',
  },

  // Projects list
  projects: [
    {
      '~:id': '~u550e8400-e29b-41d4-a716-446655440001',
      '~:name': 'Test Project',
      '~:team-id': '~u550e8400-e29b-41d4-a716-446655440004',
    },
  ],

  // File data
  file: {
    '~:id': '~u550e8400-e29b-41d4-a716-446655440002',
    '~:name': 'Test File',
    '~:project-id': '~u550e8400-e29b-41d4-a716-446655440001',
    '~:data': {
      '~:pages': ['~u550e8400-e29b-41d4-a716-446655440003'],
    },
  },
};
