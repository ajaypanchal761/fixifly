const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AdminRegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  department?: string;
  designation?: string;
}

interface AdminLoginData {
  email: string;
  password: string;
}

interface AdminResponse {
  success: boolean;
  message: string;
  data?: {
    admin: {
      _id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      department: string;
      designation: string;
      isActive: boolean;
      createdAt: string;
    };
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  };
}

interface AdminProfileResponse {
  success: boolean;
  data?: {
    admin: {
      _id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      department: string;
      designation: string;
      isActive: boolean;
      isEmailVerified: boolean;
      isPhoneVerified: boolean;
      isProfileComplete: boolean;
      stats: {
        totalLogins: number;
        lastLoginAt: string;
        lastLoginIP: string;
        totalActions: number;
        usersManaged: number;
        vendorsManaged: number;
        bookingsProcessed: number;
        supportTicketsResolved: number;
      };
      preferences: {
        notifications: {
          email: boolean;
          sms: boolean;
          push: boolean;
          systemAlerts: boolean;
        };
        language: string;
        timezone: string;
        dashboardLayout: string;
      };
      createdAt: string;
      updatedAt: string;
    };
  };
}

class AdminApiService {
  private getAccessToken(): string | null {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token || typeof token !== 'string' || token.trim() === '' || token === 'undefined' || token === 'null') {
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  private getAuthHeaders() {
    try {
      const token = this.getAccessToken();
      const refreshToken = localStorage.getItem('adminRefreshToken');
      const adminData = localStorage.getItem('adminData');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('No valid admin token found. User may need to login again.');
      }
      
      return headers;
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {
        'Content-Type': 'application/json'
      };
    }
  }

  async register(adminData: AdminRegisterData): Promise<AdminResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store admin data and tokens
      if (data.success && data.data) {
        this.storeTokens(data.data.accessToken, data.data.refreshToken);
        localStorage.setItem('adminData', JSON.stringify(data.data.admin));
      }

      return data;
    } catch (error: any) {
      console.error('Admin registration error:', error);
      throw new Error(error.message || 'Failed to register admin');
    }
  }

  async login(loginData: AdminLoginData): Promise<AdminResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      console.log('Admin login response:', {
        success: data.success,
        hasData: !!data.data,
        hasAccessToken: !!data.data?.accessToken,
        hasRefreshToken: !!data.data?.refreshToken,
        hasAdmin: !!data.data?.admin,
        accessToken: data.data?.accessToken ? `${data.data.accessToken.substring(0, 20)}...` : 'missing',
        refreshToken: data.data?.refreshToken ? `${data.data.refreshToken.substring(0, 20)}...` : 'missing'
      });

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store admin data and tokens
      if (data.success && data.data) {
        console.log('Storing tokens...');
        this.storeTokens(data.data.accessToken, data.data.refreshToken);
        localStorage.setItem('adminData', JSON.stringify(data.data.admin));
        console.log('Tokens stored successfully');
      }

      return data;
    } catch (error: any) {
      console.error('Admin login error:', error);
      throw new Error(error.message || 'Failed to login');
    }
  }

  async getProfile(): Promise<AdminProfileResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      return data;
    } catch (error: any) {
      console.error('Get admin profile error:', error);
      throw new Error(error.message || 'Failed to fetch profile');
    }
  }

  async updateProfile(profileData: Partial<AdminRegisterData>): Promise<AdminResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return data;
    } catch (error: any) {
      console.error('Update admin profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return data;
    } catch (error: any) {
      console.error('Change password error:', error);
      throw new Error(error.message || 'Failed to change password');
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const refreshToken = this.getRefreshToken();
      const token = this.getAccessToken();
      
      // If no token or refresh token, just clear local data and return success
      if (!token && !refreshToken) {
        this.clearAuthData();
        return { success: true, message: 'Logged out successfully' };
      }
      
      // Try to logout on backend if we have tokens
      try {
        const response = await fetch(`${API_BASE_URL}/admin/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ refreshToken })
        });

        const data = await response.json();

        if (!response.ok) {
          // If logout fails (e.g., token expired), still clear local data
          this.clearAuthData();
          return { success: true, message: 'Logged out successfully' };
        }

        // Clear auth data after successful logout
        this.clearAuthData();
        return data;
      } catch (fetchError: any) {
        // If network error or token is invalid, just clear local data
        console.warn('Logout API call failed, clearing local auth data:', fetchError.message);
        this.clearAuthData();
        return { success: true, message: 'Logged out successfully' };
      }
    } catch (error: any) {
      console.error('Admin logout error:', error);
      // Clear auth data even if logout fails
      this.clearAuthData();
      return { success: true, message: 'Logged out successfully' };
    }
  }

  // Helper method to check if admin is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    return !!(token && adminData);
  }

  // Helper method to get stored admin data
  getStoredAdminData() {
    try {
      const adminData = localStorage.getItem('adminData');
      return adminData ? JSON.parse(adminData) : null;
    } catch (error) {
      console.error('Error parsing admin data:', error);
      return null;
    }
  }

  // Helper method to clear authentication data
  clearAuthData() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminData');
  }

  // Helper method to store tokens
  private storeTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('adminRefreshToken', refreshToken);
  }

  // Helper method to get refresh token
  private getRefreshToken(): string | null {
    return localStorage.getItem('adminRefreshToken');
  }

  // Helper method to check if access token is expired
  private isAccessTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Method to refresh access token
  async refreshAccessToken(): Promise<{ success: boolean; data?: { accessToken: string; refreshToken: string } }> {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/admin/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Store new tokens
      this.storeTokens(data.data.accessToken, data.data.refreshToken);

      return {
        success: true,
        data: {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken
        }
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      // Clear auth data on refresh failure
      this.clearAuthData();
      throw new Error(error.message || 'Token refresh failed');
    }
  }

  // Enhanced request method with automatic token refresh
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    let token = localStorage.getItem('adminToken');
    
    // Check if token is expired and refresh if needed
    if (token && this.isAccessTokenExpired(token)) {
      try {
        await this.refreshAccessToken();
        token = localStorage.getItem('adminToken');
      } catch (error) {
        // If refresh fails, redirect to login
        window.location.href = '/admin/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Only set Content-Type for JSON, not for FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    // If we get 401, try to refresh token once
    if (response.status === 401 && token) {
      try {
        await this.refreshAccessToken();
        const newToken = localStorage.getItem('adminToken');
        
        if (newToken) {
          // Retry the request with new token
          const retryHeaders: Record<string, string> = {
            ...headers,
            'Authorization': `Bearer ${newToken}`
          };
          
          return await fetch(url, {
            ...options,
            headers: retryHeaders
          });
        }
      } catch (error) {
        // If refresh fails, clear auth data and redirect
        this.clearAuthData();
        window.location.href = '/admin/login';
      }
    }

    return response;
  }

  // ==================== CARD MANAGEMENT ====================

  // Get all cards
  async getCards(params?: {
    page?: number;
    limit?: number;
    search?: string;
    speciality?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    success: boolean;
    data: {
      cards: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalCards: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
  }> {
    try {
      console.log('getCards called with params:', params);
      console.log('Params type:', typeof params);
      console.log('Params is null:', params === null);
      console.log('Params is undefined:', params === undefined);
      
      // Check if admin token exists
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Admin not authenticated. Please login again.');
      }
      
      const queryParams = new URLSearchParams();
      
      // Ensure params is a valid object - provide default if undefined/null
      const safeParams = params || {};
      console.log('Safe params:', safeParams);
      
      if (typeof safeParams === 'object' && safeParams !== null && !Array.isArray(safeParams)) {
        try {
          Object.entries(safeParams).forEach(([key, value]) => {
            console.log(`Processing param: ${key} = ${value} (type: ${typeof value})`);
            if (value !== undefined && value !== null && value !== '') {
              queryParams.append(key, value.toString());
            }
          });
        } catch (entriesError) {
          console.error('Error processing params entries:', entriesError);
          console.log('Params that caused error:', safeParams);
        }
      } else {
        console.log('Safe params is not a valid object:', safeParams);
      }

      // Ensure API_BASE_URL is defined
      const baseUrl = API_BASE_URL || 'http://localhost:5000/api';
      console.log('API_BASE_URL:', baseUrl);
      
      const url = `${baseUrl}/admin/cards?${queryParams}`;
      console.log('Fetching from URL:', url);
      console.log('Auth headers:', this.getAuthHeaders());
      console.log('Query params string:', queryParams.toString());

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      }).catch(fetchError => {
        console.error('Network error:', fetchError);
        throw new Error('Network error: Unable to connect to server');
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response type:', response.type);
      
      // Check if response is valid
      if (!response) {
        throw new Error('No response received from server');
      }
      
      let data = null;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        if (responseText) {
          data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
        } else {
          console.log('Empty response text');
          data = {};
        }
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        
        if (data && typeof data === 'object' && data.message) {
          errorMessage = data.message;
        } else if (data && typeof data === 'string') {
          errorMessage = data;
        }
        
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        throw new Error(errorMessage);
      }

      // Final validation of data
      if (!data || typeof data !== 'object') {
        console.error('Invalid data structure received:', data);
        throw new Error('Invalid data structure received from server');
      }
      
      console.log('Successfully processed response data');
      return data;
    } catch (error: any) {
      console.error('Get cards error:', error);
      throw new Error(error.message || 'Failed to fetch cards');
    }
  }

  // Get single card
  async getCard(cardId: string): Promise<{
    success: boolean;
    data: { card: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cards/${cardId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch card');
      }

      return data;
    } catch (error: any) {
      console.error('Get card error:', error);
      throw new Error(error.message || 'Failed to fetch card');
    }
  }

  // Create new card
  async createCard(cardData: {
    name: string;
    speciality: string;
    subtitle: string;
    price?: number;
    image: string;
    isPopular?: boolean;
    isFeatured?: boolean;
    location?: any;
    serviceDetails?: any;
    availability?: any;
    tags?: string[];
    displayOrder?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: { card: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cards`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(cardData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create card');
      }

      return data;
    } catch (error: any) {
      console.error('Create card error:', error);
      throw new Error(error.message || 'Failed to create card');
    }
  }

  // Create new card with file upload
  async createCardWithFile(formData: FormData): Promise<{
    success: boolean;
    message: string;
    data: { card: any };
  }> {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create card');
      }

      return data;
    } catch (error: any) {
      console.error('Create card with file error:', error);
      throw new Error(error.message || 'Failed to create card');
    }
  }

  // Update card
  async updateCard(cardId: string, cardData: any): Promise<{
    success: boolean;
    message: string;
    data: { card: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cards/${cardId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(cardData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update card');
      }

      return data;
    } catch (error: any) {
      console.error('Update card error:', error);
      throw new Error(error.message || 'Failed to update card');
    }
  }

  // Update card with file upload
  async updateCardWithFile(cardId: string, formData: FormData): Promise<{
    success: boolean;
    message: string;
    data: { card: any };
  }> {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update card');
      }

      return data;
    } catch (error: any) {
      console.error('Update card with file error:', error);
      throw new Error(error.message || 'Failed to update card');
    }
  }

  // Delete card
  async deleteCard(cardId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cards/${cardId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete card');
      }

      return data;
    } catch (error: any) {
      console.error('Delete card error:', error);
      throw new Error(error.message || 'Failed to delete card');
    }
  }

  // Toggle card status
  async toggleCardStatus(cardId: string): Promise<{
    success: boolean;
    message: string;
    data: { card: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cards/${cardId}/toggle-status`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle card status');
      }

      return data;
    } catch (error: any) {
      console.error('Toggle card status error:', error);
      throw new Error(error.message || 'Failed to toggle card status');
    }
  }

  // Toggle popular status
  async togglePopularStatus(cardId: string): Promise<{
    success: boolean;
    message: string;
    data: { card: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cards/${cardId}/toggle-popular`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle popular status');
      }

      return data;
    } catch (error: any) {
      console.error('Toggle popular status error:', error);
      throw new Error(error.message || 'Failed to toggle popular status');
    }
  }

  // Toggle featured status
  async toggleFeaturedStatus(cardId: string): Promise<{
    success: boolean;
    message: string;
    data: { card: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cards/${cardId}/toggle-featured`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle featured status');
      }

      return data;
    } catch (error: any) {
      console.error('Toggle featured status error:', error);
      throw new Error(error.message || 'Failed to toggle featured status');
    }
  }

  // Get card statistics
  async getCardStats(): Promise<{
    success: boolean;
    data: { stats: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cards/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch card statistics');
      }

      return data;
    } catch (error: any) {
      console.error('Get card stats error:', error);
      throw new Error(error.message || 'Failed to fetch card statistics');
    }
  }

  // ==================== USER MANAGEMENT ====================

  // Get all users
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    success: boolean;
    data: {
      users: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalUsers: number;
        hasNext: boolean;
        hasPrev: boolean;
        limit: number;
      };
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/admin/users?${queryParams}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      return data;
    } catch (error: any) {
      console.error('Get users error:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }
  }

  // Get user statistics
  async getUserStats(): Promise<{
    success: boolean;
    data: { stats: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user statistics');
      }

      return data;
    } catch (error: any) {
      console.error('Get user stats error:', error);
      throw new Error(error.message || 'Failed to fetch user statistics');
    }
  }

  // Get single user
  async getUser(userId: string): Promise<{
    success: boolean;
    data: { user: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      return data;
    } catch (error: any) {
      console.error('Get user error:', error);
      throw new Error(error.message || 'Failed to fetch user');
    }
  }

  // Update user status (block/unblock)
  async updateUserStatus(userId: string, action: 'block' | 'unblock'): Promise<{
    success: boolean;
    message: string;
    data: { user: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user status');
      }

      return data;
    } catch (error: any) {
      console.error('Update user status error:', error);
      throw new Error(error.message || 'Failed to update user status');
    }
  }

  // Update user information
  async updateUser(userId: string, userData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: any;
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    data: { user: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      return data;
    } catch (error: any) {
      console.error('Update user error:', error);
      throw new Error(error.message || 'Failed to update user');
    }
  }

  // Delete user
  async deleteUser(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      return data;
    } catch (error: any) {
      console.error('Delete user error:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  }

  // Send email to user
  async sendEmailToUser(userId: string, emailData: {
    subject: string;
    message: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/send-email`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(emailData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      return data;
    } catch (error: any) {
      console.error('Send email error:', error);
      throw new Error(error.message || 'Failed to send email');
    }
  }

  // ==================== VENDOR MANAGEMENT ====================

  // Get all vendors
  async getVendors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    verificationStatus?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    success: boolean;
    data: {
      vendors: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalVendors: number;
        hasNext: boolean;
        hasPrev: boolean;
        limit: number;
      };
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/admin/vendors?${queryParams}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch vendors');
      }

      return data;
    } catch (error: any) {
      console.error('Get vendors error:', error);
      throw new Error(error.message || 'Failed to fetch vendors');
    }
  }

  // Get vendor statistics
  async getVendorStats(): Promise<{
    success: boolean;
    data: { stats: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vendors/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch vendor statistics');
      }

      return data;
    } catch (error: any) {
      console.error('Get vendor stats error:', error);
      throw new Error(error.message || 'Failed to fetch vendor statistics');
    }
  }

  // Get single vendor
  async getVendor(vendorId: string): Promise<{
    success: boolean;
    data: { vendor: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch vendor');
      }

      return data;
    } catch (error: any) {
      console.error('Get vendor error:', error);
      throw new Error(error.message || 'Failed to fetch vendor');
    }
  }

  // Update vendor status
  async updateVendorStatus(vendorId: string, action: 'approve' | 'reject' | 'activate' | 'deactivate' | 'block' | 'unblock'): Promise<{
    success: boolean;
    message: string;
    data: { vendor: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update vendor status');
      }

      return data;
    } catch (error: any) {
      console.error('Update vendor status error:', error);
      throw new Error(error.message || 'Failed to update vendor status');
    }
  }

  // Update vendor information
  async updateVendor(vendorId: string, vendorData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    serviceCategories?: string[];
    experience?: string;
    address?: any;
    specialty?: string;
    bio?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isApproved?: boolean;
    isActive?: boolean;
    isBlocked?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    data: { vendor: any };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(vendorData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update vendor');
      }

      return data;
    } catch (error: any) {
      console.error('Update vendor error:', error);
      throw new Error(error.message || 'Failed to update vendor');
    }
  }

  // Delete vendor
  async deleteVendor(vendorId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete vendor');
      }

      return data;
    } catch (error: any) {
      console.error('Delete vendor error:', error);
      throw new Error(error.message || 'Failed to delete vendor');
    }
  }

  // Send email to vendor
  async sendEmailToVendor(vendorId: string, emailData: {
    subject: string;
    message: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/email/vendor/${vendorId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(emailData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      return data;
    } catch (error: any) {
      console.error('Send email to vendor error:', error);
      throw new Error(error.message || 'Failed to send email');
    }
  }

  // Grant account access to vendor (enable without ₹3999 deposit)
  async grantAccountAccess(vendorId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/grant-access`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to grant account access');
      }

      return data;
    } catch (error: any) {
      console.error('Grant account access error:', error);
      throw new Error(error.message || 'Failed to grant account access');
    }
  }

  // Send test email
  async sendTestEmail(to: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/email/test`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ to })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send test email');
      }

      return data;
    } catch (error: any) {
      console.error('Send test email error:', error);
      throw new Error(error.message || 'Failed to send test email');
    }
  }

  // Get email service status
  async getEmailStatus(): Promise<{
    success: boolean;
    data: {
      isConfigured: boolean;
      isConnected: boolean;
      smtpConfig: any;
    };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/email/status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get email status');
      }

      return data;
    } catch (error: any) {
      console.error('Get email status error:', error);
      throw new Error(error.message || 'Failed to get email status');
    }
  }

  // Get dashboard statistics
  async getDashboardStats(month?: number, year?: number): Promise<{
    success: boolean;
    data: {
      overview: {
        totalUsers: number;
        totalVendors: number;
        totalServices: number;
        totalBookings: number;
        totalRevenue: number;
        monthlyRevenue: number;
        pendingVendors: number;
        activeVendors: number;
        blockedVendors: number;
        pendingBookings: number;
        activeAMCSubscriptions: number;
        totalAMCAmount: number;
        pendingWithdrawalRequests: number;
      };
      recentActivity: {
        recentUsers: number;
        recentVendors: number;
        recentBookings: number;
      };
      dateRange: {
        startDate: string;
        endDate: string;
        month: number;
        year: number;
      };
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/admin/dashboard${queryString ? `?${queryString}` : ''}`;
      
      console.log('Dashboard stats request to:', url);

      // Use makeAuthenticatedRequest which handles token refresh automatically
      const response = await this.makeAuthenticatedRequest(url, {
        method: 'GET',
      });

      console.log('Dashboard stats response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          // Token refresh failed, auth data already cleared by makeAuthenticatedRequest
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Dashboard stats request failed:', error);
      throw error;
    }
  }

  // Product Management Methods
  async createProduct(productData: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create product request failed:', error);
      throw error;
    }
  }

  async createProductWithImage(formData: FormData) {
    try {
      console.log('Making request to:', `${API_BASE_URL}/admin/products`);
      console.log('API_BASE_URL:', API_BASE_URL);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/admin/products`, {
        method: 'POST',
        // Don't set Content-Type header, let browser set it with boundary for FormData
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create product with image request failed:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      }
      throw error;
    }
  }

  async updateProductWithImage(productId: string, formData: FormData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'PUT',
        // Don't set Content-Type header, let browser set it with boundary for FormData
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update product with image request failed:', error);
      throw error;
    }
  }

  async getAllProducts(params?: { page?: number; limit?: number; status?: string; serviceType?: string; search?: string }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.serviceType) queryParams.append('serviceType', params.serviceType);
      if (params?.search) queryParams.append('search', params.search);

      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/admin/products?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get products request failed:', error);
      throw error;
    }
  }

  async getProduct(productId: string) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get product request failed:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, productData: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update product request failed:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete product request failed:', error);
      throw error;
    }
  }

  async updateProductStatus(productId: string, status: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update product status request failed:', error);
      throw error;
    }
  }

  async toggleProductFeatured(productId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Toggle product featured request failed:', error);
      throw error;
    }
  }

  async getProductStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get product stats request failed:', error);
      throw error;
    }
  }

  // Update FCM token for push notifications - DISABLED
  async updateFCMToken(fcmToken: string) {
    // PUSH NOTIFICATIONS DISABLED
    console.log('⚠️ Push notifications are disabled - FCM token update disabled');
    return {
      success: false,
      message: 'Push notifications are disabled'
    };
    // try {
    //   const response = await fetch(`${API_BASE_URL}/admin/update-fcm-token`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${this.getAccessToken()}`
    //     },
    //     body: JSON.stringify({
    //       fcmToken
    //     })
    //   });

    //   if (!response.ok) {
    //     const error = await response.json();
    //     throw new Error(error.message || `HTTP error! status: ${response.status}`);
    //   }

    //   return await response.json();
    // } catch (error) {
    //   console.error('Update FCM token request failed:', error);
    //   throw error;
    // }
  }

}

const adminApiService = new AdminApiService();
export default adminApiService;
