import { Notification } from '../types';
import { API_CONFIG } from '../constants';
import apiClient from './apiClient';

/**
 * Notification Service
 * Handles notification-related API operations
 */
class NotificationService {
  private mapNotification(data: any): Notification {
    return {
      id: String(data.id || ''),
      title: data.title || '',
      message: data.message || '',
      type: data.type || 'info',
      isRead: Boolean(data.is_read),
      expiresAt: data.expires_at || null,
      createdAt: data.created_at || new Date().toISOString(),
    };
  }

  /**
   * Get all user notifications
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return [];
      }

      const response = await apiClient.get<any>('/notifications/');
      const results = response.results || (Array.isArray(response) ? response : []);
      return results.map((n: any) => this.mapNotification(n));
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) return;
      await apiClient.patch(`/notifications/${notificationId}/read/`, {});
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) return;
      await apiClient.patch('/notifications/read_all/', {});
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
}

export default new NotificationService();
