import apiService from './api';

export interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'vendors' | 'specific';
  targetUsers?: string[];
  targetVendors?: string[];
  scheduledAt?: string;
  isScheduled: boolean;
  status: 'draft' | 'sent' | 'scheduled' | 'failed';
  sentAt?: string;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  sentBy: {
    _id: string;
    name: string;
    email: string;
  };
  image?: {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  };
  data?: any;
  createdAt: string;
  updatedAt: string;
  timeAgo: string;
  deliveryRate: number;
  readRate: number;
}

export interface SendNotificationRequest {
  title: string;
  message: string;
  targetAudience: 'all' | 'vendors' | 'specific';
  targetUsers?: string[];
  targetVendors?: string[];
  scheduledAt?: string;
  isScheduled?: boolean;
  image?: {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  };
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  data: {
    notification: AdminNotification;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
  };
}

export interface NotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  scheduledNotifications: number;
  draftNotifications: number;
  failedNotifications: number;
  totalRecipients: number;
  averageDeliveryRate: number;
  averageReadRate: number;
}

export interface NotificationStatsResponse {
  success: boolean;
  data: NotificationStats;
}

class AdminNotificationApi {
  // Send push notification
  async sendNotification(data: SendNotificationRequest): Promise<SendNotificationResponse> {
    return await apiService.request('/admin/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Get all notifications
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    status?: string;
    targetAudience?: string;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
  }): Promise<{ success: boolean; data: { notifications: AdminNotification[]; pagination: any } }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/admin/notifications${queryString ? `?${queryString}` : ''}`;
    return await apiService.request(endpoint, { method: 'GET' });
  }

  // Get single notification
  async getNotificationById(id: string): Promise<{ success: boolean; data: { notification: AdminNotification } }> {
    return await apiService.request(`/admin/notifications/${id}`, { method: 'GET' });
  }

  // Update notification
  async updateNotification(id: string, data: Partial<SendNotificationRequest>): Promise<{ success: boolean; data: { notification: AdminNotification } }> {
    return await apiService.request(`/admin/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Delete notification
  async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    return await apiService.request(`/admin/notifications/${id}`, { method: 'DELETE' });
  }

  // Get notification statistics
  async getNotificationStats(): Promise<NotificationStatsResponse> {
    return await apiService.request('/admin/notifications/stats', { method: 'GET' });
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(id: string): Promise<{ success: boolean; message: string }> {
    return await apiService.request(`/admin/notifications/${id}/cancel`, { method: 'PUT' });
  }

  // Resend failed notification
  async resendNotification(id: string): Promise<SendNotificationResponse> {
    return await apiService.request(`/admin/notifications/${id}/resend`, { method: 'POST' });
  }
}

const adminNotificationApi = new AdminNotificationApi();
export default adminNotificationApi;
