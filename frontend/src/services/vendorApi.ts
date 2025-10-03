// Vendor API service for Fixifly backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface ServiceLocation {
  _id: string;
  from: string;
  to: string;
  isActive: boolean;
  addedAt: string;
}

interface Vendor {
  id: string;
  vendorId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  serviceCategories: string[];
  customServiceCategory?: string;
  experience: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
  serviceLocations?: ServiceLocation[];
  profileImage?: string;
  specialty?: string;
  bio?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;
  isApproved: boolean;
  isActive: boolean;
  isBlocked: boolean;
  rating: {
    average: number;
    count: number;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    cancelledTasks: number;
    totalEarnings: number;
    lastLoginAt?: string;
    joinedDate: string;
  };
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: string;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: string[];
  };
}

interface VendorAuthResponse {
  vendor: Vendor;
  token: string;
  message?: string;
}

class VendorApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('vendorToken');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
      console.log('Vendor token found, length:', token.length);
    } else {
      console.log('No vendor token found in localStorage');
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log('Making vendor API request to:', url);
      console.log('Request config:', config);
      console.log('Base URL:', this.baseURL);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Endpoint:', endpoint);
      console.log('Token exists:', !!token);
      
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);
      console.log('Response headers:', response.headers);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('=== API ERROR RESPONSE ===');
        console.error('Status:', response.status);
        console.error('Status text:', response.statusText);
        console.error('Error data:', data);
        console.error('URL:', url);
        console.error('Config:', config);
        console.error('=== END API ERROR RESPONSE ===');
        
        // Handle authentication errors
        if (response.status === 401) {
          console.error('Authentication failed:', data);
          // Clear invalid token
          localStorage.removeItem('vendorToken');
          localStorage.removeItem('vendorData');
          // Redirect to login page
          window.location.href = '/vendor/login';
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('Vendor API request failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      // Handle Network errors  
      if (error.code === 'NETWORK_ERROR' || error.message.includes('fetch') || error.name === 'TypeError') {
        console.error('Network error - backend might be down or CORS issue');
        console.error('Backend URL:', url);
        console.error('Check if backend is running on:', this.baseURL);
        throw new Error('Network error: Please check your internet connection and try again.');
      }
      
      // Handle HTTP errors with more details
      if (error.response) {
        const { status, data } = error.response;
        if (status === 400 && data.errors) {
          // Validation errors
          throw new Error(data.errors.join('. '));
        } else if (data.message) {
          // Custom server messages
          throw new Error(data.message);
        } else {
          throw new Error(`Server error (${status}). Please try again.`);
        }
      }
      
      throw error;
    }
  }

  // Health check method
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health', {
      method: 'GET',
    });
  }

  // Test method
  async test(): Promise<ApiResponse> {
    return this.request('/vendors/test', {
      method: 'GET',
    });
  }

  // Test authentication
  async testAuth(): Promise<ApiResponse<any>> {
    console.log('=== TESTING VENDOR AUTH ===');
    const response = await this.request('/bookings/test-auth');
    console.log('Auth test response:', response);
    return response;
  }

  // Vendor Registration
  async register(vendorData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    serviceCategories: string[];
    customServiceCategory?: string;
    experience: string;
    address?: any;
  }): Promise<ApiResponse<VendorAuthResponse>> {
    return this.request('/vendors/register', {
      method: 'POST',
      body: JSON.stringify(vendorData),
    });
  }

  // Vendor Login
  async login(email: string, password: string): Promise<ApiResponse<VendorAuthResponse>> {
    return this.request('/vendors/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Get Vendor Profile
  async getVendorProfile(): Promise<ApiResponse<{ vendor: Vendor }>> {
    return this.request('/vendors/profile', {
      method: 'GET',
    });
  }

  // Update Vendor Profile
  async updateVendorProfile(profileData: any): Promise<ApiResponse<{ vendor: Vendor }>> {
    return this.request('/vendors/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Change Password
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/vendors/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Get Vendor Statistics
  async getVendorStats(): Promise<ApiResponse<{ stats: any; rating: any }>> {
    return this.request('/vendors/stats', {
      method: 'GET',
    });
  }

  // Get Vendor Dashboard
  async getVendorDashboard(): Promise<ApiResponse<any>> {
    return this.request('/vendors/dashboard', {
      method: 'GET',
    });
  }

  // Get Available Tasks
  async getAvailableTasks(): Promise<ApiResponse<any>> {
    return this.request('/vendors/tasks', {
      method: 'GET',
    });
  }

  // Get Vendor's Assigned Bookings
  async getVendorBookings(): Promise<ApiResponse<any>> {
    console.log('Fetching vendor bookings...');
    const response = await this.request('/bookings/vendor/me', {
      method: 'GET',
    });
    console.log('Vendor bookings response:', response);
    return response;
  }


  // Get Booking by ID
  async getBookingById(bookingId: string): Promise<ApiResponse<any>> {
    console.log('Fetching booking by ID:', bookingId);
    const response = await this.request(`/bookings/${bookingId}`, {
      method: 'GET',
    });
    console.log('Booking by ID response:', response);
    return response;
  }

  // Update Booking Status
  async updateBookingStatus(bookingId: string, status: string, completionData?: any): Promise<ApiResponse<any>> {
    console.log('Updating booking status:', { bookingId, status, completionData });
    const response = await this.request(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status, 
        completionData: completionData || null 
      }),
    });
    console.log('Update booking status response:', response);
    return response;
  }

  // Accept Task
  async acceptTask(bookingId: string): Promise<ApiResponse<any>> {
    console.log('Accepting task:', { bookingId });
    const response = await this.request(`/bookings/${bookingId}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        vendorResponse: {
          status: 'accepted',
          respondedAt: new Date().toISOString()
        }
      }),
    });
    console.log('Accept task response:', response);
    return response;
  }

  // Decline Task
  async declineTask(bookingId: string, reason: string): Promise<ApiResponse<any>> {
    console.log('Declining task:', { bookingId, reason });
    const response = await this.request(`/bookings/${bookingId}/decline`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        vendorResponse: {
          status: 'declined',
          respondedAt: new Date().toISOString(),
          responseNote: reason
        }
      }),
    });
    console.log('Decline task response:', response);
    return response;
  }

  // Complete Task
  async completeTask(bookingId: string, completionData: {
    resolutionNote: string;
    billingAmount: number;
    spareParts: Array<{
      id: number;
      name: string;
      amount: string;
      photo: string | null;
    }>;
    paymentMethod: 'online' | 'cash';
    travelingAmount: string;
    includeGST?: boolean;
    gstAmount?: number;
    totalAmount?: number;
  }): Promise<ApiResponse<any>> {
    console.log('=== VENDOR API COMPLETE TASK DEBUG ===');
    console.log('Booking ID:', bookingId);
    console.log('Completion data:', completionData);
    console.log('API Base URL:', this.baseURL);
    console.log('Full endpoint:', `${this.baseURL}/bookings/${bookingId}/complete`);
    
    const requestBody = { 
      completionData: {
        resolutionNote: completionData.resolutionNote,
        billingAmount: completionData.billingAmount,
        spareParts: completionData.spareParts,
        paymentMethod: completionData.paymentMethod,
        travelingAmount: completionData.travelingAmount,
        includeGST: completionData.includeGST,
        gstAmount: completionData.gstAmount,
        totalAmount: completionData.totalAmount,
        completedAt: new Date().toISOString()
      }
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    try {
      const response = await this.request(`/bookings/${bookingId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });
      console.log('Complete task response:', response);
      return response;
    } catch (error) {
      console.error('Complete task error:', error);
      throw error;
    }
  }

  // Reschedule Task
  async rescheduleTask(bookingId: string, rescheduleData: {
    newDate: string;
    newTime: string;
    reason: string;
  }): Promise<ApiResponse<any>> {
    console.log('Rescheduling task:', { bookingId, rescheduleData });
    const response = await this.request(`/bookings/${bookingId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(rescheduleData),
    });
    console.log('Reschedule task response:', response);
    return response;
  }

  // Cancel Task
  async cancelTask(bookingId: string, reason: string): Promise<ApiResponse<any>> {
    console.log('Cancelling task:', { bookingId, reason });
    const response = await this.request(`/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    console.log('Cancel task response:', response);
    return response;
  }

  // Support Ticket Methods
  // Get assigned support tickets
  async getAssignedSupportTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  } = {}): Promise<ApiResponse<any>> {
    console.log('Fetching assigned support tickets:', params);
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await this.request(`/support-tickets/vendor/assigned?${queryParams}`, {
      method: 'GET',
    });
    console.log('Assigned support tickets response:', response);
    return response;
  }

  // Accept support ticket
  async acceptSupportTicket(ticketId: string): Promise<ApiResponse<any>> {
    console.log('Accepting support ticket:', ticketId);
    const response = await this.request(`/support-tickets/vendor/${ticketId}/accept`, {
      method: 'PUT',
    });
    console.log('Accept support ticket response:', response);
    return response;
  }

  // Decline support ticket
  async declineSupportTicket(ticketId: string, reason: string): Promise<ApiResponse<any>> {
    console.log('Declining support ticket:', { ticketId, reason });
    const response = await this.request(`/support-tickets/vendor/${ticketId}/decline`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    console.log('Decline support ticket response:', response);
    return response;
  }

  // Complete support ticket
  async completeSupportTicket(ticketId: string, completionData: {
    resolutionNote: string;
    spareParts?: Array<{
      id: number;
      name: string;
      amount: string;
      photo: string | null;
    }>;
    paymentMethod?: 'online' | 'cash';
    totalAmount?: number;
    includeGST?: boolean;
    gstAmount?: number;
    travelingAmount?: string;
    billingAmount?: number;
  }): Promise<ApiResponse<any>> {
    console.log('Completing support ticket:', { ticketId, completionData });
    const response = await this.request(`/support-tickets/vendor/${ticketId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ 
        completionData: {
          resolutionNote: completionData.resolutionNote,
          spareParts: completionData.spareParts || [],
          paymentMethod: completionData.paymentMethod || 'cash',
          totalAmount: completionData.totalAmount || 0,
          includeGST: completionData.includeGST || false,
          gstAmount: completionData.gstAmount || 0,
          travelingAmount: completionData.travelingAmount || '0',
          billingAmount: completionData.billingAmount || 0,
          completedAt: new Date().toISOString()
        }
      }),
    });
    console.log('Complete support ticket response:', response);
    return response;
  }

  // Get support ticket by ID
  async getSupportTicketById(ticketId: string): Promise<ApiResponse<any>> {
    console.log('Fetching support ticket:', ticketId);
    const response = await this.request(`/support-tickets/vendor/${ticketId}`, {
      method: 'GET',
    });
    console.log('Get support ticket response:', response);
    return response;
  }

  // Reschedule support ticket
  async rescheduleSupportTicket(ticketId: string, rescheduleData: {
    newDate: string;
    newTime: string;
    reason: string;
  }): Promise<ApiResponse<any>> {
    console.log('Rescheduling support ticket:', { ticketId, rescheduleData });
    const response = await this.request(`/support-tickets/vendor/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(rescheduleData),
    });
    console.log('Reschedule support ticket response:', response);
    return response;
  }

  // Cancel support ticket
  async cancelSupportTicket(ticketId: string, reason: string): Promise<ApiResponse<any>> {
    console.log('Cancelling support ticket:', { ticketId, reason });
    const response = await this.request(`/support-tickets/vendor/${ticketId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    console.log('Cancel support ticket response:', response);
    return response;
  }

  // Deactivate Account
  async deactivateAccount(): Promise<ApiResponse> {
    return this.request('/vendors/deactivate', {
      method: 'PUT',
    });
  }

  // Upload Profile Image
  async uploadProfileImage(formData: FormData): Promise<ApiResponse<{ profileImage: string; imageUrl: string }>> {
    const token = localStorage.getItem('vendorToken');
    const url = `${this.baseURL}/vendors/profile/image`;
    
    if (!token) {
      throw new Error('No authentication token found. Please login as a vendor first.');
    }
    
    console.log('Uploading profile image to:', url);
    console.log('Token exists:', !!token);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        console.error('Authentication failed during image upload:', data);
        // Clear invalid token
        localStorage.removeItem('vendorToken');
        localStorage.removeItem('vendorData');
        // Redirect to login page
        window.location.href = '/vendor/login';
      }
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Delete Profile Image
  async deleteProfileImage(): Promise<ApiResponse> {
    return this.request('/vendors/profile/image', {
      method: 'DELETE',
    });
  }

  // Service Location Methods
  // Add service location
  async addServiceLocation(from: string, to: string): Promise<ApiResponse<{ serviceLocations: ServiceLocation[] }>> {
    return this.request('/vendors/service-locations', {
      method: 'POST',
      body: JSON.stringify({ from, to }),
    });
  }

  // Update service location
  async updateServiceLocation(locationId: string, from: string, to: string, isActive: boolean = true): Promise<ApiResponse<{ serviceLocations: ServiceLocation[] }>> {
    return this.request(`/vendors/service-locations/${locationId}`, {
      method: 'PUT',
      body: JSON.stringify({ from, to, isActive }),
    });
  }

  // Remove service location
  async removeServiceLocation(locationId: string): Promise<ApiResponse<{ serviceLocations: ServiceLocation[] }>> {
    return this.request(`/vendors/service-locations/${locationId}`, {
      method: 'DELETE',
    });
  }

}

// Create singleton instance
const vendorApiService = new VendorApiService();

export default vendorApiService;
export type { ApiResponse, Vendor, VendorAuthResponse, ServiceLocation };
