// Admin Booking API service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Booking {
  _id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  services: Array<{
    serviceId: string;
    serviceName: string;
    price: number;
  }>;
  pricing: {
    subtotal: number;
    serviceFee: number;
    totalAmount: number;
    // First-time user discount fields
    originalSubtotal?: number;
    originalServiceFee?: number;
    originalTotalAmount?: number;
    isFirstTimeUser?: boolean;
    discountApplied?: string;
  };
  scheduling: {
    preferredDate: string;
    preferredTimeSlot: string;
    scheduledDate?: string;
    scheduledTime?: string;
  };
  status: 'pending' | 'waiting_for_engineer' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'declined';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  payment: {
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    method: string;
    transactionId?: string;
    paidAt?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    gatewayResponse?: any;
    refundId?: string;
    refundAmount?: number;
    refundReason?: string;
    refundedAt?: string;
  };
  vendor?: {
    vendorId: string;
    assignedAt: string;
  };
  vendorResponse?: {
    status: 'pending' | 'accepted' | 'declined';
    respondedAt?: string;
    responseNote?: string;
  };
  notes?: string;
  assignmentNotes?: string;
  rescheduleData?: {
    isRescheduled: boolean;
    originalDate?: string;
    originalTime?: string;
    rescheduleReason?: string;
  };
  createdAt: string;
  updatedAt: string;
  bookingReference: string;
  review?: {
    rating: number;
    comment: string;
    category: string;
    isAnonymous: boolean;
    createdAt: string;
    user?: {
      name: string;
      email: string;
    };
  } | null;
}

export interface BookingStats {
  totalBookings: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingBookings: number;
  waitingForEngineerBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  paidBookings: number;
  pendingPayments: number;
  refundedBookings: number;
  dailyTrends: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    bookings: number;
    revenue: number;
  }>;
  period: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalBookings: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface BookingsResponse {
  bookings: Booking[];
  pagination: PaginationInfo;
  stats: BookingStats;
}

class AdminBookingApi {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get admin token from localStorage and validate it
    const token = localStorage.getItem('adminToken');
    
    if (!token || typeof token !== 'string' || token.trim() === '' || token === 'undefined' || token === 'null') {
      console.warn('No valid admin token found in Admin Booking API request');
      throw new Error('No valid authentication token found. Please login again.');
    }
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      console.log('Admin Booking API request:', url);
      const response = await fetch(url, config);
      
      console.log('Admin Booking API response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          // Clear auth data on 401 errors
          localStorage.removeItem('adminAuthData');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('adminData');
          throw new Error('Authentication expired. Please login again.');
        }
        
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Admin Booking API request failed:', error);
      throw error;
    }
  }

  // Get all bookings with filters and pagination
  async getAllBookings(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<BookingsResponse>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await this.request<BookingsResponse>(`/admin/bookings?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching admin bookings:', error);
      return {
        success: false,
        message: 'Failed to fetch bookings',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get single booking by ID
  async getBookingById(bookingId: string): Promise<ApiResponse<{ booking: Booking; bookingReference: string }>> {
    try {
      const response = await this.request<{ booking: Booking; bookingReference: string }>(`/admin/bookings/${bookingId}`);
      return response;
    } catch (error) {
      console.error('Error fetching booking:', error);
      return {
        success: false,
        message: 'Failed to fetch booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId: string, status: string): Promise<ApiResponse<{ booking: Booking; bookingReference: string }>> {
    try {
      const response = await this.request<{ booking: Booking; bookingReference: string }>(`/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return response;
    } catch (error) {
      console.error('Error updating booking status:', error);
      return {
        success: false,
        message: 'Failed to update booking status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update booking priority
  async updateBookingPriority(bookingId: string, priority: string): Promise<ApiResponse<{ booking: Booking; bookingReference: string }>> {
    try {
      const response = await this.request<{ booking: Booking; bookingReference: string }>(`/admin/bookings/${bookingId}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ priority })
      });
      return response;
    } catch (error) {
      console.error('Error updating booking priority:', error);
      return {
        success: false,
        message: 'Failed to update booking priority',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update booking details
  async updateBooking(bookingId: string, bookingData: {
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
      };
    };
    scheduling?: {
      scheduledDate?: string;
      scheduledTime?: string;
      preferredDate?: string;
      preferredTimeSlot?: string;
    };
    notes?: string;
  }): Promise<ApiResponse<{ booking: Booking; bookingReference: string }>> {
    try {
      const response = await this.request<{ booking: Booking; bookingReference: string }>(`/admin/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify(bookingData)
      });
      return response;
    } catch (error) {
      console.error('Error updating booking:', error);
      return {
        success: false,
        message: 'Failed to update booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Assign vendor to booking
  async assignVendor(bookingId: string, vendorId: string, scheduledDate?: string, scheduledTime?: string, priority?: string, notes?: string): Promise<ApiResponse<{ booking: Booking; bookingReference: string }>> {
    try {
      const requestBody: any = { vendorId };
      if (scheduledDate) requestBody.scheduledDate = scheduledDate;
      if (scheduledTime) requestBody.scheduledTime = scheduledTime;
      if (priority) requestBody.priority = priority;
      if (notes) requestBody.notes = notes;
      
      const response = await this.request<{ booking: Booking; bookingReference: string }>(`/admin/bookings/${bookingId}/assign-vendor`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody)
      });
      return response;
    } catch (error) {
      console.error('Error assigning vendor:', error);
      return {
        success: false,
        message: 'Failed to assign vendor',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Process refund for booking
  async processRefund(bookingId: string, amount?: number, reason?: string): Promise<ApiResponse<{ booking: Booking; bookingReference: string; refund: any }>> {
    try {
      const response = await this.request<{ booking: Booking; bookingReference: string; refund: any }>(`/admin/bookings/${bookingId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason })
      });
      return response;
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        message: 'Failed to process refund',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get booking statistics
  async getBookingStats(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<ApiResponse<BookingStats>> {
    try {
      const response = await this.request<BookingStats>(`/admin/bookings/stats?period=${period}`);
      return response;
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      return {
        success: false,
        message: 'Failed to fetch booking statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete booking
  async deleteBooking(bookingId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.request<void>(`/admin/bookings/${bookingId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting booking:', error);
      return {
        success: false,
        message: 'Failed to delete booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Create singleton instance
const adminBookingApi = new AdminBookingApi();

export default adminBookingApi;
export type { Booking as AdminBooking, BookingStats as AdminBookingStats, BookingsResponse, PaginationInfo, ApiResponse };
