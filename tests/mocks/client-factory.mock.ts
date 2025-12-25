/**
 * Client Factory Mock
 *
 * Mock implementation of ClientFactory for testing tools
 */

import { vi } from 'vitest';

/**
 * Creates a mock ClientFactory with all API clients mocked
 */
export function createMockClientFactory() {
  const mockProjectsApi = {
    listProjects: vi.fn(),
    getProject: vi.fn(),
    createProject: vi.fn(),
    renameProject: vi.fn(),
    deleteProject: vi.fn(),
    duplicateProject: vi.fn(),
    moveProject: vi.fn(),
    getProjectFiles: vi.fn(),
    getProjectStats: vi.fn(),
  };

  const mockFilesApi = {
    getFile: vi.fn(),
    createFile: vi.fn(),
    renameFile: vi.fn(),
    deleteFile: vi.fn(),
    duplicateFile: vi.fn(),
    moveFile: vi.fn(),
    getPages: vi.fn(),
    getPageObjects: vi.fn(),
    updateFile: vi.fn(),
  };

  const mockComponentsApi = {
    listComponents: vi.fn(),
    getComponent: vi.fn(),
    searchComponents: vi.fn(),
    getComponentInstances: vi.fn(),
    createComponent: vi.fn(),
    deleteComponent: vi.fn(),
    renameComponent: vi.fn(),
  };

  const mockTokensApi = {
    getColors: vi.fn(),
    getColor: vi.fn(),
    createColor: vi.fn(),
    updateColor: vi.fn(),
    deleteColor: vi.fn(),
    getTypography: vi.fn(),
    createTypography: vi.fn(),
  };

  const mockExportsApi = {
    exportObject: vi.fn(),
    exportBatch: vi.fn(),
    exportPage: vi.fn(),
    exportFilePdf: vi.fn(),
  };

  const mockCommentsApi = {
    listThreads: vi.fn(),
    getThread: vi.fn(),
    createThread: vi.fn(),
    addComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  };

  const mockTeamApi = {
    listTeams: vi.fn(),
    getTeam: vi.fn(),
    createTeam: vi.fn(),
    renameTeam: vi.fn(),
    deleteTeam: vi.fn(),
    getMembers: vi.fn(),
  };

  const mockProfileApi = {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  };

  const mockLibraryApi = {
    getSharedLibraries: vi.fn(),
    linkLibrary: vi.fn(),
    unlinkLibrary: vi.fn(),
  };

  const mockFileChangesApi = {
    addFrame: vi.fn(),
    addRectangle: vi.fn(),
    addEllipse: vi.fn(),
    addText: vi.fn(),
    modifyObject: vi.fn(),
    deleteObject: vi.fn(),
  };

  return {
    get projects() {
      return mockProjectsApi;
    },
    get files() {
      return mockFilesApi;
    },
    get components() {
      return mockComponentsApi;
    },
    get tokens() {
      return mockTokensApi;
    },
    get exports() {
      return mockExportsApi;
    },
    get comments() {
      return mockCommentsApi;
    },
    get team() {
      return mockTeamApi;
    },
    get profile() {
      return mockProfileApi;
    },
    get library() {
      return mockLibraryApi;
    },
    get fileChanges() {
      return mockFileChangesApi;
    },
    // Expose mocks for assertions
    _mocks: {
      projects: mockProjectsApi,
      files: mockFilesApi,
      components: mockComponentsApi,
      tokens: mockTokensApi,
      exports: mockExportsApi,
      comments: mockCommentsApi,
      team: mockTeamApi,
      profile: mockProfileApi,
      library: mockLibraryApi,
      fileChanges: mockFileChangesApi,
    },
  };
}

export type MockClientFactory = ReturnType<typeof createMockClientFactory>;
