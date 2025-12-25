import { PenpotClientConfig } from './base/index.js';
import {
  ProjectsAPIClient,
  FilesAPIClient,
  ComponentsAPIClient,
  TokensAPIClient,
  ExportsAPIClient,
  CommentsAPIClient,
  TeamAPIClient,
  ProfileAPIClient,
  LibraryAPIClient,
  FileChangesAPIClient,
} from './domains/index.js';

export interface PenpotClient {
  projects: ProjectsAPIClient;
  files: FilesAPIClient;
  components: ComponentsAPIClient;
  tokens: TokensAPIClient;
  exports: ExportsAPIClient;
  comments: CommentsAPIClient;
  team: TeamAPIClient;
  profile: ProfileAPIClient;
  library: LibraryAPIClient;
  fileChanges: FileChangesAPIClient;
}

/**
 * Factory for creating Penpot API clients
 * Comprehensive client management for all Penpot domains
 */
export class ClientFactory {
  private config: PenpotClientConfig;
  private sharedProjectsClient: ProjectsAPIClient | null = null;
  private sharedFilesClient: FilesAPIClient | null = null;
  private sharedComponentsClient: ComponentsAPIClient | null = null;
  private sharedTokensClient: TokensAPIClient | null = null;
  private sharedExportsClient: ExportsAPIClient | null = null;
  private sharedCommentsClient: CommentsAPIClient | null = null;
  private sharedTeamClient: TeamAPIClient | null = null;
  private sharedProfileClient: ProfileAPIClient | null = null;
  private sharedLibraryClient: LibraryAPIClient | null = null;
  private sharedFileChangesClient: FileChangesAPIClient | null = null;

  constructor(config: PenpotClientConfig) {
    this.config = config;
  }

  /**
   * Create a full Penpot client with all domain APIs
   */
  createClient(): PenpotClient {
    return {
      projects: this.createProjectsClient(),
      files: this.createFilesClient(),
      components: this.createComponentsClient(),
      tokens: this.createTokensClient(),
      exports: this.createExportsClient(),
      comments: this.createCommentsClient(),
      team: this.createTeamClient(),
      profile: this.createProfileClient(),
      library: this.createLibraryClient(),
      fileChanges: this.createFileChangesClient(),
    };
  }

  /**
   * Create or return shared Projects API client
   */
  createProjectsClient(): ProjectsAPIClient {
    if (!this.sharedProjectsClient) {
      this.sharedProjectsClient = new ProjectsAPIClient(this.config);
    }
    return this.sharedProjectsClient;
  }

  /**
   * Create or return shared Files API client
   */
  createFilesClient(): FilesAPIClient {
    if (!this.sharedFilesClient) {
      this.sharedFilesClient = new FilesAPIClient(this.config);
    }
    return this.sharedFilesClient;
  }

  /**
   * Create or return shared Components API client
   */
  createComponentsClient(): ComponentsAPIClient {
    if (!this.sharedComponentsClient) {
      this.sharedComponentsClient = new ComponentsAPIClient(this.config);
    }
    return this.sharedComponentsClient;
  }

  /**
   * Create or return shared Tokens API client
   */
  createTokensClient(): TokensAPIClient {
    if (!this.sharedTokensClient) {
      this.sharedTokensClient = new TokensAPIClient(this.config);
    }
    return this.sharedTokensClient;
  }

  /**
   * Create or return shared Exports API client
   */
  createExportsClient(): ExportsAPIClient {
    if (!this.sharedExportsClient) {
      this.sharedExportsClient = new ExportsAPIClient(this.config);
    }
    return this.sharedExportsClient;
  }

  /**
   * Create or return shared Comments API client
   */
  createCommentsClient(): CommentsAPIClient {
    if (!this.sharedCommentsClient) {
      this.sharedCommentsClient = new CommentsAPIClient(this.config);
    }
    return this.sharedCommentsClient;
  }

  /**
   * Create or return shared Team API client
   */
  createTeamClient(): TeamAPIClient {
    if (!this.sharedTeamClient) {
      this.sharedTeamClient = new TeamAPIClient(this.config);
    }
    return this.sharedTeamClient;
  }

  /**
   * Create or return shared Profile API client
   */
  createProfileClient(): ProfileAPIClient {
    if (!this.sharedProfileClient) {
      this.sharedProfileClient = new ProfileAPIClient(this.config);
    }
    return this.sharedProfileClient;
  }

  /**
   * Create or return shared Library API client
   */
  createLibraryClient(): LibraryAPIClient {
    if (!this.sharedLibraryClient) {
      this.sharedLibraryClient = new LibraryAPIClient(this.config);
    }
    return this.sharedLibraryClient;
  }

  /**
   * Create or return shared FileChanges API client
   */
  createFileChangesClient(): FileChangesAPIClient {
    if (!this.sharedFileChangesClient) {
      this.sharedFileChangesClient = new FileChangesAPIClient(this.config);
    }
    return this.sharedFileChangesClient;
  }

  /**
   * Get the current config
   */
  getConfig(): PenpotClientConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<PenpotClientConfig>): void {
    this.config = { ...this.config, ...config };
    // Reset all clients to use new config
    this.resetClients();
  }

  /**
   * Reset all cached clients
   */
  resetClients(): void {
    this.sharedProjectsClient = null;
    this.sharedFilesClient = null;
    this.sharedComponentsClient = null;
    this.sharedTokensClient = null;
    this.sharedExportsClient = null;
    this.sharedCommentsClient = null;
    this.sharedTeamClient = null;
    this.sharedProfileClient = null;
    this.sharedLibraryClient = null;
    this.sharedFileChangesClient = null;
  }
}
