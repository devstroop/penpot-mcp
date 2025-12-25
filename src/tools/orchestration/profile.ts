import { ClientFactory } from '../../api/client-factory.js';
import { MCPResponse, ResponseFormatter } from '../../api/base/index.js';
import { ProfileParams } from './types.js';
import { logger } from '../../logger.js';

/**
 * Profile Tool - User profile and settings management
 */
export class ProfileTool {
  private clientFactory: ClientFactory;

  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }

  async execute(params: ProfileParams): Promise<MCPResponse> {
    const { action } = params;
    const client = this.clientFactory.createClient();

    logger.debug('ProfileTool executing', { action });

    switch (action) {
      case 'get':
        return client.profile.getProfile();

      case 'update':
        return client.profile.updateProfile({
          fullname: params.fullname,
          lang: params.lang,
          theme: params.theme,
        });

      case 'password':
        if (!params.oldPassword || !params.newPassword) {
          return ResponseFormatter.formatError('oldPassword and newPassword are required for password action');
        }
        return client.profile.changePassword(params.oldPassword, params.newPassword);

      case 'props':
        return client.profile.getProfileProps();

      case 'update_props':
        if (!params.props) {
          return ResponseFormatter.formatError('props object is required for update_props action');
        }
        return client.profile.updateProfileProps(params.props);

      case 'email':
        if (!params.newEmail) {
          return ResponseFormatter.formatError('newEmail is required for email action');
        }
        return client.profile.requestEmailChange(params.newEmail);

      case 'delete':
        return client.profile.deleteAccount();

      case 'recent':
        return client.profile.getRecentFiles();

      case 'notifications':
        return client.profile.getNotifications();

      case 'mark_read':
        if (!params.notificationId) {
          return ResponseFormatter.formatError('notificationId is required for mark_read action');
        }
        return client.profile.markNotificationRead(params.notificationId);

      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}`);
    }
  }
}
