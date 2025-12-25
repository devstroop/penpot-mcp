import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';
import { FileChangesAPIClient } from './file-changes-api.js';

export interface ColorToken {
  id: string;
  name: string;
  color: string;
  opacity?: number;
  gradient?: unknown;
  path?: string;
  modified?: string;
}

export interface TypographyToken {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: string;
  path?: string;
}

/**
 * Tokens API Client - Full design tokens management
 * Handles colors, typography using the update-file changes API
 */
export class TokensAPIClient extends BaseAPIClient {
  private fileChanges: FileChangesAPIClient;

  constructor(config: ConstructorParameters<typeof BaseAPIClient>[0]) {
    super(config);
    this.fileChanges = new FileChangesAPIClient(config);
  }

  /**
   * Get color palette from a file
   */
  async getColors(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        data?: { colors?: Record<string, unknown> };
      };

      const colorsData = fileData.data?.colors || {};

      const colors = Object.entries(colorsData).map(([id, data]) => {
        const color = data as Record<string, unknown>;
        return {
          id: color['id'] || id.replace('~u', ''),
          name: color['name'] || 'Unnamed',
          color: color['color'],
          opacity: color['opacity'],
          gradient: color['gradient'],
          path: color['path'],
        };
      });

      return ResponseFormatter.formatList(colors, 'color', {
        total: colors.length,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `getColors(${fileId})`);
    }
  }

  /**
   * Get a specific color token
   */
  async getColor(fileId: string, colorId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        data?: { colors?: Record<string, unknown> };
      };

      const color = fileData.data?.colors?.[colorId];

      if (!color) {
        return ResponseFormatter.formatError(`Color not found: ${colorId}`);
      }

      return ResponseFormatter.formatSuccess(color, `Color: ${(color as Record<string, unknown>)['name']}`);
    } catch (error) {
      return ErrorHandler.handle(error, `getColor(${fileId}, ${colorId})`);
    }
  }

  /**
   * Create a color token using the update-file API
   */
  async createColor(fileId: string, name: string, color: string, opacity?: number): Promise<MCPResponse> {
    try {
      return await this.fileChanges.addColor(fileId, name, color, opacity);
    } catch (error) {
      logger.error('Error in createColor', error);
      return ErrorHandler.handle(error, 'createColor');
    }
  }

  /**
   * Update a color token
   */
  async updateColor(fileId: string, colorId: string, updates: Partial<ColorToken>): Promise<MCPResponse> {
    try {
      return await this.fileChanges.updateColor(fileId, colorId, {
        name: updates.name,
        color: updates.color,
        opacity: updates.opacity,
      });
    } catch (error) {
      logger.error('Error in updateColor', error);
      return ErrorHandler.handle(error, 'updateColor');
    }
  }

  /**
   * Delete a color token
   */
  async deleteColor(fileId: string, colorId: string): Promise<MCPResponse> {
    try {
      return await this.fileChanges.deleteColor(fileId, colorId);
    } catch (error) {
      logger.error('Error in deleteColor', error);
      return ErrorHandler.handle(error, 'deleteColor');
    }
  }

  /**
   * Get typography styles from a file
   */
  async getTypography(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        data?: { typographies?: Record<string, unknown> };
      };

      const typographiesData = fileData.data?.typographies || {};

      const typography = Object.entries(typographiesData).map(([id, data]) => {
        const typo = data as Record<string, unknown>;
        return {
          id,
          name: typo['name'] || 'Unnamed',
          fontFamily: typo['fontFamily'] || typo['font-family'],
          fontSize: typo['fontSize'] || typo['font-size'],
          fontWeight: typo['fontWeight'] || typo['font-weight'],
          fontStyle: typo['fontStyle'] || typo['font-style'],
          lineHeight: typo['lineHeight'] || typo['line-height'],
          letterSpacing: typo['letterSpacing'] || typo['letter-spacing'],
          textTransform: typo['textTransform'] || typo['text-transform'],
          path: typo['path'],
        };
      });

      return ResponseFormatter.formatList(typography, 'typography', {
        total: typography.length,
      });
    } catch (error) {
      return ErrorHandler.handle(error, `getTypography(${fileId})`);
    }
  }

  /**
   * Create a typography token
   */
  async createTypography(fileId: string, name: string, style: Partial<TypographyToken>): Promise<MCPResponse> {
    try {
      return await this.fileChanges.addTypography(fileId, name, {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize ? String(style.fontSize) : undefined,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        lineHeight: style.lineHeight ? String(style.lineHeight) : undefined,
        letterSpacing: style.letterSpacing ? String(style.letterSpacing) : undefined,
        textTransform: style.textTransform,
      });
    } catch (error) {
      logger.error('Error in createTypography', error);
      return ErrorHandler.handle(error, 'createTypography');
    }
  }

  /**
   * Get all design tokens from a file
   */
  async getAllTokens(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        name: string;
        data?: {
          colors?: Record<string, unknown>;
          typographies?: Record<string, unknown>;
        };
      };

      const data = fileData.data || {};

      const colors = Object.entries(data.colors || {}).map(([id, c]) => {
        const color = c as Record<string, unknown>;
        return {
          id,
          name: color['name'],
          value: color['color'],
          type: 'color',
        };
      });

      const typography = Object.entries(data.typographies || {}).map(([id, t]) => {
        const typo = t as Record<string, unknown>;
        return {
          id,
          name: typo['name'],
          fontFamily: typo['fontFamily'] || typo['font-family'],
          fontSize: typo['fontSize'] || typo['font-size'],
          type: 'typography',
        };
      });

      return ResponseFormatter.formatSuccess({
        colors,
        typography,
        summary: {
          colorCount: colors.length,
          typographyCount: typography.length,
        },
      }, `Design tokens for: ${fileData.name}`);
    } catch (error) {
      return ErrorHandler.handle(error, `getAllTokens(${fileId})`);
    }
  }

  /**
   * Search tokens by name
   */
  async searchTokens(fileId: string, query: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        data?: {
          colors?: Record<string, unknown>;
          typographies?: Record<string, unknown>;
        };
      };

      const data = fileData.data || {};
      const pattern = new RegExp(query, 'i');

      const colors = Object.entries(data.colors || {})
        .filter(([, c]) => pattern.test(String((c as Record<string, unknown>)['name'] || '')))
        .map(([id, c]) => ({
          id,
          name: (c as Record<string, unknown>)['name'],
          value: (c as Record<string, unknown>)['color'],
          type: 'color',
        }));

      const typography = Object.entries(data.typographies || {})
        .filter(([, t]) => pattern.test(String((t as Record<string, unknown>)['name'] || '')))
        .map(([id, t]) => ({
          id,
          name: (t as Record<string, unknown>)['name'],
          fontFamily: (t as Record<string, unknown>)['fontFamily'] || (t as Record<string, unknown>)['font-family'],
          type: 'typography',
        }));

      return ResponseFormatter.formatSuccess({
        colors,
        typography,
        total: colors.length + typography.length,
        query,
      }, `Found ${colors.length + typography.length} tokens matching "${query}"`);
    } catch (error) {
      return ErrorHandler.handle(error, `searchTokens(${fileId}, ${query})`);
    }
  }

  /**
   * Export tokens to CSS format
   */
  async exportTokensCSS(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        name: string;
        data?: {
          colors?: Record<string, unknown>;
          typographies?: Record<string, unknown>;
        };
      };

      const data = fileData.data || {};
      const lines: string[] = [
        `/* Design Tokens for: ${fileData.name} */`,
        `/* Generated by Penpot MCP */`,
        '',
        ':root {',
      ];

      // Export colors
      if (Object.keys(data.colors || {}).length > 0) {
        lines.push('  /* Colors */');
        for (const [id, c] of Object.entries(data.colors || {})) {
          const color = c as Record<string, unknown>;
          const name = this.toCSSVariable(String(color['name'] || id));
          const value = color['color'];
          const opacity = color['opacity'] as number | undefined;
          if (value) {
            if (opacity !== undefined && opacity < 1) {
              lines.push(`  --color-${name}: ${this.colorWithOpacity(String(value), opacity)};`);
            } else {
              lines.push(`  --color-${name}: ${value};`);
            }
          }
        }
        lines.push('');
      }

      // Export typography
      if (Object.keys(data.typographies || {}).length > 0) {
        lines.push('  /* Typography */');
        for (const [id, t] of Object.entries(data.typographies || {})) {
          const typo = t as Record<string, unknown>;
          const name = this.toCSSVariable(String(typo['name'] || id));
          const fontFamily = typo['fontFamily'] || typo['font-family'];
          const fontSize = typo['fontSize'] || typo['font-size'];
          const fontWeight = typo['fontWeight'] || typo['font-weight'];
          const lineHeight = typo['lineHeight'] || typo['line-height'];
          const letterSpacing = typo['letterSpacing'] || typo['letter-spacing'];
          
          if (fontFamily) lines.push(`  --font-family-${name}: ${fontFamily};`);
          if (fontSize) lines.push(`  --font-size-${name}: ${fontSize}px;`);
          if (fontWeight) lines.push(`  --font-weight-${name}: ${fontWeight};`);
          if (lineHeight) lines.push(`  --line-height-${name}: ${lineHeight};`);
          if (letterSpacing) lines.push(`  --letter-spacing-${name}: ${letterSpacing}px;`);
        }
      }

      lines.push('}');

      return ResponseFormatter.formatSuccess({
        format: 'css',
        content: lines.join('\n'),
        fileName: `${this.toCSSVariable(fileData.name)}-tokens.css`,
      }, `CSS tokens exported for: ${fileData.name}`);
    } catch (error) {
      return ErrorHandler.handle(error, `exportTokensCSS(${fileId})`);
    }
  }

  /**
   * Export tokens to JSON format
   */
  async exportTokensJSON(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        name: string;
        data?: {
          colors?: Record<string, unknown>;
          typographies?: Record<string, unknown>;
        };
      };

      const data = fileData.data || {};
      
      const tokens: Record<string, unknown> = {
        $schema: 'https://design-tokens.org/draft-token-spec.json',
        name: fileData.name,
        color: {},
        typography: {},
      };

      for (const [id, c] of Object.entries(data.colors || {})) {
        const color = c as Record<string, unknown>;
        const name = String(color['name'] || id);
        (tokens.color as Record<string, unknown>)[name] = {
          $type: 'color',
          $value: color['color'],
          ...(color['opacity'] !== undefined && { opacity: color['opacity'] }),
        };
      }

      for (const [id, t] of Object.entries(data.typographies || {})) {
        const typo = t as Record<string, unknown>;
        const name = String(typo['name'] || id);
        (tokens.typography as Record<string, unknown>)[name] = {
          $type: 'typography',
          $value: {
            fontFamily: typo['fontFamily'] || typo['font-family'],
            fontSize: typo['fontSize'] || typo['font-size'],
            fontWeight: typo['fontWeight'] || typo['font-weight'],
          },
        };
      }

      return ResponseFormatter.formatSuccess({
        format: 'json',
        content: JSON.stringify(tokens, null, 2),
        fileName: `${this.toCSSVariable(fileData.name)}-tokens.json`,
      }, `JSON tokens exported for: ${fileData.name}`);
    } catch (error) {
      return ErrorHandler.handle(error, `exportTokensJSON(${fileId})`);
    }
  }

  /**
   * Export tokens to SCSS format
   */
  async exportTokensSCSS(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        name: string;
        data?: {
          colors?: Record<string, unknown>;
          typographies?: Record<string, unknown>;
        };
      };

      const data = fileData.data || {};
      const lines: string[] = [
        `// Design Tokens for: ${fileData.name}`,
        `// Generated by Penpot MCP`,
        '',
      ];

      if (Object.keys(data.colors || {}).length > 0) {
        lines.push('// Colors');
        for (const [id, c] of Object.entries(data.colors || {})) {
          const color = c as Record<string, unknown>;
          const name = this.toCSSVariable(String(color['name'] || id));
          const value = color['color'];
          if (value) {
            lines.push(`$color-${name}: ${value};`);
          }
        }
        lines.push('');
      }

      return ResponseFormatter.formatSuccess({
        format: 'scss',
        content: lines.join('\n'),
        fileName: `${this.toCSSVariable(fileData.name)}-tokens.scss`,
      }, `SCSS tokens exported for: ${fileData.name}`);
    } catch (error) {
      return ErrorHandler.handle(error, `exportTokensSCSS(${fileId})`);
    }
  }

  /**
   * Export tokens to Tailwind CSS format
   */
  async exportTokensTailwind(fileId: string): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-file',
        { id: fileId },
        false
      );

      const fileData = this.normalizeTransitResponse(response) as {
        name: string;
        data?: {
          colors?: Record<string, unknown>;
          typographies?: Record<string, unknown>;
        };
      };

      const data = fileData.data || {};
      
      const config: Record<string, unknown> = {
        theme: {
          extend: {
            colors: {},
            fontFamily: {},
            fontSize: {},
          },
        },
      };

      const extend = (config.theme as Record<string, unknown>).extend as Record<string, unknown>;
      const colorsObj = extend.colors as Record<string, unknown>;
      const fontFamilyObj = extend.fontFamily as Record<string, unknown>;

      for (const [id, c] of Object.entries(data.colors || {})) {
        const color = c as Record<string, unknown>;
        const name = this.toCSSVariable(String(color['name'] || id));
        const value = color['color'];
        if (value) {
          colorsObj[name] = value;
        }
      }

      for (const [, t] of Object.entries(data.typographies || {})) {
        const typo = t as Record<string, unknown>;
        const name = this.toCSSVariable(String(typo['name']));
        const fontFamily = typo['fontFamily'] || typo['font-family'];
        if (fontFamily) {
          fontFamilyObj[name] = [fontFamily];
        }
      }

      const content = `// Tailwind config for: ${fileData.name}
// Generated by Penpot MCP

module.exports = ${JSON.stringify(config, null, 2)}`;

      return ResponseFormatter.formatSuccess({
        format: 'tailwind',
        content,
        fileName: `${this.toCSSVariable(fileData.name)}-tailwind.config.js`,
      }, `Tailwind config exported for: ${fileData.name}`);
    } catch (error) {
      return ErrorHandler.handle(error, `exportTokensTailwind(${fileId})`);
    }
  }

  async getTokenStats(fileId: string): Promise<MCPResponse> {
    try {
      const tokensResult = await this.getAllTokens(fileId);
      if (tokensResult.isError) return tokensResult;

      const data = JSON.parse((tokensResult.content[0] as { text: string }).text);
      const colors = data.data?.colors || [];
      const typography = data.data?.typography || [];

      return ResponseFormatter.formatSuccess({
        fileId,
        totalTokens: colors.length + typography.length,
        colors: { count: colors.length },
        typography: { count: typography.length },
      }, `Token statistics for file`);
    } catch (error) {
      return ErrorHandler.handle(error, `getTokenStats(${fileId})`);
    }
  }

  private toCSSVariable(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private colorWithOpacity(color: string, opacity: number): string {
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  }
}
