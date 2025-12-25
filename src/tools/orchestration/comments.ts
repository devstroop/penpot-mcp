import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { CommentsParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Comments Tool - Comment and review management
 */
export class CommentsTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: CommentsParams): Promise<MCPResponse> {
    const { action, fileId } = params;
    const client = this.clientFactory.createClient();

    logger.debug('CommentsTool executing', { action, fileId });

    switch (action) {
      case 'list':
        return client.comments.getFileComments(fileId);

      case 'thread':
        if (!params.threadId) {
          return ResponseFormatter.formatError('threadId is required for thread action');
        }
        return client.comments.getThreadComments(params.threadId);

      case 'create_thread':
        if (!params.pageId || !params.content) {
          return ResponseFormatter.formatError('pageId and content are required for create_thread action');
        }
        return client.comments.createThread(
          fileId,
          params.pageId,
          params.content,
          params.position,
          params.frameId
        );

      case 'add':
        if (!params.threadId || !params.content) {
          return ResponseFormatter.formatError('threadId and content are required for add action');
        }
        return client.comments.addComment(params.threadId, params.content);

      case 'update':
        if (!params.commentId || !params.content) {
          return ResponseFormatter.formatError('commentId and content are required for update action');
        }
        return client.comments.updateComment(params.commentId, params.content);

      case 'delete':
        if (!params.commentId) {
          return ResponseFormatter.formatError('commentId is required for delete action');
        }
        return client.comments.deleteComment(params.commentId);

      case 'delete_thread':
        if (!params.threadId) {
          return ResponseFormatter.formatError('threadId is required for delete_thread action');
        }
        return client.comments.deleteThread(params.threadId);

      case 'resolve':
        if (!params.threadId) {
          return ResponseFormatter.formatError('threadId is required for resolve action');
        }
        return client.comments.resolveThread(params.threadId);

      case 'reopen':
        if (!params.threadId) {
          return ResponseFormatter.formatError('threadId is required for reopen action');
        }
        return client.comments.reopenThread(params.threadId);

      case 'unread':
        return client.comments.getUnreadCount(fileId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
