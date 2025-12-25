import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { AnalyzeParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Analyze Tool - Design analysis and insights
 */
export class AnalyzeTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: AnalyzeParams): Promise<MCPResponse> {
    const { action, fileId } = params;
    const client = this.clientFactory.createClient();

    logger.debug('AnalyzeTool executing', { action, fileId });

    switch (action) {
      case 'file_structure':
        return client.files.analyzeFileStructure(fileId);

      case 'design_system':
        return this.analyzeDesignSystem(fileId);

      case 'accessibility':
        return this.analyzeAccessibility(fileId, params.pageId, params.options);

      case 'naming':
        return this.analyzeNaming(fileId, params.pageId);

      case 'components':
        return this.analyzeComponents(fileId);

      case 'duplicates':
        return this.findDuplicates(fileId);

      case 'unused':
        return this.findUnused(fileId);

      case 'compare':
        if (!params.compareFileId) {
          return ResponseFormatter.formatError('compareFileId is required for compare action');
        }
        return this.compareFiles(fileId, params.compareFileId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }

  private async analyzeDesignSystem(fileId: string): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();

    try {
      // Get tokens
      const tokensResult = await client.tokens.getAllTokens(fileId);
      const componentsResult = await client.components.getComponentStats(fileId);
      const fileResult = await client.files.getFile(fileId);

      const tokens = !tokensResult.isError 
        ? JSON.parse((tokensResult.content[0] as any).text)
        : { colors: [], typography: [] };
      
      const components = !componentsResult.isError
        ? JSON.parse((componentsResult.content[0] as any).text)
        : { totalComponents: 0 };

      const file = !fileResult.isError
        ? JSON.parse((fileResult.content[0] as any).text)
        : {};

      // Analyze color palette
      const colorAnalysis = this.analyzeColors(tokens.colors || []);
      
      // Analyze typography scale
      const typographyAnalysis = this.analyzeTypography(tokens.typography || []);

      return ResponseFormatter.formatSuccess({
        fileId,
        fileName: file.name,
        designSystem: {
          colors: {
            total: tokens.colors?.length || 0,
            ...colorAnalysis,
          },
          typography: {
            total: tokens.typography?.length || 0,
            ...typographyAnalysis,
          },
          components: {
            total: components.totalComponents || 0,
            withAnnotations: components.withAnnotations || 0,
          },
        },
        recommendations: this.getDesignSystemRecommendations(tokens, components),
      }, 'Design system analysis complete');
    } catch (error) {
      logger.error('Design system analysis failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  private analyzeColors(colors: any[]): Record<string, any> {
    const hues: Record<string, number> = {};
    const hasOpacity = colors.filter(c => c.opacity && c.opacity < 1).length;

    for (const color of colors) {
      const hue = this.getColorCategory(color.color || color.value || '');
      hues[hue] = (hues[hue] || 0) + 1;
    }

    return {
      byHue: hues,
      withOpacity: hasOpacity,
      hasGradients: colors.filter(c => c.gradient).length,
    };
  }

  private analyzeTypography(typography: any[]): Record<string, any> {
    const fonts = new Set<string>();
    const sizes = new Set<number>();

    for (const t of typography) {
      if (t.fontFamily) fonts.add(t.fontFamily);
      if (t.fontSize) sizes.add(t.fontSize);
    }

    return {
      uniqueFonts: fonts.size,
      fontFamilies: Array.from(fonts),
      uniqueSizes: sizes.size,
      sizeRange: {
        min: Math.min(...Array.from(sizes)),
        max: Math.max(...Array.from(sizes)),
      },
    };
  }

  private getDesignSystemRecommendations(tokens: any, components: any): string[] {
    const recommendations: string[] = [];

    if ((tokens.colors?.length || 0) < 5) {
      recommendations.push('Consider defining more color tokens for a complete palette');
    }
    if ((tokens.colors?.length || 0) > 30) {
      recommendations.push('Large color palette - consider consolidating similar colors');
    }
    if ((tokens.typography?.length || 0) < 3) {
      recommendations.push('Define more typography styles (heading, body, caption)');
    }
    if ((components.totalComponents || 0) === 0) {
      recommendations.push('Create reusable components to maintain consistency');
    }
    if ((components.withAnnotations || 0) === 0 && (components.totalComponents || 0) > 0) {
      recommendations.push('Add annotations to components for documentation');
    }

    return recommendations;
  }

  private async analyzeAccessibility(fileId: string, pageId?: string, options?: any): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();
    const minContrast = options?.minContrastRatio || 4.5;
    const minFontSize = options?.minFontSize || 12;

    try {
      const issues: any[] = [];
      
      // Get file pages
      const pagesResult = await client.files.getFilePages(fileId);
      if (pagesResult.isError) return pagesResult;

      const pages = JSON.parse((pagesResult.content[0] as any).text)?.items || [];
      const targetPages = pageId ? pages.filter((p: any) => p.id === pageId) : pages;

      for (const page of targetPages.slice(0, 5)) {
        const objectsResult = await client.files.getPageObjects(fileId, page.id);
        if (objectsResult.isError) continue;

        const objects = JSON.parse((objectsResult.content[0] as any).text)?.items || [];

        for (const obj of objects) {
          // Check text size
          if (obj.type === 'text') {
            const fontSize = obj.fontSize || obj.content?.fontSize;
            if (fontSize && fontSize < minFontSize) {
              issues.push({
                type: 'text-too-small',
                severity: 'warning',
                objectId: obj.id,
                objectName: obj.name,
                pageId: page.id,
                pageName: page.name,
                detail: `Font size ${fontSize}px is below minimum ${minFontSize}px`,
              });
            }
          }

          // Check for missing alt text on images
          if (obj.type === 'image' && !obj.accessibilityAlt) {
            issues.push({
              type: 'missing-alt-text',
              severity: 'error',
              objectId: obj.id,
              objectName: obj.name,
              pageId: page.id,
              pageName: page.name,
              detail: 'Image missing accessibility alt text',
            });
          }
        }
      }

      return ResponseFormatter.formatSuccess({
        fileId,
        issues,
        summary: {
          total: issues.length,
          errors: issues.filter(i => i.severity === 'error').length,
          warnings: issues.filter(i => i.severity === 'warning').length,
          byType: issues.reduce((acc, i) => {
            acc[i.type] = (acc[i.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
        criteria: { minContrast, minFontSize },
      }, `Found ${issues.length} accessibility issues`);
    } catch (error) {
      logger.error('Accessibility analysis failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  private async analyzeNaming(fileId: string, pageId?: string): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();

    try {
      const issues: any[] = [];
      const stats = {
        totalObjects: 0,
        defaultNames: 0,
        wellNamed: 0,
        patterns: {} as Record<string, number>,
      };

      const pagesResult = await client.files.getFilePages(fileId);
      if (pagesResult.isError) return pagesResult;

      const pages = JSON.parse((pagesResult.content[0] as any).text)?.items || [];
      const targetPages = pageId ? pages.filter((p: any) => p.id === pageId) : pages;

      const defaultNamePatterns = [
        /^Frame \d+$/,
        /^Rectangle$/,
        /^Ellipse$/,
        /^Text$/,
        /^Group$/,
        /^Path$/,
        /^Component \d+$/,
      ];

      for (const page of targetPages.slice(0, 5)) {
        const objectsResult = await client.files.getPageObjects(fileId, page.id);
        if (objectsResult.isError) continue;

        const objects = JSON.parse((objectsResult.content[0] as any).text)?.items || [];

        for (const obj of objects) {
          stats.totalObjects++;
          const name = obj.name || '';

          // Check for default names
          const isDefault = defaultNamePatterns.some(p => p.test(name));
          if (isDefault) {
            stats.defaultNames++;
            issues.push({
              type: 'default-name',
              objectId: obj.id,
              objectName: name,
              objectType: obj.type,
              pageId: page.id,
              suggestion: `Consider renaming "${name}" to describe its purpose`,
            });
          } else {
            stats.wellNamed++;
          }

          // Track naming patterns
          const pattern = name.split(/[\s_-]/)[0] || 'unnamed';
          stats.patterns[pattern] = (stats.patterns[pattern] || 0) + 1;
        }
      }

      return ResponseFormatter.formatSuccess({
        fileId,
        stats,
        issues: issues.slice(0, 50), // Limit issues
        namingScore: stats.totalObjects > 0 
          ? Math.round((stats.wellNamed / stats.totalObjects) * 100)
          : 100,
        recommendations: [
          stats.defaultNames > 10 ? 'Many objects have default names - consider renaming for clarity' : null,
          Object.keys(stats.patterns).length < 3 ? 'Consider using consistent naming prefixes' : null,
        ].filter(Boolean),
      }, `Naming analysis: ${stats.wellNamed}/${stats.totalObjects} well-named`);
    } catch (error) {
      logger.error('Naming analysis failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  private async analyzeComponents(fileId: string): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();

    try {
      const componentsResult = await client.components.getFileComponents(fileId);
      if (componentsResult.isError) return componentsResult;

      const components = JSON.parse((componentsResult.content[0] as any).text)?.items || [];
      const stats: Record<string, any> = {
        total: components.length,
        withAnnotations: 0,
        byPath: {} as Record<string, number>,
        instanceCounts: [] as any[],
      };

      for (const comp of components) {
        if (comp.annotation) stats.withAnnotations++;
        
        const path = (comp.path || []).join('/') || 'root';
        stats.byPath[path] = (stats.byPath[path] || 0) + 1;

        // Get instance count
        const instancesResult = await client.components.getComponentInstances(fileId, comp.id);
        if (!instancesResult.isError) {
          const instances = JSON.parse((instancesResult.content[0] as any).text)?.items || [];
          stats.instanceCounts.push({
            componentId: comp.id,
            componentName: comp.name,
            instances: instances.length,
          });
        }
      }

      // Sort by usage
      stats.instanceCounts.sort((a: { instances: number }, b: { instances: number }) => b.instances - a.instances);

      const mostUsed = stats.instanceCounts.slice(0, 5);
      const unused = stats.instanceCounts.filter((c: any) => c.instances === 0);

      return ResponseFormatter.formatSuccess({
        fileId,
        stats,
        mostUsed,
        unused,
        coverage: stats.total > 0 
          ? Math.round((stats.withAnnotations / stats.total) * 100)
          : 0,
        recommendations: [
          unused.length > 0 ? `${unused.length} components have no instances - consider removing` : null,
          stats.withAnnotations === 0 && stats.total > 0 ? 'Add annotations to document component usage' : null,
        ].filter(Boolean),
      }, `Component analysis: ${stats.total} components`);
    } catch (error) {
      logger.error('Component analysis failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  private async findDuplicates(fileId: string): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();

    try {
      // Get colors and typography
      const colorsResult = await client.tokens.getColors(fileId);
      const typographyResult = await client.tokens.getTypography(fileId);

      const duplicates: any[] = [];

      // Find duplicate colors
      if (!colorsResult.isError) {
        const colors = JSON.parse((colorsResult.content[0] as any).text)?.items || [];
        const colorValues: Record<string, any[]> = {};

        for (const color of colors) {
          const value = color.color?.toLowerCase();
          if (value) {
            if (!colorValues[value]) colorValues[value] = [];
            colorValues[value].push(color);
          }
        }

        for (const [value, items] of Object.entries(colorValues)) {
          if (items.length > 1) {
            duplicates.push({
              type: 'color',
              value,
              count: items.length,
              items: items.map(i => ({ id: i.id, name: i.name })),
            });
          }
        }
      }

      // Find duplicate typography
      if (!typographyResult.isError) {
        const typography = JSON.parse((typographyResult.content[0] as any).text)?.items || [];
        const typoValues: Record<string, any[]> = {};

        for (const typo of typography) {
          const key = `${typo.fontFamily}-${typo.fontSize}-${typo.fontWeight}`;
          if (!typoValues[key]) typoValues[key] = [];
          typoValues[key].push(typo);
        }

        for (const [key, items] of Object.entries(typoValues)) {
          if (items.length > 1) {
            duplicates.push({
              type: 'typography',
              value: key,
              count: items.length,
              items: items.map(i => ({ id: i.id, name: i.name })),
            });
          }
        }
      }

      return ResponseFormatter.formatSuccess({
        fileId,
        duplicates,
        summary: {
          total: duplicates.length,
          colors: duplicates.filter(d => d.type === 'color').length,
          typography: duplicates.filter(d => d.type === 'typography').length,
        },
      }, `Found ${duplicates.length} potential duplicates`);
    } catch (error) {
      logger.error('Duplicate analysis failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  private async findUnused(fileId: string): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();

    try {
      // This would require deeper analysis of the file structure
      // For now, we'll check unused components
      const componentsResult = await client.components.getFileComponents(fileId);
      
      if (componentsResult.isError) return componentsResult;

      const components = JSON.parse((componentsResult.content[0] as any).text)?.items || [];
      const unused: any[] = [];

      for (const comp of components.slice(0, 20)) { // Limit for performance
        const instancesResult = await client.components.getComponentInstances(fileId, comp.id);
        if (!instancesResult.isError) {
          const instances = JSON.parse((instancesResult.content[0] as any).text)?.items || [];
          if (instances.length === 0) {
            unused.push({
              type: 'component',
              id: comp.id,
              name: comp.name,
              path: comp.path,
            });
          }
        }
      }

      return ResponseFormatter.formatSuccess({
        fileId,
        unused,
        summary: {
          unusedComponents: unused.length,
        },
        recommendations: unused.length > 0 
          ? ['Consider removing unused components to clean up the file']
          : ['No unused components found'],
      }, `Found ${unused.length} unused items`);
    } catch (error) {
      logger.error('Unused analysis failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  private async compareFiles(fileId1: string, fileId2: string): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();

    try {
      const [file1Result, file2Result] = await Promise.all([
        client.files.getFile(fileId1),
        client.files.getFile(fileId2),
      ]);

      const [tokens1Result, tokens2Result] = await Promise.all([
        client.tokens.getAllTokens(fileId1),
        client.tokens.getAllTokens(fileId2),
      ]);

      const [components1Result, components2Result] = await Promise.all([
        client.components.getFileComponents(fileId1),
        client.components.getFileComponents(fileId2),
      ]);

      const file1 = !file1Result.isError ? JSON.parse((file1Result.content[0] as any).text) : {};
      const file2 = !file2Result.isError ? JSON.parse((file2Result.content[0] as any).text) : {};

      const tokens1 = !tokens1Result.isError ? JSON.parse((tokens1Result.content[0] as any).text) : {};
      const tokens2 = !tokens2Result.isError ? JSON.parse((tokens2Result.content[0] as any).text) : {};

      const components1 = !components1Result.isError ? JSON.parse((components1Result.content[0] as any).text)?.items || [] : [];
      const components2 = !components2Result.isError ? JSON.parse((components2Result.content[0] as any).text)?.items || [] : [];

      return ResponseFormatter.formatSuccess({
        files: {
          file1: { id: fileId1, name: file1.name, pages: file1.pages?.length || 0 },
          file2: { id: fileId2, name: file2.name, pages: file2.pages?.length || 0 },
        },
        comparison: {
          colors: {
            file1: tokens1.colors?.length || 0,
            file2: tokens2.colors?.length || 0,
            difference: (tokens1.colors?.length || 0) - (tokens2.colors?.length || 0),
          },
          typography: {
            file1: tokens1.typography?.length || 0,
            file2: tokens2.typography?.length || 0,
            difference: (tokens1.typography?.length || 0) - (tokens2.typography?.length || 0),
          },
          components: {
            file1: components1.length,
            file2: components2.length,
            difference: components1.length - components2.length,
          },
        },
      }, 'File comparison complete');
    } catch (error) {
      logger.error('File comparison failed', error);
      return ResponseFormatter.formatError(`Comparison failed: ${error}`);
    }
  }

  private getColorCategory(color: string): string {
    if (!color.startsWith('#') || color.length !== 7) return 'other';
    
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    if (max === min) return 'gray';
    if (max - min < 0.1) return 'gray';
    
    let h = 0;
    const d = max - min;
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
    
    const hue = Math.round(h * 360);
    
    if (hue < 30) return 'red';
    if (hue < 60) return 'orange';
    if (hue < 90) return 'yellow';
    if (hue < 150) return 'green';
    if (hue < 210) return 'cyan';
    if (hue < 270) return 'blue';
    if (hue < 330) return 'purple';
    return 'red';
  }
}
