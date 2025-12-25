export interface MCPResponse {
  content: Array<
    | {
        type: 'text';
        text: string;
      }
    | {
        type: 'image';
        data: string;
        mimeType: string;
      }
  >;
  isError?: boolean;
}

export class ResponseFormatter {
  /**
   * Format successful response
   */
  static formatSuccess(
    data: unknown,
    message?: string,
    metadata?: Record<string, unknown>
  ): MCPResponse {
    const response: Record<string, unknown> = {
      success: true,
      data,
    };

    if (message) {
      response['message'] = message;
    }

    if (metadata) {
      response['metadata'] = metadata;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Format error response
   */
  static formatError(message: string, details?: unknown): MCPResponse {
    const response: Record<string, unknown> = {
      success: false,
      error: message,
    };

    if (details !== undefined) {
      response['details'] = details;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
      isError: true,
    };
  }

  /**
   * Format list response with pagination and context info
   */
  static formatList(
    items: unknown[],
    itemType: string,
    metadata?: Record<string, unknown>
  ): MCPResponse {
    const response: Record<string, unknown> = {
      success: true,
      data: {
        [itemType]: items,
        count: items.length,
      },
    };

    if (metadata) {
      // Separate pagination fields from context fields
      const paginationFields = ['total', 'page', 'pageSize'];
      const pagination: Record<string, unknown> = {};
      const context: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(metadata)) {
        if (paginationFields.includes(key)) {
          pagination[key] = value;
        } else {
          context[key] = value;
        }
      }

      if (Object.keys(pagination).length > 0) {
        response['pagination'] = pagination;
      }
      if (Object.keys(context).length > 0) {
        response['context'] = context;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Format image response with optional metadata
   * Returns an actual image that can be displayed in chat
   */
  static formatImage(
    base64Data: string,
    mimeType: string,
    metadata?: Record<string, unknown>
  ): MCPResponse {
    const content: MCPResponse['content'] = [
      {
        type: 'image',
        data: base64Data,
        mimeType: mimeType,
      },
    ];

    // Add metadata as text if provided
    if (metadata) {
      content.push({
        type: 'text',
        text: JSON.stringify({ success: true, metadata }, null, 2),
      });
    }

    return { content };
  }

  /**
   * Format multiple images response
   * Returns multiple images that can be displayed in chat
   */
  static formatMultipleImages(
    images: Array<{ base64Data: string; mimeType: string; label?: string }>,
    metadata?: Record<string, unknown>
  ): MCPResponse {
    const content: MCPResponse['content'] = [];

    for (const img of images) {
      content.push({
        type: 'image',
        data: img.base64Data,
        mimeType: img.mimeType,
      });
    }

    // Add metadata as text at the end
    if (metadata) {
      content.push({
        type: 'text',
        text: JSON.stringify({ success: true, metadata }, null, 2),
      });
    }

    return { content };
  }
}
