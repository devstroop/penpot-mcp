import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { AnalyzeParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Unicode ranges for emoji detection
 */
const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu;

/**
 * Common emoji to text replacements
 */
const EMOJI_REPLACEMENTS: Record<string, string> = {
  '👤': 'User',
  '📍': 'Location',
  '🏠': 'Home',
  '💼': 'Work',
  '🔒': 'Lock',
  '🛺': 'Auto',
  '🏍️': 'Moto',
  '⭐': 'Star',
  '❤️': 'Heart',
  '✓': 'Check',
  '✔': 'Check',
  '✔️': 'Check',
  '❌': 'X',
  '➡️': 'Arrow',
  '⬅️': 'Arrow',
  '⬆️': 'Arrow',
  '⬇️': 'Arrow',
  '📱': 'Phone',
  '📧': 'Email',
  '📞': 'Call',
  '💳': 'Card',
  '💰': 'Money',
  '🚗': 'Car',
  '🚕': 'Taxi',
  '🚘': 'Car',
  '🏁': 'Flag',
  '📦': 'Package',
  '🔔': 'Bell',
  '🔍': 'Search',
  '⚙️': 'Settings',
  '👍': 'Like',
  '👎': 'Dislike',
  '🎉': 'Party',
  '✨': 'Sparkle',
};

interface OverlapIssue {
  id: string;
  type: 'overlap';
  severity: 'error' | 'warning';
  objects: Array<{
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  overlapPercentage: number;
  suggestion: string;
}

interface EmojiIssue {
  id: string;
  type: 'emoji';
  severity: 'warning';
  objectId: string;
  objectName: string;
  pageId: string;
  pageName: string;
  frameId?: string;
  frameName?: string;
  originalText: string;
  emojisFound: string[];
  suggestedText: string;
}

interface TextOverlapIssue {
  id: string;
  type: 'text_overlap';
  severity: 'error' | 'warning';
  objects: Array<{
    id: string;
    name: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  overlapArea: { x: number; y: number; width: number; height: number };
  suggestion: string;
}

interface TruncationIssue {
  id: string;
  type: 'truncation';
  severity: 'error' | 'warning';
  objectId: string;
  objectName: string;
  text: string;
  bounds: { width: number; height: number };
  textBounds: { width: number; height: number };
  overflowX: number;
  overflowY: number;
  suggestion: string;
}

interface SpacingIssue {
  id: string;
  type: 'spacing';
  severity: 'warning';
  objects: Array<{ id: string; name: string; position: { x: number; y: number } }>;
  actualSpacing: number;
  expectedSpacing?: number;
  direction: 'horizontal' | 'vertical';
  suggestion: string;
}

interface RedundancyIssue {
  id: string;
  type: 'redundancy';
  severity: 'warning';
  objects: Array<{ id: string; name: string; text: string }>;
  similarity: number;
  suggestion: string;
}

interface HierarchyIssue {
  id: string;
  type: 'hierarchy';
  severity: 'warning';
  objectId: string;
  objectName: string;
  issue: 'competing_prominence' | 'size_inconsistency' | 'position_conflict';
  detail: string;
  suggestion: string;
}

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

      // NEW: Design quality analysis actions
      case 'overlaps':
        return this.detectOverlaps(fileId, params.pageId, params.frameId, params.options);

      case 'text_overlaps':
        return this.detectTextOverlaps(fileId, params.pageId, params.frameId, params.options);

      case 'emojis':
        return this.detectEmojis(fileId, params.pageId, params.frameId, params.options);

      case 'truncation':
        return this.detectTruncation(fileId, params.pageId, params.frameId, params.options);

      case 'spacing':
        return this.analyzeSpacing(fileId, params.pageId, params.frameId, params.options);

      case 'redundancy':
        return this.detectRedundancy(fileId, params.pageId, params.frameId, params.options);

      case 'hierarchy':
        return this.analyzeHierarchy(fileId, params.pageId, params.frameId, params.options);

      case 'quality':
        return this.runQualityCheck(fileId, params.pageId, params.frameId, params.options);

      case 'fix_overlaps':
        return this.fixOverlaps(
          fileId,
          params.pageId,
          params.frameId,
          params.options,
          params.issueIds
        );

      case 'fix_emojis':
        return this.fixEmojis(
          fileId,
          params.pageId,
          params.frameId,
          params.options,
          params.issueIds
        );

      case 'fix_all':
        return this.fixAll(fileId, params.pageId, params.frameId, params.options);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }

  /**
   * Detect overlapping elements on a page or within a frame
   */
  private async detectOverlaps(
    fileId: string,
    pageId?: string,
    frameId?: string,
    options?: any
  ): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();
    const positionTolerance = options?.positionTolerance ?? 5;
    const overlapThreshold = options?.overlapThreshold ?? 50;

    try {
      const issues: OverlapIssue[] = [];

      // Get file pages
      const pagesResult = await client.files.getFilePages(fileId);
      if (pagesResult.isError) return pagesResult;

      const pages = JSON.parse((pagesResult.content[0] as any).text)?.items || [];
      const targetPages = pageId ? pages.filter((p: any) => p.id === pageId) : pages;

      for (const page of targetPages) {
        const objectsResult = await client.files.getPageObjects(fileId, page.id);
        if (objectsResult.isError) continue;

        const allObjects = JSON.parse((objectsResult.content[0] as any).text)?.items || [];

        // If frameId specified, filter to objects within that frame
        let objects = allObjects;
        if (frameId) {
          objects = allObjects.filter(
            (obj: any) => obj.parentId === frameId || obj.frameId === frameId || obj.id === frameId
          );
        }

        // Filter to visible, positioned objects (text, rect, ellipse, image, etc.)
        const positionedObjects = objects.filter(
          (obj: any) =>
            obj.type !== 'frame' &&
            !obj.hidden &&
            typeof obj.x === 'number' &&
            typeof obj.y === 'number'
        );

        // Group objects by their parent frame for better analysis
        const objectsByFrame: Record<string, any[]> = {};
        for (const obj of positionedObjects) {
          const parentFrame = obj.frameId || obj.parentId || 'root';
          if (!objectsByFrame[parentFrame]) objectsByFrame[parentFrame] = [];
          objectsByFrame[parentFrame].push(obj);
        }

        // Check for overlaps within each frame
        for (const frameObjects of Object.values(objectsByFrame)) {
          for (let i = 0; i < frameObjects.length; i++) {
            for (let j = i + 1; j < frameObjects.length; j++) {
              const obj1 = frameObjects[i];
              const obj2 = frameObjects[j];

              // Check if objects are at nearly the same position
              const xDiff = Math.abs(obj1.x - obj2.x);
              const yDiff = Math.abs(obj1.y - obj2.y);

              if (xDiff <= positionTolerance && yDiff <= positionTolerance) {
                // Objects at same position - likely duplicates
                const issueId = `overlap-${obj1.id}-${obj2.id}`;
                issues.push({
                  id: issueId,
                  type: 'overlap',
                  severity: 'error',
                  objects: [
                    {
                      id: obj1.id,
                      name: obj1.name,
                      type: obj1.type,
                      x: obj1.x,
                      y: obj1.y,
                      width: obj1.width || 0,
                      height: obj1.height || 0,
                    },
                    {
                      id: obj2.id,
                      name: obj2.name,
                      type: obj2.type,
                      x: obj2.x,
                      y: obj2.y,
                      width: obj2.width || 0,
                      height: obj2.height || 0,
                    },
                  ],
                  overlapPercentage: 100,
                  suggestion: `Objects "${obj1.name}" and "${obj2.name}" are at the same position (${Math.round(obj1.x)}, ${Math.round(obj1.y)}). Consider hiding or removing one.`,
                });
                continue;
              }

              // Check for bounding box overlap
              const overlap = this.calculateOverlap(obj1, obj2);
              if (overlap >= overlapThreshold) {
                const issueId = `overlap-${obj1.id}-${obj2.id}`;
                issues.push({
                  id: issueId,
                  type: 'overlap',
                  severity: overlap >= 80 ? 'error' : 'warning',
                  objects: [
                    {
                      id: obj1.id,
                      name: obj1.name,
                      type: obj1.type,
                      x: obj1.x,
                      y: obj1.y,
                      width: obj1.width || 0,
                      height: obj1.height || 0,
                    },
                    {
                      id: obj2.id,
                      name: obj2.name,
                      type: obj2.type,
                      x: obj2.x,
                      y: obj2.y,
                      width: obj2.width || 0,
                      height: obj2.height || 0,
                    },
                  ],
                  overlapPercentage: Math.round(overlap),
                  suggestion: `Objects "${obj1.name}" and "${obj2.name}" overlap by ${Math.round(overlap)}%. Consider adjusting positions.`,
                });
              }
            }
          }
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          pageId,
          frameId,
          issues,
          summary: {
            total: issues.length,
            errors: issues.filter((i) => i.severity === 'error').length,
            warnings: issues.filter((i) => i.severity === 'warning').length,
            duplicatePositions: issues.filter((i) => i.overlapPercentage === 100).length,
          },
          criteria: { positionTolerance, overlapThreshold },
        },
        `Found ${issues.length} overlapping elements`
      );
    } catch (error) {
      logger.error('Overlap detection failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  /**
   * Calculate overlap percentage between two objects
   */
  private calculateOverlap(obj1: any, obj2: any): number {
    const x1 = obj1.x;
    const y1 = obj1.y;
    const w1 = obj1.width || 0;
    const h1 = obj1.height || 0;

    const x2 = obj2.x;
    const y2 = obj2.y;
    const w2 = obj2.width || 0;
    const h2 = obj2.height || 0;

    // Calculate intersection
    const xOverlap = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
    const yOverlap = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));
    const overlapArea = xOverlap * yOverlap;

    // Calculate percentage relative to smaller object
    const area1 = w1 * h1;
    const area2 = w2 * h2;
    const smallerArea = Math.min(area1, area2);

    if (smallerArea === 0) return 0;
    return (overlapArea / smallerArea) * 100;
  }

  /**
   * Detect emoji characters in text elements
   */
  private async detectEmojis(
    fileId: string,
    pageId?: string,
    frameId?: string,
    options?: any
  ): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();
    const includeReplacements = options?.replaceEmojis ?? true;

    try {
      const issues: EmojiIssue[] = [];

      // Get file pages
      const pagesResult = await client.files.getFilePages(fileId);
      if (pagesResult.isError) return pagesResult;

      const pages = JSON.parse((pagesResult.content[0] as any).text)?.items || [];
      const targetPages = pageId ? pages.filter((p: any) => p.id === pageId) : pages;

      for (const page of targetPages) {
        const objectsResult = await client.files.getPageObjects(fileId, page.id);
        if (objectsResult.isError) continue;

        const allObjects = JSON.parse((objectsResult.content[0] as any).text)?.items || [];

        // Filter to text objects, optionally within a specific frame
        let textObjects = allObjects.filter((obj: any) => obj.type === 'text');
        if (frameId) {
          textObjects = textObjects.filter(
            (obj: any) => obj.parentId === frameId || obj.frameId === frameId
          );
        }

        for (const obj of textObjects) {
          // Get text content from various possible locations
          const textContent = this.extractTextContent(obj);
          if (!textContent) continue;

          // Find emojis in text
          const emojisFound = textContent.match(EMOJI_REGEX);
          if (emojisFound && emojisFound.length > 0) {
            // Get unique emojis
            const uniqueEmojis = [...new Set(emojisFound)];

            // Generate suggested replacement text
            let suggestedText = textContent;
            if (includeReplacements) {
              for (const emoji of uniqueEmojis) {
                const replacement = EMOJI_REPLACEMENTS[emoji] || '';
                suggestedText = suggestedText
                  .replace(
                    new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                    replacement
                  )
                  .trim();
              }
              // Clean up extra spaces
              suggestedText = suggestedText.replace(/\s+/g, ' ').trim();
            }

            // Find parent frame info
            const parentFrame = allObjects.find(
              (o: any) => o.id === obj.frameId || o.id === obj.parentId
            );

            issues.push({
              id: `emoji-${obj.id}`,
              type: 'emoji',
              severity: 'warning',
              objectId: obj.id,
              objectName: obj.name,
              pageId: page.id,
              pageName: page.name,
              frameId: parentFrame?.id,
              frameName: parentFrame?.name,
              originalText: textContent,
              emojisFound: uniqueEmojis,
              suggestedText,
            });
          }
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          pageId,
          frameId,
          issues,
          summary: {
            total: issues.length,
            uniqueEmojis: [...new Set(issues.flatMap((i) => i.emojisFound))],
            affectedElements: issues.length,
          },
          knownReplacements: Object.keys(EMOJI_REPLACEMENTS).length,
        },
        `Found ${issues.length} text elements with emojis`
      );
    } catch (error) {
      logger.error('Emoji detection failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  /**
   * Extract text content from a text object
   */
  private extractTextContent(obj: any): string | null {
    // Try various paths where text content might be stored
    if (obj.content && typeof obj.content === 'string') {
      return obj.content;
    }
    if (obj.content?.children) {
      // Penpot text structure with children paragraphs
      const texts: string[] = [];
      for (const paragraph of obj.content.children || []) {
        for (const child of paragraph.children || []) {
          if (child.text) {
            texts.push(child.text);
          }
        }
      }
      return texts.join(' ');
    }
    if (obj.text) {
      return obj.text;
    }
    return null;
  }

  /**
   * Detect overlapping text elements specifically
   */
  private async detectTextOverlaps(
    fileId: string,
    pageId?: string,
    frameId?: string,
    options?: any
  ): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();
    const overlapTolerance = options?.textOverlapTolerance ?? 2;

    try {
      const issues: TextOverlapIssue[] = [];

      const pagesResult = await client.files.getFilePages(fileId);
      if (pagesResult.isError) return pagesResult;

      const pages = JSON.parse((pagesResult.content[0] as any).text)?.items || [];
      const targetPages = pageId ? pages.filter((p: any) => p.id === pageId) : pages;

      for (const page of targetPages) {
        const objectsResult = await client.files.getPageObjects(fileId, page.id);
        if (objectsResult.isError) continue;

        const allObjects = JSON.parse((objectsResult.content[0] as any).text)?.items || [];

        // Filter to text objects only, optionally within a specific frame
        let textObjects = allObjects.filter(
          (obj: any) =>
            obj.type === 'text' &&
            !obj.hidden &&
            typeof obj.x === 'number' &&
            typeof obj.y === 'number'
        );

        if (frameId) {
          textObjects = textObjects.filter(
            (obj: any) => obj.parentId === frameId || obj.frameId === frameId
          );
        }

        // Group by parent frame
        const objectsByFrame: Record<string, any[]> = {};
        for (const obj of textObjects) {
          const parentFrame = obj.frameId || obj.parentId || 'root';
          if (!objectsByFrame[parentFrame]) objectsByFrame[parentFrame] = [];
          objectsByFrame[parentFrame].push(obj);
        }

        // Check for text overlaps within each frame
        for (const [, frameObjects] of Object.entries(objectsByFrame)) {
          for (let i = 0; i < frameObjects.length; i++) {
            for (let j = i + 1; j < frameObjects.length; j++) {
              const obj1 = frameObjects[i];
              const obj2 = frameObjects[j];

              // Calculate overlap area
              const x1 = Math.max(obj1.x, obj2.x);
              const y1 = Math.max(obj1.y, obj2.y);
              const x2 = Math.min(obj1.x + (obj1.width || 0), obj2.x + (obj2.width || 0));
              const y2 = Math.min(obj1.y + (obj1.height || 0), obj2.y + (obj2.height || 0));

              const overlapWidth = x2 - x1;
              const overlapHeight = y2 - y1;

              if (overlapWidth > overlapTolerance && overlapHeight > overlapTolerance) {
                const text1 = this.extractTextContent(obj1) || obj1.name;
                const text2 = this.extractTextContent(obj2) || obj2.name;

                issues.push({
                  id: `text-overlap-${obj1.id}-${obj2.id}`,
                  type: 'text_overlap',
                  severity: overlapHeight > 10 ? 'error' : 'warning',
                  objects: [
                    {
                      id: obj1.id,
                      name: obj1.name,
                      text: text1,
                      x: obj1.x,
                      y: obj1.y,
                      width: obj1.width || 0,
                      height: obj1.height || 0,
                    },
                    {
                      id: obj2.id,
                      name: obj2.name,
                      text: text2,
                      x: obj2.x,
                      y: obj2.y,
                      width: obj2.width || 0,
                      height: obj2.height || 0,
                    },
                  ],
                  overlapArea: { x: x1, y: y1, width: overlapWidth, height: overlapHeight },
                  suggestion: `Text "${text1.slice(0, 30)}..." overlaps with "${text2.slice(0, 30)}...". Adjust vertical positions by at least ${Math.ceil(overlapHeight)}px.`,
                });
              }
            }
          }
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          pageId,
          frameId,
          issues,
          summary: {
            total: issues.length,
            errors: issues.filter((i) => i.severity === 'error').length,
            warnings: issues.filter((i) => i.severity === 'warning').length,
          },
        },
        `Found ${issues.length} text overlap issues`
      );
    } catch (error) {
      logger.error('Text overlap detection failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  /**
   * Detect truncated/clipped text elements
   */
  private async detectTruncation(
    fileId: string,
    pageId?: string,
    frameId?: string,
    _options?: any
  ): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();

    try {
      const issues: TruncationIssue[] = [];

      const pagesResult = await client.files.getFilePages(fileId);
      if (pagesResult.isError) return pagesResult;

      const pages = JSON.parse((pagesResult.content[0] as any).text)?.items || [];
      const targetPages = pageId ? pages.filter((p: any) => p.id === pageId) : pages;

      for (const page of targetPages) {
        const objectsResult = await client.files.getPageObjects(fileId, page.id);
        if (objectsResult.isError) continue;

        const allObjects = JSON.parse((objectsResult.content[0] as any).text)?.items || [];

        // Find text objects and their parent containers
        let textObjects = allObjects.filter((obj: any) => obj.type === 'text' && !obj.hidden);

        if (frameId) {
          textObjects = textObjects.filter(
            (obj: any) => obj.parentId === frameId || obj.frameId === frameId
          );
        }

        for (const textObj of textObjects) {
          // Check if text might be clipped by parent container
          const parent = allObjects.find((p: any) => p.id === textObj.parentId);
          if (!parent || parent.type === 'frame') continue; // Top-level frames don't clip

          const textContent = this.extractTextContent(textObj) || '';

          // Estimate text width based on character count and font size
          const fontSize = textObj.fontSize || 14;
          const avgCharWidth = fontSize * 0.6; // Approximate
          const estimatedTextWidth = textContent.length * avgCharWidth;

          const containerWidth = parent.width || Infinity;
          const textWidth = textObj.width || estimatedTextWidth;

          // Check for potential overflow
          if (textWidth > containerWidth || estimatedTextWidth > textWidth) {
            const overflowX = Math.max(0, estimatedTextWidth - (textObj.width || containerWidth));

            if (overflowX > 5) {
              // Significant overflow
              issues.push({
                id: `truncation-${textObj.id}`,
                type: 'truncation',
                severity: overflowX > 20 ? 'error' : 'warning',
                objectId: textObj.id,
                objectName: textObj.name,
                text: textContent,
                bounds: { width: textObj.width || 0, height: textObj.height || 0 },
                textBounds: { width: estimatedTextWidth, height: fontSize * 1.2 },
                overflowX,
                overflowY: 0,
                suggestion: `Text "${textContent.slice(0, 20)}..." may be truncated. Expand width by ~${Math.ceil(overflowX)}px or use smaller font.`,
              });
            }
          }

          // Check if text is in a small circular/rounded container (like avatar)
          if (
            parent.type === 'circle' ||
            parent.type === 'ellipse' ||
            (parent.r1 && parent.r1 > 20)
          ) {
            const containerDiameter = Math.min(parent.width || 100, parent.height || 100);
            if (estimatedTextWidth > containerDiameter * 0.7) {
              issues.push({
                id: `truncation-circle-${textObj.id}`,
                type: 'truncation',
                severity: 'warning',
                objectId: textObj.id,
                objectName: textObj.name,
                text: textContent,
                bounds: { width: containerDiameter, height: containerDiameter },
                textBounds: { width: estimatedTextWidth, height: fontSize * 1.2 },
                overflowX: estimatedTextWidth - containerDiameter * 0.7,
                overflowY: 0,
                suggestion: `Text "${textContent}" may be clipped in circular container. Use shorter text or icon.`,
              });
            }
          }
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          pageId,
          frameId,
          issues,
          summary: {
            total: issues.length,
            errors: issues.filter((i) => i.severity === 'error').length,
            warnings: issues.filter((i) => i.severity === 'warning').length,
          },
        },
        `Found ${issues.length} potential truncation issues`
      );
    } catch (error) {
      logger.error('Truncation detection failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  /**
   * Analyze spacing consistency between elements
   */
  private async analyzeSpacing(
    fileId: string,
    pageId?: string,
    frameId?: string,
    options?: any
  ): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();
    const spacingTolerance = options?.spacingTolerance ?? 4;
    const expectedSpacing = options?.expectedSpacing;

    try {
      const issues: SpacingIssue[] = [];
      const spacingData: number[] = [];

      const pagesResult = await client.files.getFilePages(fileId);
      if (pagesResult.isError) return pagesResult;

      const pages = JSON.parse((pagesResult.content[0] as any).text)?.items || [];
      const targetPages = pageId ? pages.filter((p: any) => p.id === pageId) : pages;

      for (const page of targetPages) {
        const objectsResult = await client.files.getPageObjects(fileId, page.id);
        if (objectsResult.isError) continue;

        const allObjects = JSON.parse((objectsResult.content[0] as any).text)?.items || [];

        // Filter visible, positioned objects
        let objects = allObjects.filter(
          (obj: any) =>
            !obj.hidden &&
            typeof obj.x === 'number' &&
            typeof obj.y === 'number' &&
            (obj.type === 'text' || obj.type === 'rect' || obj.type === 'frame')
        );

        if (frameId) {
          objects = objects.filter(
            (obj: any) => obj.parentId === frameId || obj.frameId === frameId
          );
        }

        // Group by parent and analyze vertical spacing
        const objectsByFrame: Record<string, any[]> = {};
        for (const obj of objects) {
          const parentFrame = obj.frameId || obj.parentId || 'root';
          if (!objectsByFrame[parentFrame]) objectsByFrame[parentFrame] = [];
          objectsByFrame[parentFrame].push(obj);
        }

        for (const [, frameObjects] of Object.entries(objectsByFrame)) {
          // Sort by Y position
          const sorted = [...frameObjects].sort((a, b) => a.y - b.y);

          for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            // Calculate vertical gap
            const currentBottom = current.y + (current.height || 0);
            const gap = next.y - currentBottom;

            if (gap > 0 && gap < 100) {
              // Reasonable gap range
              spacingData.push(gap);

              // Check against expected spacing
              if (expectedSpacing !== undefined) {
                const diff = Math.abs(gap - expectedSpacing);
                if (diff > spacingTolerance) {
                  issues.push({
                    id: `spacing-${current.id}-${next.id}`,
                    type: 'spacing',
                    severity: 'warning',
                    objects: [
                      {
                        id: current.id,
                        name: current.name,
                        position: { x: current.x, y: current.y },
                      },
                      { id: next.id, name: next.name, position: { x: next.x, y: next.y } },
                    ],
                    actualSpacing: Math.round(gap),
                    expectedSpacing,
                    direction: 'vertical',
                    suggestion: `Spacing between "${current.name}" and "${next.name}" is ${Math.round(gap)}px (expected ${expectedSpacing}px). Adjust by ${Math.round(diff)}px.`,
                  });
                }
              }
            }
          }
        }
      }

      // Calculate spacing statistics
      const avgSpacing =
        spacingData.length > 0 ? spacingData.reduce((a, b) => a + b, 0) / spacingData.length : 0;
      const uniqueSpacings = [...new Set(spacingData.map((s) => Math.round(s / 4) * 4))];

      // Flag inconsistent spacing if no expected value provided
      if (!expectedSpacing && uniqueSpacings.length > 3) {
        issues.push({
          id: 'spacing-inconsistent',
          type: 'spacing',
          severity: 'warning',
          objects: [],
          actualSpacing: avgSpacing,
          direction: 'vertical',
          suggestion: `Found ${uniqueSpacings.length} different spacing values. Consider standardizing to 8px grid (${uniqueSpacings.slice(0, 5).join(', ')}px detected).`,
        });
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          pageId,
          frameId,
          issues,
          statistics: {
            averageSpacing: Math.round(avgSpacing),
            uniqueSpacings: uniqueSpacings.slice(0, 10),
            totalMeasurements: spacingData.length,
          },
          summary: {
            total: issues.length,
            inconsistencies: issues.length,
          },
        },
        `Found ${issues.length} spacing issues`
      );
    } catch (error) {
      logger.error('Spacing analysis failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  /**
   * Detect redundant/duplicate content
   */
  private async detectRedundancy(
    fileId: string,
    pageId?: string,
    frameId?: string,
    options?: any
  ): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();
    const similarityThreshold = options?.similarityThreshold ?? 80;

    try {
      const issues: RedundancyIssue[] = [];

      const pagesResult = await client.files.getFilePages(fileId);
      if (pagesResult.isError) return pagesResult;

      const pages = JSON.parse((pagesResult.content[0] as any).text)?.items || [];
      const targetPages = pageId ? pages.filter((p: any) => p.id === pageId) : pages;

      for (const page of targetPages) {
        const objectsResult = await client.files.getPageObjects(fileId, page.id);
        if (objectsResult.isError) continue;

        const allObjects = JSON.parse((objectsResult.content[0] as any).text)?.items || [];

        // Get text objects
        let textObjects = allObjects.filter((obj: any) => obj.type === 'text' && !obj.hidden);

        if (frameId) {
          textObjects = textObjects.filter(
            (obj: any) => obj.parentId === frameId || obj.frameId === frameId
          );
        }

        // Extract text content
        const textItems = textObjects
          .map((obj: any) => ({
            id: obj.id,
            name: obj.name,
            text: this.extractTextContent(obj) || '',
          }))
          .filter((t: { id: string; name: string; text: string }) => t.text.length > 3); // Only meaningful text

        // Compare for similarity
        for (let i = 0; i < textItems.length; i++) {
          for (let j = i + 1; j < textItems.length; j++) {
            const similarity = this.calculateTextSimilarity(textItems[i].text, textItems[j].text);

            if (similarity >= similarityThreshold) {
              issues.push({
                id: `redundancy-${textItems[i].id}-${textItems[j].id}`,
                type: 'redundancy',
                severity: 'warning',
                objects: [textItems[i], textItems[j]],
                similarity: Math.round(similarity),
                suggestion: `"${textItems[i].text.slice(0, 30)}..." and "${textItems[j].text.slice(0, 30)}..." are ${Math.round(similarity)}% similar. Consider removing duplicate.`,
              });
            }
          }
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          pageId,
          frameId,
          issues,
          summary: {
            total: issues.length,
            potentialDuplicates: issues.length,
          },
        },
        `Found ${issues.length} potential redundancy issues`
      );
    } catch (error) {
      logger.error('Redundancy detection failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  /**
   * Calculate text similarity using Levenshtein-like approach
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const s1 = text1.toLowerCase().trim();
    const s2 = text2.toLowerCase().trim();

    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const shorter = s1.length < s2.length ? s1 : s2;
      const longer = s1.length < s2.length ? s2 : s1;
      return (shorter.length / longer.length) * 100;
    }

    // Word-based similarity
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    const intersection = [...words1].filter((w) => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return (intersection / union) * 100;
  }

  /**
   * Analyze visual hierarchy issues
   */
  private async analyzeHierarchy(
    fileId: string,
    pageId?: string,
    frameId?: string,
    _options?: any
  ): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();

    try {
      const issues: HierarchyIssue[] = [];

      const pagesResult = await client.files.getFilePages(fileId);
      if (pagesResult.isError) return pagesResult;

      const pages = JSON.parse((pagesResult.content[0] as any).text)?.items || [];
      const targetPages = pageId ? pages.filter((p: any) => p.id === pageId) : pages;

      for (const page of targetPages) {
        const objectsResult = await client.files.getPageObjects(fileId, page.id);
        if (objectsResult.isError) continue;

        const allObjects = JSON.parse((objectsResult.content[0] as any).text)?.items || [];

        // Get text objects with font sizes
        let textObjects = allObjects.filter(
          (obj: any) => obj.type === 'text' && !obj.hidden && typeof obj.y === 'number'
        );

        if (frameId) {
          textObjects = textObjects.filter(
            (obj: any) => obj.parentId === frameId || obj.frameId === frameId
          );
        }

        // Group by parent frame and check hierarchy
        const objectsByFrame: Record<string, any[]> = {};
        for (const obj of textObjects) {
          const parentFrame = obj.frameId || obj.parentId || 'root';
          if (!objectsByFrame[parentFrame]) objectsByFrame[parentFrame] = [];
          objectsByFrame[parentFrame].push(obj);
        }

        for (const [, frameObjects] of Object.entries(objectsByFrame)) {
          // Sort by Y position (top to bottom)
          const sorted = [...frameObjects].sort((a, b) => a.y - b.y);

          // Check for hierarchy violations
          for (let i = 0; i < sorted.length - 1; i++) {
            const upper = sorted[i];
            const lower = sorted[i + 1];

            const upperSize = upper.fontSize || 14;
            const lowerSize = lower.fontSize || 14;

            // Title should be bigger than body text below it
            // Check if lower element is larger (potential hierarchy issue)
            if (lowerSize > upperSize + 2 && Math.abs(upper.y - lower.y) < 50) {
              issues.push({
                id: `hierarchy-${upper.id}`,
                type: 'hierarchy',
                severity: 'warning',
                objectId: upper.id,
                objectName: upper.name,
                issue: 'size_inconsistency',
                detail: `"${upper.name}" (${upperSize}px) appears above "${lower.name}" (${lowerSize}px) but is smaller`,
                suggestion: `Consider making the upper text larger or repositioning elements for better visual hierarchy.`,
              });
            }

            // Check for competing prominence (similar large sizes near each other)
            if (
              upperSize >= 18 &&
              lowerSize >= 18 &&
              Math.abs(upperSize - lowerSize) <= 2 &&
              Math.abs(upper.y - lower.y) < 40
            ) {
              issues.push({
                id: `hierarchy-competing-${upper.id}-${lower.id}`,
                type: 'hierarchy',
                severity: 'warning',
                objectId: upper.id,
                objectName: upper.name,
                issue: 'competing_prominence',
                detail: `"${upper.name}" and "${lower.name}" have similar prominence (${upperSize}px and ${lowerSize}px)`,
                suggestion: `Differentiate sizes to establish clear hierarchy. Make primary element larger.`,
              });
            }
          }
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          pageId,
          frameId,
          issues,
          summary: {
            total: issues.length,
            byIssueType: issues.reduce(
              (acc, i) => {
                acc[i.issue] = (acc[i.issue] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            ),
          },
        },
        `Found ${issues.length} hierarchy issues`
      );
    } catch (error) {
      logger.error('Hierarchy analysis failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  /**
   * Run comprehensive quality check
   */
  private async runQualityCheck(
    fileId: string,
    pageId?: string,
    frameId?: string,
    options?: any
  ): Promise<MCPResponse> {
    try {
      // Run all quality checks in parallel
      const [
        overlapsResult,
        textOverlapsResult,
        emojisResult,
        truncationResult,
        spacingResult,
        redundancyResult,
        hierarchyResult,
        accessibilityResult,
      ] = await Promise.all([
        this.detectOverlaps(fileId, pageId, frameId, options),
        this.detectTextOverlaps(fileId, pageId, frameId, options),
        this.detectEmojis(fileId, pageId, frameId, options),
        this.detectTruncation(fileId, pageId, frameId, options),
        this.analyzeSpacing(fileId, pageId, frameId, options),
        this.detectRedundancy(fileId, pageId, frameId, options),
        this.analyzeHierarchy(fileId, pageId, frameId, options),
        this.analyzeAccessibility(fileId, pageId, options),
      ]);

      const parseResult = (result: MCPResponse) => {
        if (result.isError) return { issues: [], summary: {} };
        return JSON.parse((result.content[0] as any).text);
      };

      const overlaps = parseResult(overlapsResult);
      const textOverlaps = parseResult(textOverlapsResult);
      const emojis = parseResult(emojisResult);
      const truncation = parseResult(truncationResult);
      const spacing = parseResult(spacingResult);
      const redundancy = parseResult(redundancyResult);
      const hierarchy = parseResult(hierarchyResult);
      const accessibility = parseResult(accessibilityResult);

      const categories = {
        overlaps: { issues: overlaps.issues || [], count: overlaps.issues?.length || 0 },
        textOverlaps: {
          issues: textOverlaps.issues || [],
          count: textOverlaps.issues?.length || 0,
        },
        emojis: { issues: emojis.issues || [], count: emojis.issues?.length || 0 },
        truncation: { issues: truncation.issues || [], count: truncation.issues?.length || 0 },
        spacing: { issues: spacing.issues || [], count: spacing.issues?.length || 0 },
        redundancy: { issues: redundancy.issues || [], count: redundancy.issues?.length || 0 },
        hierarchy: { issues: hierarchy.issues || [], count: hierarchy.issues?.length || 0 },
        accessibility: {
          issues: accessibility.issues || [],
          count: accessibility.issues?.length || 0,
        },
      };

      const totalIssues = Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);
      const errorCount = Object.values(categories).reduce(
        (sum, cat) => sum + cat.issues.filter((i: any) => i.severity === 'error').length,
        0
      );
      const warningCount = totalIssues - errorCount;

      // Calculate quality score (max 100, deduct points per issue)
      const qualityScore = Math.max(0, 100 - errorCount * 10 - warningCount * 3);

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          pageId,
          frameId,
          qualityScore,
          grade: this.getQualityGrade(qualityScore),
          categories,
          summary: {
            totalIssues,
            errors: errorCount,
            warnings: warningCount,
            byCategory: Object.entries(categories).reduce(
              (acc, [key, val]) => {
                acc[key] = val.count;
                return acc;
              },
              {} as Record<string, number>
            ),
          },
          recommendations: this.generateQualityRecommendations(
            overlaps,
            textOverlaps,
            emojis,
            truncation,
            spacing,
            redundancy,
            hierarchy,
            accessibility
          ),
          spacingStatistics: spacing.statistics,
        },
        `Quality score: ${qualityScore}/100 (${this.getQualityGrade(qualityScore)}) with ${totalIssues} issues found`
      );
    } catch (error) {
      logger.error('Quality check failed', error);
      return ResponseFormatter.formatError(`Quality check failed: ${error}`);
    }
  }

  /**
   * Get quality grade from score
   */
  private getQualityGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate recommendations based on quality issues
   */
  private generateQualityRecommendations(
    overlaps: any,
    textOverlaps: any,
    emojis: any,
    truncation: any,
    spacing: any,
    redundancy: any,
    hierarchy: any,
    accessibility: any
  ): string[] {
    const recommendations: string[] = [];

    // Overlap recommendations
    if ((overlaps.issues?.length || 0) > 0) {
      const duplicates = overlaps.issues.filter((i: any) => i.overlapPercentage === 100).length;
      if (duplicates > 0) {
        recommendations.push(
          `🔄 Found ${duplicates} duplicate elements at same positions. Use 'fix_overlaps' to remove automatically.`
        );
      }
    }

    // Text overlap recommendations
    if ((textOverlaps.issues?.length || 0) > 0) {
      recommendations.push(
        `📝 ${textOverlaps.issues.length} text elements are overlapping. Adjust vertical spacing between text layers.`
      );
    }

    // Emoji recommendations
    if ((emojis.issues?.length || 0) > 0) {
      recommendations.push(
        `😀 ${emojis.issues.length} text elements contain emojis. Use 'fix_emojis' to remove for cleaner design.`
      );
    }

    // Truncation recommendations
    if ((truncation.issues?.length || 0) > 0) {
      recommendations.push(
        `✂️ ${truncation.issues.length} text elements may be truncated. Expand containers or reduce text.`
      );
    }

    // Spacing recommendations
    if (
      (spacing.issues?.length || 0) > 0 ||
      (spacing.statistics?.uniqueSpacings?.length || 0) > 3
    ) {
      const spacings = spacing.statistics?.uniqueSpacings?.slice(0, 4).join(', ') || '';
      recommendations.push(
        `📏 Inconsistent spacing detected (${spacings}px). Standardize to 8px grid.`
      );
    }

    // Redundancy recommendations
    if ((redundancy.issues?.length || 0) > 0) {
      recommendations.push(
        `🔁 ${redundancy.issues.length} potential duplicate content found. Review and remove redundant text.`
      );
    }

    // Hierarchy recommendations
    if ((hierarchy.issues?.length || 0) > 0) {
      recommendations.push(
        `📊 ${hierarchy.issues.length} visual hierarchy issues. Ensure headings are larger than body text.`
      );
    }

    // Accessibility recommendations
    if ((accessibility.issues?.length || 0) > 0) {
      recommendations.push(
        `♿ ${accessibility.issues.length} accessibility issues. Check text sizes and alt text.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✨ Design looks clean! No major issues detected.');
    }

    return recommendations;
  }

  /**
   * Fix overlapping elements
   */
  private async fixOverlaps(
    fileId: string,
    pageId?: string,
    frameId?: string,
    options?: any,
    issueIds?: string[]
  ): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();
    const fixStrategy = options?.fixStrategy || 'hide';

    try {
      // First detect overlaps
      const detectResult = await this.detectOverlaps(fileId, pageId, frameId, options);
      if (detectResult.isError) return detectResult;

      const detected = JSON.parse((detectResult.content[0] as any).text);
      let issuesToFix = detected.issues || [];

      // Filter to specific issues if specified
      if (issueIds && issueIds.length > 0) {
        issuesToFix = issuesToFix.filter((i: OverlapIssue) => issueIds.includes(i.id));
      }

      if (issuesToFix.length === 0) {
        return ResponseFormatter.formatSuccess(
          {
            fileId,
            fixed: 0,
            message: 'No overlap issues to fix',
          },
          'No overlap issues found to fix'
        );
      }

      // Get page ID if not provided
      let targetPageId = pageId;
      if (!targetPageId) {
        const pagesResult = await client.files.getFilePages(fileId);
        if (!pagesResult.isError) {
          const pages = JSON.parse((pagesResult.content[0] as any).text)?.items || [];
          targetPageId = pages[0]?.id;
        }
      }

      if (!targetPageId) {
        return ResponseFormatter.formatError('Could not determine page ID for fixing overlaps');
      }

      const fixed: string[] = [];
      const errors: string[] = [];

      // For each overlap, hide the second object (keep the first)
      for (const issue of issuesToFix) {
        if (issue.objects.length < 2) continue;

        const objectToHide = issue.objects[1]; // Hide the second one

        try {
          if (fixStrategy === 'hide') {
            // Use fileChanges.modifyObject to hide
            const result = await client.fileChanges.modifyObject(
              fileId,
              targetPageId,
              objectToHide.id,
              [{ attr: 'hidden', val: true }]
            );

            if (!result.isError) {
              fixed.push(objectToHide.id);
            } else {
              errors.push(
                `Failed to hide ${objectToHide.name}: ${(result.content[0] as any).text}`
              );
            }
          } else if (fixStrategy === 'delete') {
            const result = await client.fileChanges.deleteObject(
              fileId,
              targetPageId,
              objectToHide.id
            );
            if (!result.isError) {
              fixed.push(objectToHide.id);
            } else {
              errors.push(`Failed to delete ${objectToHide.name}`);
            }
          }
        } catch (err) {
          errors.push(`Error fixing ${objectToHide.name}: ${err}`);
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          strategy: fixStrategy,
          fixed: fixed.length,
          fixedIds: fixed,
          errors: errors.length > 0 ? errors : undefined,
          remaining: issuesToFix.length - fixed.length,
        },
        `Fixed ${fixed.length} overlapping elements using '${fixStrategy}' strategy`
      );
    } catch (error) {
      logger.error('Fix overlaps failed', error);
      return ResponseFormatter.formatError(`Fix failed: ${error}`);
    }
  }

  /**
   * Fix emoji characters in text elements
   */
  private async fixEmojis(
    fileId: string,
    pageId?: string,
    frameId?: string,
    options?: any,
    issueIds?: string[]
  ): Promise<MCPResponse> {
    const client = this.clientFactory.createClient();

    try {
      // First detect emojis
      const detectResult = await this.detectEmojis(fileId, pageId, frameId, {
        ...options,
        replaceEmojis: true,
      });
      if (detectResult.isError) return detectResult;

      const detected = JSON.parse((detectResult.content[0] as any).text);
      let issuesToFix = detected.issues || [];

      // Filter to specific issues if specified
      if (issueIds && issueIds.length > 0) {
        issuesToFix = issuesToFix.filter((i: EmojiIssue) => issueIds.includes(i.id));
      }

      if (issuesToFix.length === 0) {
        return ResponseFormatter.formatSuccess(
          {
            fileId,
            fixed: 0,
            message: 'No emoji issues to fix',
          },
          'No emoji issues found to fix'
        );
      }

      const fixed: Array<{ id: string; before: string; after: string }> = [];
      const errors: string[] = [];

      for (const issue of issuesToFix) {
        try {
          // Get all objects on the page to find the specific text object
          const objectsResult = await client.files.getPageObjects(fileId, issue.pageId);
          if (objectsResult.isError) {
            errors.push(`Could not get objects for page ${issue.pageId}`);
            continue;
          }

          const allObjects = JSON.parse((objectsResult.content[0] as any).text)?.items || [];
          const obj = allObjects.find((o: any) => o.id === issue.objectId);

          if (!obj) {
            errors.push(`Could not find object ${issue.objectName}`);
            continue;
          }

          // Build new content with emojis removed
          if (obj.content?.children) {
            // Deep clone and modify the content structure
            const newContent = JSON.parse(JSON.stringify(obj.content));
            let modified = false;

            for (const paragraph of newContent.children || []) {
              for (const child of paragraph.children || []) {
                if (child.text && EMOJI_REGEX.test(child.text)) {
                  const original = child.text;
                  // Replace each emoji with its replacement or empty string
                  let newText = child.text;
                  for (const [emoji, replacement] of Object.entries(EMOJI_REPLACEMENTS)) {
                    newText = newText.split(emoji).join(replacement);
                  }
                  // Remove any remaining emojis
                  newText = newText.replace(EMOJI_REGEX, '');
                  // Clean up spaces
                  newText = newText.replace(/\s+/g, ' ').trim();

                  if (newText !== original) {
                    child.text = newText;
                    modified = true;
                  }
                }
              }
            }

            if (modified) {
              const result = await client.fileChanges.modifyObject(
                fileId,
                issue.pageId,
                issue.objectId,
                [{ attr: 'content', val: newContent }]
              );

              if (!result.isError) {
                fixed.push({
                  id: issue.objectId,
                  before: issue.originalText,
                  after: issue.suggestedText,
                });
              } else {
                errors.push(`Failed to update ${issue.objectName}`);
              }
            }
          }
        } catch (err) {
          errors.push(`Error fixing ${issue.objectName}: ${err}`);
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          fixed: fixed.length,
          changes: fixed,
          errors: errors.length > 0 ? errors : undefined,
          remaining: issuesToFix.length - fixed.length,
        },
        `Fixed ${fixed.length} text elements with emojis`
      );
    } catch (error) {
      logger.error('Fix emojis failed', error);
      return ResponseFormatter.formatError(`Fix failed: ${error}`);
    }
  }

  /**
   * Fix all detected issues
   */
  private async fixAll(
    fileId: string,
    pageId?: string,
    frameId?: string,
    options?: any
  ): Promise<MCPResponse> {
    try {
      const [overlapsResult, emojisResult] = await Promise.all([
        this.fixOverlaps(fileId, pageId, frameId, options),
        this.fixEmojis(fileId, pageId, frameId, options),
      ]);

      const overlaps = !overlapsResult.isError
        ? JSON.parse((overlapsResult.content[0] as any).text)
        : { fixed: 0 };

      const emojis = !emojisResult.isError
        ? JSON.parse((emojisResult.content[0] as any).text)
        : { fixed: 0 };

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          summary: {
            overlapsFixed: overlaps.fixed || 0,
            emojisFixed: emojis.fixed || 0,
            totalFixed: (overlaps.fixed || 0) + (emojis.fixed || 0),
          },
          details: {
            overlaps,
            emojis,
          },
        },
        `Fixed ${(overlaps.fixed || 0) + (emojis.fixed || 0)} total issues`
      );
    } catch (error) {
      logger.error('Fix all failed', error);
      return ResponseFormatter.formatError(`Fix all failed: ${error}`);
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

      const file = !fileResult.isError ? JSON.parse((fileResult.content[0] as any).text) : {};

      // Analyze color palette
      const colorAnalysis = this.analyzeColors(tokens.colors || []);

      // Analyze typography scale
      const typographyAnalysis = this.analyzeTypography(tokens.typography || []);

      return ResponseFormatter.formatSuccess(
        {
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
        },
        'Design system analysis complete'
      );
    } catch (error) {
      logger.error('Design system analysis failed', error);
      return ResponseFormatter.formatError(`Analysis failed: ${error}`);
    }
  }

  private analyzeColors(colors: any[]): Record<string, any> {
    const hues: Record<string, number> = {};
    const hasOpacity = colors.filter((c) => c.opacity && c.opacity < 1).length;

    for (const color of colors) {
      const hue = this.getColorCategory(color.color || color.value || '');
      hues[hue] = (hues[hue] || 0) + 1;
    }

    return {
      byHue: hues,
      withOpacity: hasOpacity,
      hasGradients: colors.filter((c) => c.gradient).length,
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

  private async analyzeAccessibility(
    fileId: string,
    pageId?: string,
    options?: any
  ): Promise<MCPResponse> {
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

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          issues,
          summary: {
            total: issues.length,
            errors: issues.filter((i) => i.severity === 'error').length,
            warnings: issues.filter((i) => i.severity === 'warning').length,
            byType: issues.reduce(
              (acc, i) => {
                acc[i.type] = (acc[i.type] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            ),
          },
          criteria: { minContrast, minFontSize },
        },
        `Found ${issues.length} accessibility issues`
      );
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
          const isDefault = defaultNamePatterns.some((p) => p.test(name));
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

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          stats,
          issues: issues.slice(0, 50), // Limit issues
          namingScore:
            stats.totalObjects > 0 ? Math.round((stats.wellNamed / stats.totalObjects) * 100) : 100,
          recommendations: [
            stats.defaultNames > 10
              ? 'Many objects have default names - consider renaming for clarity'
              : null,
            Object.keys(stats.patterns).length < 3
              ? 'Consider using consistent naming prefixes'
              : null,
          ].filter(Boolean),
        },
        `Naming analysis: ${stats.wellNamed}/${stats.totalObjects} well-named`
      );
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
      stats.instanceCounts.sort(
        (a: { instances: number }, b: { instances: number }) => b.instances - a.instances
      );

      const mostUsed = stats.instanceCounts.slice(0, 5);
      const unused = stats.instanceCounts.filter((c: any) => c.instances === 0);

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          stats,
          mostUsed,
          unused,
          coverage: stats.total > 0 ? Math.round((stats.withAnnotations / stats.total) * 100) : 0,
          recommendations: [
            unused.length > 0
              ? `${unused.length} components have no instances - consider removing`
              : null,
            stats.withAnnotations === 0 && stats.total > 0
              ? 'Add annotations to document component usage'
              : null,
          ].filter(Boolean),
        },
        `Component analysis: ${stats.total} components`
      );
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
              items: items.map((i) => ({ id: i.id, name: i.name })),
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
              items: items.map((i) => ({ id: i.id, name: i.name })),
            });
          }
        }
      }

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          duplicates,
          summary: {
            total: duplicates.length,
            colors: duplicates.filter((d) => d.type === 'color').length,
            typography: duplicates.filter((d) => d.type === 'typography').length,
          },
        },
        `Found ${duplicates.length} potential duplicates`
      );
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

      for (const comp of components.slice(0, 20)) {
        // Limit for performance
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

      return ResponseFormatter.formatSuccess(
        {
          fileId,
          unused,
          summary: {
            unusedComponents: unused.length,
          },
          recommendations:
            unused.length > 0
              ? ['Consider removing unused components to clean up the file']
              : ['No unused components found'],
        },
        `Found ${unused.length} unused items`
      );
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

      const tokens1 = !tokens1Result.isError
        ? JSON.parse((tokens1Result.content[0] as any).text)
        : {};
      const tokens2 = !tokens2Result.isError
        ? JSON.parse((tokens2Result.content[0] as any).text)
        : {};

      const components1 = !components1Result.isError
        ? JSON.parse((components1Result.content[0] as any).text)?.items || []
        : [];
      const components2 = !components2Result.isError
        ? JSON.parse((components2Result.content[0] as any).text)?.items || []
        : [];

      return ResponseFormatter.formatSuccess(
        {
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
        },
        'File comparison complete'
      );
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
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
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
