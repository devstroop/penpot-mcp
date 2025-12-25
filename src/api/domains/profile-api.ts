import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';
import { logger } from '../../logger.js';

export interface Profile {
  id: string;
  email: string;
  fullname?: string;
  lang?: string;
  theme?: string;
  createdAt?: string;
  modifiedAt?: string;
  isActive?: boolean;
  isDemo?: boolean;
  props?: Record<string, unknown>;
}

/**
 * Profile API Client - User profile management
 * Handles all profile-related operations for Penpot
 */
export class ProfileAPIClient extends BaseAPIClient {
  
  /**
   * Get current user profile
   */
  async getProfile(): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-profile',
        {},
        false
      );
      
      const profile = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(profile, 'Profile retrieved');
    } catch (error) {
      logger.error('Failed to get profile', error);
      return ErrorHandler.handle(error, 'getProfile');
    }
  }

  /**
   * Update profile
   */
  async updateProfile(updates: {
    fullname?: string;
    lang?: string;
    theme?: string;
  }): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {};
      
      if (updates.fullname) {
        payload['~:fullname'] = updates.fullname;
      }
      if (updates.lang) {
        payload['~:lang'] = updates.lang;
      }
      if (updates.theme) {
        payload['~:theme'] = updates.theme;
      }
      
      const response = await this.post<unknown>(
        '/rpc/command/update-profile',
        payload,
        true
      );
      
      const profile = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(profile, 'Profile updated');
    } catch (error) {
      logger.error('Failed to update profile', error);
      return ErrorHandler.handle(error, 'updateProfile');
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:old-password': oldPassword,
        '~:password': newPassword,
      };
      
      await this.post<unknown>(
        '/rpc/command/update-profile-password',
        payload,
        true
      );
      
      return ResponseFormatter.formatSuccess({ changed: true }, 'Password changed');
    } catch (error) {
      logger.error('Failed to change password', error);
      return ErrorHandler.handle(error, 'changePassword');
    }
  }

  /**
   * Get profile props/settings
   */
  async getProfileProps(): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-profile',
        {},
        false
      );
      
      const profile = this.normalizeTransitResponse(response) as Profile;
      
      return ResponseFormatter.formatSuccess(profile.props || {}, 'Profile props retrieved');
    } catch (error) {
      logger.error('Failed to get profile props', error);
      return ErrorHandler.handle(error, 'getProfileProps');
    }
  }

  /**
   * Update profile props
   */
  async updateProfileProps(props: Record<string, unknown>): Promise<MCPResponse> {
    try {
      const payload: Record<string, unknown> = {
        '~:props': props,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/update-profile-props',
        payload,
        true
      );
      
      const result = this.normalizeTransitResponse(response);
      
      return ResponseFormatter.formatSuccess(result, 'Profile props updated');
    } catch (error) {
      logger.error('Failed to update profile props', error);
      return ErrorHandler.handle(error, 'updateProfileProps');
    }
  }

  /**
   * Request email change
   */
  async requestEmailChange(newEmail: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:email': newEmail,
      };
      
      await this.post<unknown>(
        '/rpc/command/request-email-change',
        payload,
        true
      );
      
      return ResponseFormatter.formatSuccess(
        { requested: true, newEmail },
        `Email change requested. Check ${newEmail} for confirmation.`
      );
    } catch (error) {
      logger.error('Failed to request email change', error);
      return ErrorHandler.handle(error, 'requestEmailChange');
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(): Promise<MCPResponse> {
    try {
      await this.post<unknown>(
        '/rpc/command/delete-profile',
        {},
        false
      );
      
      return ResponseFormatter.formatSuccess({ deleted: true }, 'Account deleted');
    } catch (error) {
      logger.error('Failed to delete account', error);
      return ErrorHandler.handle(error, 'deleteAccount');
    }
  }

  /**
   * Get recent files
   */
  async getRecentFiles(limit: number = 20): Promise<MCPResponse> {
    try {
      const payload = {
        '~:limit': limit,
      };
      
      const response = await this.post<unknown>(
        '/rpc/command/get-recent-files',
        payload,
        true
      );
      
      const files = this.normalizeTransitResponse(response) || [];
      
      return ResponseFormatter.formatList(files as unknown[], 'recent_file', {
        limit,
      });
    } catch (error) {
      logger.error('Failed to get recent files', error);
      return ErrorHandler.handle(error, 'getRecentFiles');
    }
  }

  /**
   * Get user notifications
   */
  async getNotifications(): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        '/rpc/command/get-notifications',
        {},
        false
      );
      
      const notifications = this.normalizeTransitResponse(response) || [];
      
      return ResponseFormatter.formatList(notifications as unknown[], 'notification', {});
    } catch (error) {
      logger.error('Failed to get notifications', error);
      return ErrorHandler.handle(error, 'getNotifications');
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<MCPResponse> {
    try {
      const payload = {
        '~:id': `~u${notificationId}`,
      };
      
      await this.post<unknown>(
        '/rpc/command/mark-notification-as-read',
        payload,
        true
      );
      
      return ResponseFormatter.formatSuccess({ read: true, notificationId }, 'Notification marked as read');
    } catch (error) {
      logger.error('Failed to mark notification read', error);
      return ErrorHandler.handle(error, 'markNotificationRead');
    }
  }
}
