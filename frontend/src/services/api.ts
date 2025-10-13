// API service for Fixfly backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Debug API URL in production
console.log('🔗 API_BASE_URL:', API_BASE_URL);
console.log('🔗 Environment:', import.meta.env.MODE);
console.log('🔗 VITE_API_URL:', import.meta.env.VITE_API_URL);

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  profileImage?: string;
  address?: any;
  preferences?: any;
  stats?: any;
}

interface AuthResponse {
  user: User;
  token: string;
  message?: string;
  isNewUser?: boolean;
  redirectTo?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    };

    // Add authorization header if token exists
    // Check if this is an admin route and use appropriate token
    const isAdminRoute = endpoint.startsWith('/admin');
    const token = localStorage.getItem(isAdminRoute ? 'adminToken' : 'accessToken');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'omit', // Changed from 'include' to 'omit' for mobile webview compatibility
    };

    try {
      console.log('Making API request to:', url);
      console.log('Request config:', config);
      
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('API request failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        url: url,
        config: config
      });
      
      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        console.error('🌐 Network Error Details:', {
          url: url,
          baseURL: this.baseURL,
          environment: import.meta.env.MODE,
          userAgent: navigator.userAgent
        });
        throw new Error('Network error: Unable to connect to server. Please check your internet connection and try again.');
      }
      
      // Handle HTTP errors
      if (error.response) {
        const { status, data } = error.response;
        if (status === 500) {
          // Server errors - extract meaningful message
          if (data.message) {
            throw new Error(data.message);
          } else if (data.error) {
            throw new Error(data.error);
          } else {
            throw new Error('Server error occurred. Please try again later.');
          }
        } else if (status === 400) {
          // Bad request - validation errors
          if (data.errors && Array.isArray(data.errors)) {
            throw new Error(data.errors.join('. '));
          } else if (data.message) {
            throw new Error(data.message);
          } else {
            throw new Error('Invalid request. Please check your input.');
          }
        } else if (status >= 400 && status < 500) {
          // Client errors
          throw new Error(data.message || `Error ${status}: ${error.message}`);
        } else {
          // Other server errors
          throw new Error(data.message || `Server error (${status}). Please try again later.`);
        }
      }
      
      throw error;
    }
  }

  // Health check method
  async healthCheck(): Promise<ApiResponse> {
    // Health check endpoint is at root level, not under /api
    const url = `${this.baseURL.replace('/api', '')}/health`;
    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('Health check failed:', error);
      throw new Error(error.message || 'Health check failed');
    }
  }

  // SMS test method
  async testSMS(): Promise<ApiResponse> {
    const url = `${this.baseURL.replace('/api', '')}/test-sms`;
    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('SMS test failed:', error);
      throw new Error(error.message || 'SMS test failed');
    }
  }

  // Auth API methods
  async sendOTP(phone: string): Promise<ApiResponse<{ phone: string; messageId: string; otp?: string }>> {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOTP(phone: string, otp: string, name?: string, email?: string): Promise<ApiResponse<AuthResponse>> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, email }),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    phone: string;
    address?: any;
  }): Promise<ApiResponse<{ user: User; messageId: string; otp?: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(phone: string, otp: string): Promise<ApiResponse<AuthResponse>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/me', {
      method: 'GET',
    });
  }

  async updateProfile(profileData: any): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // User API methods
  async getUserProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/users/profile', {
      method: 'GET',
    });
  }

  async updateUserProfile(profileData: any): Promise<ApiResponse<{ user: User }>> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async uploadProfileImage(formData: FormData): Promise<ApiResponse<{ profileImage: string; imageUrl: string }>> {
    const token = localStorage.getItem('accessToken');
    const url = `${this.baseURL}/users/profile/image`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async deleteProfileImage(): Promise<ApiResponse> {
    return this.request('/users/profile/image', {
      method: 'DELETE',
    });
  }

  async getUserStats(): Promise<ApiResponse<{ stats: any }>> {
    return this.request('/users/stats', {
      method: 'GET',
    });
  }

  async updateUserPreferences(preferences: any): Promise<ApiResponse<{ preferences: any }>> {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async deactivateAccount(): Promise<ApiResponse> {
    return this.request('/users/deactivate', {
      method: 'PUT',
    });
  }

  async reactivateAccount(): Promise<ApiResponse> {
    return this.request('/users/reactivate', {
      method: 'PUT',
    });
  }

  async changePhoneNumber(newPhone: string, otp?: string): Promise<ApiResponse<{ phone?: string; otp?: string }>> {
    return this.request('/users/change-phone', {
      method: 'POST',
      body: JSON.stringify({ newPhone, otp }),
    });
  }

  async getUserActivity(page: number = 1, limit: number = 10): Promise<ApiResponse<{ activity: any[]; pagination: any }>> {
    return this.request(`/users/activity?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  async exportUserData(): Promise<ApiResponse<any>> {
    return this.request('/users/export', {
      method: 'GET',
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export type { ApiResponse, User, AuthResponse };
