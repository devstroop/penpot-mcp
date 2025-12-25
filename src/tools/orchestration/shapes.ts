import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { ShapesParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Shapes Tool - Create and manage shapes on Penpot pages
 */
export class ShapesTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: ShapesParams): Promise<MCPResponse> {
    const { action, fileId, pageId } = params;
    const client = this.clientFactory.createClient();

    logger.debug('ShapesTool executing', { action, params });

    if (!fileId) {
      return ResponseFormatter.formatError('fileId is required');
    }

    switch (action) {
      case 'add_frame':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for add_frame action');
        }
        return client.fileChanges.addFrame(fileId, pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          width: params.width ?? 1920,
          height: params.height ?? 1080,
          name: params.name,
          fill: params.fill,
          frameId: params.frameId,
          // Border radius
          borderRadius: params.borderRadius,
          r1: params.r1,
          r2: params.r2,
          r3: params.r3,
          r4: params.r4,
          // Stroke
          stroke: params.stroke,
          strokeWidth: params.strokeWidth,
          strokeOpacity: params.strokeOpacity,
          strokeStyle: params.strokeStyle,
          strokeAlignment: params.strokeAlignment,
          // Shadow
          shadow: params.shadow,
          // Gradient (ISSUE-021)
          gradient: params.gradient,
          // Auto-layout (ISSUE-013)
          layout: params.layout,
          layoutFlexDir: params.layoutFlexDir,
          layoutGap: params.layoutGap,
          layoutPadding: params.layoutPadding,
          layoutJustifyContent: params.layoutJustifyContent,
          layoutAlignItems: params.layoutAlignItems,
          layoutWrap: params.layoutWrap,
        });

      case 'add_rectangle':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for add_rectangle action');
        }
        return client.fileChanges.addRectangle(fileId, pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          width: params.width ?? 100,
          height: params.height ?? 100,
          name: params.name,
          fill: params.fill,
          fillOpacity: params.fillOpacity,
          frameId: params.frameId,
          // Border radius
          borderRadius: params.borderRadius,
          r1: params.r1,
          r2: params.r2,
          r3: params.r3,
          r4: params.r4,
          // Stroke
          stroke: params.stroke,
          strokeWidth: params.strokeWidth,
          strokeOpacity: params.strokeOpacity,
          strokeStyle: params.strokeStyle,
          strokeAlignment: params.strokeAlignment,
          // Shadow
          shadow: params.shadow,
          // Gradient (ISSUE-021)
          gradient: params.gradient,
          // Constraints (ISSUE-013)
          constraintsH: params.constraintsH,
          constraintsV: params.constraintsV,
        });

      case 'add_ellipse':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for add_ellipse action');
        }
        return client.fileChanges.addEllipse(fileId, pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          width: params.width ?? 100,
          height: params.height ?? 100,
          name: params.name,
          fill: params.fill,
          fillOpacity: params.fillOpacity,
          frameId: params.frameId,
          // Stroke
          stroke: params.stroke,
          strokeWidth: params.strokeWidth,
          strokeOpacity: params.strokeOpacity,
          strokeStyle: params.strokeStyle,
          strokeAlignment: params.strokeAlignment,
          // Shadow
          shadow: params.shadow,
          // Gradient (ISSUE-021)
          gradient: params.gradient,
          // Constraints (ISSUE-013)
          constraintsH: params.constraintsH,
          constraintsV: params.constraintsV,
        });

      case 'add_text':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for add_text action');
        }
        if (!params.content) {
          return ResponseFormatter.formatError('content is required for add_text action');
        }
        return client.fileChanges.addText(fileId, pageId, {
          x: params.x ?? 0,
          y: params.y ?? 0,
          content: params.content,
          name: params.name,
          fontSize: params.fontSize,
          fontFamily: params.fontFamily,
          fontWeight: params.fontWeight,
          fill: params.fill,
          width: params.width,
          height: params.height,
          frameId: params.frameId,
          // Text styling
          textAlign: params.textAlign,
          verticalAlign: params.verticalAlign,
          lineHeight: params.lineHeight,
          letterSpacing: params.letterSpacing,
          textDecoration: params.textDecoration,
          textTransform: params.textTransform,
        });

      case 'delete':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for delete action');
        }
        if (!params.shapeId) {
          return ResponseFormatter.formatError('shapeId is required for delete action');
        }
        return client.fileChanges.deleteObject(fileId, pageId, params.shapeId);

      case 'list':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for list action');
        }
        return client.files.getPageObjects(fileId, pageId);

      // ==================== ISSUE-009: Layer Ordering ====================
      case 'bring_to_front':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for bring_to_front action');
        }
        if (!params.objectIds || params.objectIds.length === 0) {
          return ResponseFormatter.formatError('objectIds is required for bring_to_front action');
        }
        if (!params.parentId) {
          return ResponseFormatter.formatError('parentId is required for bring_to_front action');
        }
        return client.fileChanges.bringToFront(fileId, pageId, params.objectIds, params.parentId);

      case 'send_to_back':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for send_to_back action');
        }
        if (!params.objectIds || params.objectIds.length === 0) {
          return ResponseFormatter.formatError('objectIds is required for send_to_back action');
        }
        if (!params.parentId) {
          return ResponseFormatter.formatError('parentId is required for send_to_back action');
        }
        return client.fileChanges.sendToBack(fileId, pageId, params.objectIds, params.parentId);

      case 'move_to_index':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for move_to_index action');
        }
        if (!params.objectIds || params.objectIds.length === 0) {
          return ResponseFormatter.formatError('objectIds is required for move_to_index action');
        }
        if (!params.parentId) {
          return ResponseFormatter.formatError('parentId is required for move_to_index action');
        }
        if (params.index === undefined) {
          return ResponseFormatter.formatError('index is required for move_to_index action');
        }
        return client.fileChanges.moveObjects(
          fileId,
          pageId,
          params.objectIds,
          params.parentId,
          params.index
        );

      // ==================== ISSUE-010: Grouping ====================
      case 'group':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for group action');
        }
        if (!params.objectIds || params.objectIds.length < 2) {
          return ResponseFormatter.formatError(
            'At least 2 objectIds are required for group action'
          );
        }
        return client.fileChanges.groupObjects(fileId, pageId, params.objectIds, {
          name: params.name,
          frameId: params.frameId,
        });

      case 'ungroup':
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for ungroup action');
        }
        if (!params.shapeId) {
          return ResponseFormatter.formatError('shapeId (groupId) is required for ungroup action');
        }
        if (!params.childIds || params.childIds.length === 0) {
          return ResponseFormatter.formatError('childIds is required for ungroup action');
        }
        return client.fileChanges.ungroupObjects(
          fileId,
          pageId,
          params.shapeId,
          params.childIds,
          params.parentId
        );

      // ==================== ISSUE-011: Duplicate ====================
      case 'duplicate': {
        if (!pageId) {
          return ResponseFormatter.formatError('pageId is required for duplicate action');
        }
        if (!params.shapeId) {
          return ResponseFormatter.formatError('shapeId is required for duplicate action');
        }
        // First, get the source object data
        const objectResponse = await client.files.getObject(fileId, pageId, params.shapeId);
        if (objectResponse.isError) {
          return ResponseFormatter.formatError(
            `Failed to get source object: ${objectResponse.content[0]?.type === 'text' ? objectResponse.content[0].text : 'Unknown error'}`
          );
        }

        // Extract the object data from the response
        const responseData = objectResponse.content[0];
        if (!responseData || responseData.type !== 'text') {
          return ResponseFormatter.formatError('Invalid response from getObject');
        }

        let sourceObject: Record<string, unknown>;
        try {
          const parsed = JSON.parse(responseData.text);
          sourceObject = parsed.data || parsed;
        } catch {
          return ResponseFormatter.formatError('Failed to parse source object data');
        }

        return client.fileChanges.duplicateObject(fileId, pageId, sourceObject, {
          offsetX: params.offsetX,
          offsetY: params.offsetY,
          name: params.name,
        });
      }

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
