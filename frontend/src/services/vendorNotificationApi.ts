// Vendor Notification API service for Fixfly backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface VendorNotification {
  _id: string;
  vendorId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  readAt?: string;
  priority: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  image?: {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  };
}

interface NotificationResponse {
  notifications: VendorNotification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalNotifications: number;
    unreadCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class VendorNotificationApi {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('vendorToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get vendor notifications
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<NotificationResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly.toString());

      const url = `${API_BASE_URL}/vendors/notifications?${queryParams}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Check if vendor is blocked
          if (data.message && data.message.includes('blocked by admin')) {
            // Clear invalid token and data
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorData');
            // Show blocked message and redirect to login
            alert('You are blocked by admin. Please contact support for assistance.');
            window.location.href = '/vendor/login';
          } else {
            // Clear invalid token
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorData');
            // Redirect to login page
            window.location.href = '/vendor/login';
          }
        }
        throw new Error(data.message || 'Failed to fetch notifications');
      }

      return data;
    } catch (error: any) {
      console.error('Get vendor notifications error:', error);
      throw new Error(error.message || 'Failed to fetch notifications');
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Check if vendor is blocked
          if (data.message && data.message.includes('blocked by admin')) {
            // Clear invalid token and data
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorData');
            // Show blocked message and redirect to login
            alert('You are blocked by admin. Please contact support for assistance.');
            window.location.href = '/vendor/login';
          } else {
            // Clear invalid token
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorData');
            // Redirect to login page
            window.location.href = '/vendor/login';
          }
        }
        throw new Error(data.message || 'Failed to mark notification as read');
      }

      return data;
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      throw new Error(error.message || 'Failed to mark notification as read');
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/notifications/read-all`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Check if vendor is blocked
          if (data.message && data.message.includes('blocked by admin')) {
            // Clear invalid token and data
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorData');
            // Show blocked message and redirect to login
            alert('You are blocked by admin. Please contact support for assistance.');
            window.location.href = '/vendor/login';
          } else {
            // Clear invalid token
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorData');
            // Redirect to login page
            window.location.href = '/vendor/login';
          }
        }
        throw new Error(data.message || 'Failed to mark all notifications as read');
      }

      return data;
    } catch (error: any) {
      console.error('Mark all notifications as read error:', error);
      throw new Error(error.message || 'Failed to mark all notifications as read');
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/notifications?unreadOnly=true&limit=1`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Check if vendor is blocked
          if (data.message && data.message.includes('blocked by admin')) {
            // Clear invalid token and data
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorData');
            // Show blocked message and redirect to login
            alert('You are blocked by admin. Please contact support for assistance.');
            window.location.href = '/vendor/login';
          } else {
            // Clear invalid token
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorData');
            // Redirect to login page
            window.location.href = '/vendor/login';
          }
        }
        throw new Error(data.message || 'Failed to fetch unread count');
      }

      return {
        success: true,
        message: 'Unread count retrieved successfully',
        data: {
          unreadCount: data.data?.pagination?.unreadCount || 0
        }
      };
    } catch (error: any) {
      console.error('Get unread count error:', error);
      throw new Error(error.message || 'Failed to fetch unread count');
    }
  }
}

export default new VendorNotificationApi();
export type { VendorNotification, NotificationResponse };
