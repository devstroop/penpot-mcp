import dotenv from 'dotenv';
import { z } from 'zod';
import { DEFAULTS } from './constants/index.js';

dotenv.config();

/**
 * Environment variable schema with validation and defaults
 */
const envSchema = z.object({
  // Required credentials
  PENPOT_USERNAME: z.string().email('PENPOT_USERNAME must be a valid email address'),
  PENPOT_PASSWORD: z.string().min(1, 'PENPOT_PASSWORD is required'),

  // Optional with defaults
  PENPOT_API_URL: z.string().url('PENPOT_API_URL must be a valid URL').default(DEFAULTS.API_URL),
  PENPOT_PROJECT_ID: z.string().uuid('PENPOT_PROJECT_ID must be a valid UUID').optional(),

  // Server config
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default(DEFAULTS.LOG_LEVEL),
  PORT: z.coerce.number().min(1).max(65535).default(DEFAULTS.PORT),
});

type EnvConfig = z.infer<typeof envSchema>;

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
  private validated = false;

  constructor() {
    // Initialize with raw env values - validation happens in validate()
    this.config = {
      username: process.env['PENPOT_USERNAME'] || '',
      password: process.env['PENPOT_PASSWORD'] || '',
      baseUrl: process.env['PENPOT_API_URL'] || DEFAULTS.API_URL,
      defaultProjectId: process.env['PENPOT_PROJECT_ID'],
    };

    this.serverConfig = {
      port: parseInt(process.env['PORT'] || String(DEFAULTS.PORT), 10),
      logLevel: process.env['LOG_LEVEL'] || DEFAULTS.LOG_LEVEL,
    };
  }

  /**
   * Validates all configuration using Zod schema.
   * Throws a detailed error if validation fails.
   */
  validate(): void {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      const errors = result.error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');

      throw new Error(
        `Configuration validation failed:\n${errors}\n\n` +
          'Please check your .env file or environment variables.'
      );
    }

    // Update config with validated/transformed values
    const env = result.data;
    this.config = {
      username: env.PENPOT_USERNAME,
      password: env.PENPOT_PASSWORD,
      baseUrl: env.PENPOT_API_URL,
      defaultProjectId: env.PENPOT_PROJECT_ID,
    };

    this.serverConfig = {
      port: env.PORT,
      logLevel: env.LOG_LEVEL,
    };

    this.validated = true;
  }

  get(): PenpotConfig {
    if (!this.validated) {
      throw new Error('Configuration not validated. Call validate() first.');
    }
    return { ...this.config };
  }

  getServerConfig(): ServerConfig {
    if (!this.validated) {
      throw new Error('Configuration not validated. Call validate() first.');
    }
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
