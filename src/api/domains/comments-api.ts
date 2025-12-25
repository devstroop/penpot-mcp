import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export interface Comment {
  id: string;
  threadId: string;
  content: string;
  owner?: {
    id: string;
    name?: string;
    email?: string;
  };
  createdAt?: string;
  modifiedAt?: string;
}

export interface CommentThread {
  id: string;
  fileId: string;
  pageId: string;
  position?: { x: number; y: number };
  frameId?: string;
  resolved?: boolean;
  seqn?: number;
  participants?: string[];
  comments?: Comment[];
}

/**
 * Comments API Client - Full comment management capabilities
 * Handles all comment-related operations for Penpot
 */
export class CommentsAPIClient extends BaseAPIClient {
  
  /**
   * Get all comment threads for a file
   */
  async getFileComments(fileId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:file-id': `~u${fileId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/get-comment-threads',
        payload,
        true
      );
      
      const threads = this.normalizeTransitResponse(response) || [];
      
      return ResponseFormatter.formatList(threads as unknown[], 'comment_thread', {
        fileId,
      });
    } catch (error) {
      logger.error('Failed to get file comments', error);
      return ErrorHandler.handle(error, 'getFileComments');
    }
  }

  /**
   * Get comments for a specific thread
   */
  async getThreadComments(threadId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:thread-id': `~u${threadId}`,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/get-comments',
        payload,
        true
      );
      
      const comments = this.normalizeTransitResponse(response) || [];
      
      return ResponseFormatter.formatList(comments as unknown[], 'comment', {
        threadId,
      });
    } catch (error) {
      logger.error('Failed to get thread comments', error);
      return ErrorHandler.handle(error, 'getThreadComments');
    }
  }

  /**
   * Create a new comment thread
   */
  async createThread(
    fileId: string,
    pageId: string,
    content: string,
    position?: { x: number; y: number },
    frameId?: string
  ): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:file-id': `~u${fileId}`,
        '~:page-id': `~u${pageId}`,
        '~:content': content,
      };
      
      if (position) {
        payload['~:position'] = {
          '~:x': position.x,
          '~:y': position.y,
        };
      }
      
      if (frameId) {
        payload['~:frame-id'] = `~u${frameId}`;
      }
      
      const response = await this.post<unknown>(
        '/rpc/command/create-comment-thread',
        payload,
        true
      );
      
      const thread = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(thread, 'Comment thread created');
    } catch (error) {
      logger.error('Failed to create comment thread', error);
      return ErrorHandler.handle(error, 'createThread');
    }
  }

  /**
   * Add comment to existing thread
   */
  async addComment(threadId: string, content: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:thread-id': `~u${threadId}`,
        '~:content': content,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/add-comment',
        payload,
        true
      );
      
      const comment = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(comment, 'Comment added');
    } catch (error) {
      logger.error('Failed to add comment', error);
      return ErrorHandler.handle(error, 'addComment');
    }
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${commentId}`,
        '~:content': content,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/update-comment',
        payload,
        true
      );
      
      const comment = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(comment, 'Comment updated');
    } catch (error) {
      logger.error('Failed to update comment', error);
      return ErrorHandler.handle(error, 'updateComment');
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${commentId}`,
      };
      
      await this.post<unknown>(
        '/rpc/command/delete-comment',
        payload,
        true
      );
      
      return ResponseFormatter.formatSuccess({ deleted: true, commentId }, 'Comment deleted');
    } catch (error) {
      logger.error('Failed to delete comment', error);
      return ErrorHandler.handle(error, 'deleteComment');
    }
  }

  /**
   * Delete a comment thread
   */
  async deleteThread(threadId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${threadId}`,
      };
      
      await this.post<unknown>(
        '/rpc/command/delete-comment-thread',
        payload,
        true
      );
      
      return ResponseFormatter.formatSuccess({ deleted: true, threadId }, 'Thread deleted');
    } catch (error) {
      logger.error('Failed to delete thread', error);
      return ErrorHandler.handle(error, 'deleteThread');
    }
  }

  /**
   * Resolve a comment thread
   */
  async resolveThread(threadId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${threadId}`,
        '~:is-resolved': true,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/update-comment-thread-status',
        payload,
        true
      );
      
      const thread = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(thread, 'Thread resolved');
    } catch (error) {
      logger.error('Failed to resolve thread', error);
      return ErrorHandler.handle(error, 'resolveThread');
    }
  }

  /**
   * Reopen a comment thread
   */
  async reopenThread(threadId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${threadId}`,
        '~:is-resolved': false,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/update-comment-thread-status',
        payload,
        true
      );
      
      const thread = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(thread, 'Thread reopened');
    } catch (error) {
      logger.error('Failed to reopen thread', error);
      return ErrorHandler.handle(error, 'reopenThread');
    }
  }

  /**
   * Get unread comments count
   */
  async getUnreadCount(fileId: string): Promise<MCPResponse> {
    try {
      const result = await this.getFileComments(fileId);
      
      if (result.isError) {
        return result;
      }
      
      const threads = JSON.parse((result.content[0] as any).text)?.items || [];
      
      // Count unresolved threads
      const unresolvedCount = threads.filter((t: CommentThread) => !t.resolved).length;
      
      return ResponseFormatter.formatSuccess({
        fileId,
        totalThreads: threads.length,
        unresolvedThreads: unresolvedCount,
        resolvedThreads: threads.length - unresolvedCount,
      }, `${unresolvedCount} unresolved comment threads`);
    } catch (error) {
      logger.error('Failed to get unread count', error);
      return ErrorHandler.handle(error, 'getUnreadCount');
    }
  }
}
