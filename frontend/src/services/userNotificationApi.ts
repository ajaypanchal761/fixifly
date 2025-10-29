import apiService from './api';

export interface UserNotification {
  _id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'reminder' | 'system' | 'service' | 'promotion' | 'admin_notification' | 'general' | 'booking_update' | 'payment_confirmation' | 'booking_confirmation';
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  data?: any;
  bookingId?: string;
  serviceType?: string;
  timeAgo: string;
  image?: {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  };
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  highPriorityNotifications: number;
  mediumPriorityNotifications: number;
  lowPriorityNotifications: number;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: UserNotification[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalNotifications: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      limit: number;
    };
    unreadCount: number;
  };
}

export interface NotificationStatsResponse {
  success: boolean;
  data: NotificationStats;
}

class UserNotificationApi {
  // Get user notifications
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    priority?: string;
    isRead?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<NotificationResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/user/notifications${queryString ? `?${queryString}` : ''}`;
    return await apiService.request(endpoint, { method: 'GET' });
  }

  // Get single notification
  async getNotificationById(id: string): Promise<{ success: boolean; data: { notification: UserNotification } }> {
    return await apiService.request(`/user/notifications/${id}`, { method: 'GET' });
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<{ success: boolean; message: string; data: { notification: UserNotification } }> {
    return await apiService.request(`/user/notifications/${id}/read`, { method: 'PUT' });
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ success: boolean; message: string; data: { modifiedCount: number } }> {
    return await apiService.request('/user/notifications/read-all', { method: 'PUT' });
  }

  // Delete notification
  async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    return await apiService.request(`/user/notifications/${id}`, { method: 'DELETE' });
  }

  // Update FCM token - DISABLED
  async updateFcmToken(fcmToken: string): Promise<{ success: boolean; message: string; data: { fcmTokenUpdated: boolean } }> {
    // PUSH NOTIFICATIONS DISABLED
    console.log('⚠️ Push notifications are disabled - FCM token update disabled');
    return {
      success: false,
      message: 'Push notifications are disabled',
      data: { fcmTokenUpdated: false }
    };
    // return await apiService.request('/user/notifications/fcm-token', {
    //   method: 'PUT',
    //   body: JSON.stringify({ fcmToken })
    // });
  }

  // Get notification statistics
  async getNotificationStats(): Promise<NotificationStatsResponse> {
    return await apiService.request('/user/notifications/stats', { method: 'GET' });
  }
}

const userNotificationApi = new UserNotificationApi();
export default userNotificationApi;
