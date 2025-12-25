import dotenv from 'dotenv';

dotenv.config();

export interface PenpotConfig {
  username: string;
  password: string;
  baseUrl: string;
  defaultProjectId?: string;
}

export interface ServerConfig {
  port: number;
  logLevel: string;
}

export class ConfigManager {
  private config: PenpotConfig;
  private serverConfig: ServerConfig;

  constructor() {
    this.config = {
      username: process.env['PENPOT_USERNAME'] || '',
      password: process.env['PENPOT_PASSWORD'] || '',
      baseUrl: process.env['PENPOT_API_URL'] || 'https://design.penpot.app/api',
      defaultProjectId: process.env['PENPOT_PROJECT_ID'],
    };

    this.serverConfig = {
      port: parseInt(process.env['PORT'] || '3002', 10),
      logLevel: process.env['LOG_LEVEL'] || 'info',
    };
  }

  validate(): void {
    if (!this.config.username || !this.config.password) {
      throw new Error(
        'PENPOT_USERNAME and PENPOT_PASSWORD environment variables are required. ' +
        'Set your Penpot account credentials to authenticate.'
      );
    }
  }

  get(): PenpotConfig {
    return { ...this.config };
  }

  getServerConfig(): ServerConfig {
    return { ...this.serverConfig };
  }

  hasDefaultProjectId(): boolean {
    return !!this.config.defaultProjectId;
  }

  /**
   * Resolve project ID with optional scoping
   * If defaultProjectId is configured, it enforces that scope
   */
  resolveProjectId(providedProjectId?: string): string | undefined {
    const configuredProjectId = this.config.defaultProjectId;
    
    if (configuredProjectId) {
      return configuredProjectId;
    }
    
    return providedProjectId;
  }
}
