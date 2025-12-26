import { PenpotClientConfig, AuthSessionManager } from './base/index.js';
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
  MediaAPIClient,
  FontAPIClient,
  ShareAPIClient,
  WebhooksAPIClient,
  TemplatesAPIClient,
  TrashAPIClient,
  AccessTokensAPIClient,
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
  media: MediaAPIClient;
  fonts: FontAPIClient;
  share: ShareAPIClient;
  webhooks: WebhooksAPIClient;
  templates: TemplatesAPIClient;
  trash: TrashAPIClient;
  accessTokens: AccessTokensAPIClient;
}

/**
 * Factory for creating Penpot API clients
 * Comprehensive client management for all Penpot domains
 *
 * IMPORTANT: Uses a shared AuthSessionManager to prevent duplicate authentication
 * requests across all API clients.
 */
export class ClientFactory {
  private config: PenpotClientConfig;
  private authSession: AuthSessionManager;
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
  private sharedMediaClient: MediaAPIClient | null = null;
  private sharedFontsClient: FontAPIClient | null = null;
  private sharedShareClient: ShareAPIClient | null = null;
  private sharedWebhooksClient: WebhooksAPIClient | null = null;
  private sharedTemplatesClient: TemplatesAPIClient | null = null;
  private sharedTrashClient: TrashAPIClient | null = null;
  private sharedAccessTokensClient: AccessTokensAPIClient | null = null;

  constructor(config: PenpotClientConfig) {
    this.config = config;
    // Create ONE shared auth session for ALL clients
    // Supports both access token and username/password authentication
    this.authSession = new AuthSessionManager(
      config.baseURL,
      config.accessToken,
      config.username,
      config.password
    );
  }

  /**
   * Get config with shared auth session injected
   */
  private getConfigWithSession(): PenpotClientConfig {
    return {
      ...this.config,
      authSession: this.authSession,
    };
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
      media: this.createMediaClient(),
      fonts: this.createFontsClient(),
      share: this.createShareClient(),
      webhooks: this.createWebhooksClient(),
      templates: this.createTemplatesClient(),
      trash: this.createTrashClient(),
      accessTokens: this.createAccessTokensClient(),
    };
  }

  /**
   * Create or return shared Projects API client
   */
  createProjectsClient(): ProjectsAPIClient {
    if (!this.sharedProjectsClient) {
      this.sharedProjectsClient = new ProjectsAPIClient(this.getConfigWithSession());
    }
    return this.sharedProjectsClient;
  }

  /**
   * Create or return shared Files API client
   */
  createFilesClient(): FilesAPIClient {
    if (!this.sharedFilesClient) {
      this.sharedFilesClient = new FilesAPIClient(this.getConfigWithSession());
    }
    return this.sharedFilesClient;
  }

  /**
   * Create or return shared Components API client
   */
  createComponentsClient(): ComponentsAPIClient {
    if (!this.sharedComponentsClient) {
      this.sharedComponentsClient = new ComponentsAPIClient(this.getConfigWithSession());
    }
    return this.sharedComponentsClient;
  }

  /**
   * Create or return shared Tokens API client
   */
  createTokensClient(): TokensAPIClient {
    if (!this.sharedTokensClient) {
      this.sharedTokensClient = new TokensAPIClient(this.getConfigWithSession());
    }
    return this.sharedTokensClient;
  }

  /**
   * Create or return shared Exports API client
   */
  createExportsClient(): ExportsAPIClient {
    if (!this.sharedExportsClient) {
      this.sharedExportsClient = new ExportsAPIClient(this.getConfigWithSession());
    }
    return this.sharedExportsClient;
  }

  /**
   * Create or return shared Comments API client
   */
  createCommentsClient(): CommentsAPIClient {
    if (!this.sharedCommentsClient) {
      this.sharedCommentsClient = new CommentsAPIClient(this.getConfigWithSession());
    }
    return this.sharedCommentsClient;
  }

  /**
   * Create or return shared Team API client
   */
  createTeamClient(): TeamAPIClient {
    if (!this.sharedTeamClient) {
      this.sharedTeamClient = new TeamAPIClient(this.getConfigWithSession());
    }
    return this.sharedTeamClient;
  }

  /**
   * Create or return shared Profile API client
   */
  createProfileClient(): ProfileAPIClient {
    if (!this.sharedProfileClient) {
      this.sharedProfileClient = new ProfileAPIClient(this.getConfigWithSession());
    }
    return this.sharedProfileClient;
  }

  /**
   * Create or return shared Library API client
   */
  createLibraryClient(): LibraryAPIClient {
    if (!this.sharedLibraryClient) {
      this.sharedLibraryClient = new LibraryAPIClient(this.getConfigWithSession());
    }
    return this.sharedLibraryClient;
  }

  /**
   * Create or return shared FileChanges API client
   */
  createFileChangesClient(): FileChangesAPIClient {
    if (!this.sharedFileChangesClient) {
      this.sharedFileChangesClient = new FileChangesAPIClient(this.getConfigWithSession());
    }
    return this.sharedFileChangesClient;
  }

  /**
   * Create or return shared Media API client
   */
  createMediaClient(): MediaAPIClient {
    if (!this.sharedMediaClient) {
      this.sharedMediaClient = new MediaAPIClient(this.getConfigWithSession());
    }
    return this.sharedMediaClient;
  }

  /**
   * Create or return shared Fonts API client
   */
  createFontsClient(): FontAPIClient {
    if (!this.sharedFontsClient) {
      this.sharedFontsClient = new FontAPIClient(this.getConfigWithSession());
    }
    return this.sharedFontsClient;
  }

  /**
   * Create or return shared Share API client
   */
  createShareClient(): ShareAPIClient {
    if (!this.sharedShareClient) {
      this.sharedShareClient = new ShareAPIClient(this.getConfigWithSession());
    }
    return this.sharedShareClient;
  }

  /**
   * Create or return shared Webhooks API client
   */
  createWebhooksClient(): WebhooksAPIClient {
    if (!this.sharedWebhooksClient) {
      this.sharedWebhooksClient = new WebhooksAPIClient(this.getConfigWithSession());
    }
    return this.sharedWebhooksClient;
  }

  /**
   * Create or return shared Templates API client
   */
  createTemplatesClient(): TemplatesAPIClient {
    if (!this.sharedTemplatesClient) {
      this.sharedTemplatesClient = new TemplatesAPIClient(this.getConfigWithSession());
    }
    return this.sharedTemplatesClient;
  }

  /**
   * Create or return shared Trash API client
   */
  createTrashClient(): TrashAPIClient {
    if (!this.sharedTrashClient) {
      this.sharedTrashClient = new TrashAPIClient(this.getConfigWithSession());
    }
    return this.sharedTrashClient;
  }

  /**
   * Create or return shared Access Tokens API client
   */
  createAccessTokensClient(): AccessTokensAPIClient {
    if (!this.sharedAccessTokensClient) {
      this.sharedAccessTokensClient = new AccessTokensAPIClient(this.getConfigWithSession());
    }
    return this.sharedAccessTokensClient;
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
   * Reset all cached clients and clear auth session
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
    this.sharedMediaClient = null;
    this.sharedFontsClient = null;
    this.sharedShareClient = null;
    this.sharedWebhooksClient = null;
    this.sharedTemplatesClient = null;
    this.sharedTrashClient = null;
    this.sharedAccessTokensClient = null;
    // Clear auth session when resetting clients
    this.authSession.clearSession();
  }

  /**
   * Get the shared auth session manager
   */
  getAuthSession(): AuthSessionManager {
    return this.authSession;
  }
}
