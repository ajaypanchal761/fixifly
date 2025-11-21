// API service for Fixfly backend communication
import { normalizeApiUrl } from '../utils/apiUrl';

const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

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
  // Cache for in-flight requests to prevent duplicate calls
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Create a unique key for this request (endpoint + method)
    const requestKey = `${options.method || 'GET'}:${endpoint}`;
    
    // For GET requests, check if there's already an in-flight request
    if (options.method === 'GET' || !options.method) {
      const existingRequest = this.inFlightRequests.get(requestKey);
      if (existingRequest) {
        console.log('⏭️ Reusing in-flight request for:', requestKey);
        return existingRequest;
      }
    }
    
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

    // Create the request promise
    const requestPromise = (async () => {
      try {
        console.log('Making API request to:', url);
        console.log('Request config:', config);
        
        const response = await fetch(url, config);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          const error = new Error(data.message || `HTTP error! status: ${response.status}`);
          // Attach status code to error for better handling
          (error as any).status = response.status;
          (error as any).responseData = data;
          throw error;
        }

        return data;
      } catch (error: any) {
        // Re-throw error so it can be caught by outer catch
        throw error;
      } finally {
        // Remove from in-flight requests after completion (for GET requests)
        if (options.method === 'GET' || !options.method) {
          this.inFlightRequests.delete(requestKey);
        }
      }
    })();

    // Store in-flight request for GET requests
    if (options.method === 'GET' || !options.method) {
      this.inFlightRequests.set(requestKey, requestPromise);
    }

    try {
      return await requestPromise;
    } catch (error: any) {
      // Handle expected errors (like 404 - user not found) more gracefully
      const isExpectedError = error.status === 404 || 
                             error.message?.includes('User not found') ||
                             error.message?.includes('sign up first') ||
                             error.message?.includes('complete your signup');
      
      if (isExpectedError) {
        // Log expected errors as info instead of error
        console.info('ℹ️ Expected API response:', {
          message: error.message,
          status: error.status,
          url: url
        });
      } else {
        // Log unexpected errors as errors
        console.error('API request failed:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          url: url,
          config: config
        });
      }
      
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
    // Remove /api from the end of baseURL to get the server base URL
    const serverBase = this.baseURL.replace(/\/api\/?$/, '');
    const url = `${serverBase}/health`;
    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Read as text since it's not JSON
        const text = await response.text();
        throw new Error(`Expected JSON but received ${contentType || 'unknown type'}. Status: ${response.status}. Response: ${text.substring(0, 200)}`);
      }

      // Parse as JSON
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('Health check failed:', error);
      // If error is already our custom error, re-throw it; otherwise wrap it
      if (error.message && error.message.includes('Expected JSON')) {
        throw error;
      }
      throw new Error(error.message || 'Health check failed');
    }
  }

  // SMS test method
  async testSMS(): Promise<ApiResponse> {
    // SMS test endpoint is at root level, not under /api
    // Remove /api from the end of baseURL to get the server base URL
    const serverBase = this.baseURL.replace(/\/api\/?$/, '');
    const url = `${serverBase}/test-sms`;
    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Read as text since it's not JSON
        const text = await response.text();
        throw new Error(`Expected JSON but received ${contentType || 'unknown type'}. Status: ${response.status}. Response: ${text.substring(0, 200)}`);
      }

      // Parse as JSON
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('SMS test failed:', error);
      // If error is already our custom error, re-throw it; otherwise wrap it
      if (error.message && error.message.includes('Expected JSON')) {
        throw error;
      }
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
    // FCM token generation disabled
    const fcmToken = null;
    // let fcmToken = null;
    // try {
    //   console.log('🔔 Generating FCM token for user verifyOTP...');
    //   
    //   // Check if notifications are supported
    //   if ('Notification' in window && 'serviceWorker' in navigator) {
    //     // Request permission
    //     const permission = await Notification.requestPermission();
    //     if (permission === 'granted') {
    //       // Import Firebase messaging
    //       const { getMessaging, getToken } = await import('firebase/messaging');
    //       const { getApp: getFirebaseApp } = await import('firebase/app');
    //       
    //       // Get Firebase app and messaging instance
    //       const app = getFirebaseApp();
    //       const messaging = getMessaging(app);
    //       
    //       // Get FCM token
    //       const token = await getToken(messaging, {
    //         vapidKey: "BJEae_aP7PqzRFAAgS8BybRJ1qgxWkN6Qej5ivrcyYEUruPnxXPqiUDeu0s6i8ARBzgExXqukeKk0UEGi6m-3QU"
    //       });
    //       
    //       if (token) {
    //         fcmToken = token;
    //         console.log('✅ FCM token generated for user verifyOTP:', token.substring(0, 20) + '...');
    //       }
    //     }
    //   }
    // } catch (error) {
    //   console.error('❌ Error generating FCM token during verifyOTP:', error);
    //   // Don't fail login if FCM token generation fails
    // }

    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, email, fcmToken }),
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
    // FCM token generation disabled
    const fcmToken = null;
    // let fcmToken = null;
    // try {
    //   console.log('🔔 Generating FCM token for user login...');
    //   
    //   // Check if notifications are supported
    //   if ('Notification' in window && 'serviceWorker' in navigator) {
    //     // Request permission
    //     const permission = await Notification.requestPermission();
    //     if (permission === 'granted') {
    //       // Import Firebase messaging
    //       const { getMessaging, getToken } = await import('firebase/messaging');
    //       const { getApp: getFirebaseApp } = await import('firebase/app');
    //       
    //       // Get Firebase app and messaging instance
    //       const app = getFirebaseApp();
    //       const messaging = getMessaging(app);
    //       
    //       // Get FCM token
    //       const token = await getToken(messaging, {
    //         vapidKey: "BJEae_aP7PqzRFAAgS8BybRJ1qgxWkN6Qej5ivrcyYEUruPnxXPqiUDeu0s6i8ARBzgExXqukeKk0UEGi6m-3QU"
    //       });
    //       
    //       if (token) {
    //         fcmToken = token;
    //         console.log('✅ FCM token generated for user login:', token.substring(0, 20) + '...');
    //       }
    //     }
    //   }
    // } catch (error) {
    //   console.error('❌ Error generating FCM token during login:', error);
    //   // Don't fail login if FCM token generation fails
    // }

    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, fcmToken }),
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
