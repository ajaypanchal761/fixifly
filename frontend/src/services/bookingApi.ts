// Booking API service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface BookingService {
  serviceId: string;
  serviceName: string;
  price: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface BookingPricing {
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
}

export interface BookingScheduling {
  preferredDate: string;
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening';
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface BookingData {
  customer: CustomerInfo;
  services: BookingService[];
  pricing: BookingPricing;
  scheduling: BookingScheduling;
  notes?: string;
}

export interface Booking {
  _id: string;
  bookingReference?: string; // Added booking reference field
  customer: CustomerInfo;
  services: BookingService[];
  pricing: BookingPricing;
  scheduling: BookingScheduling;
  status: 'pending' | 'waiting_for_engineer' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  payment: {
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    method: string;
    transactionId?: string;
    paidAt?: string;
  };
  vendor?: {
    vendorId: string | {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    assignedAt: string;
  };
  notes?: string;
  assignmentNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

class BookingApi {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Booking API request failed:', error);
      throw error;
    }
  }

  // Create a new booking
  async createBooking(bookingData: BookingData): Promise<ApiResponse<{ booking: Booking; bookingReference: string }>> {
    try {
      const response = await this.request<{ booking: Booking; bookingReference: string }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      return response;
    } catch (error) {
      console.error('Error creating booking:', error);
      return {
        success: false,
        message: 'Failed to create booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<ApiResponse<{ booking: Booking; bookingReference: string }>> {
    try {
      const response = await this.request<{ booking: Booking; bookingReference: string }>(`/bookings/${bookingId}`);
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

  // Get bookings by customer email
  async getBookingsByCustomer(email: string, page: number = 1, limit: number = 10): Promise<ApiResponse<{ bookings: Booking[]; pagination: any }>> {
    try {
      const response = await this.request<{ bookings: Booking[]; pagination: any }>(`/bookings/customer/${email}?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      return {
        success: false,
        message: 'Failed to fetch bookings',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId: string, status: string): Promise<ApiResponse<{ booking: Booking; bookingReference: string }>> {
    try {
      const response = await this.request<{ booking: Booking; bookingReference: string }>(`/bookings/${bookingId}/status`, {
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

  // Get booking statistics
  async getBookingStats(): Promise<ApiResponse<any>> {
    try {
      const response = await this.request<any>('/bookings/stats');
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

  // Create payment order for completed task
  async createPaymentOrder(paymentData: {
    bookingId: string;
    amount: number;
    currency: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.request<any>('/bookings/payment/create-order', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      return response;
    } catch (error) {
      console.error('Error creating payment order:', error);
      return {
        success: false,
        message: 'Failed to create payment order',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Verify payment and update booking status
  async verifyPayment(paymentData: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.request<any>('/bookings/payment/verify', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      return response;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        message: 'Failed to verify payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Create singleton instance
const bookingApi = new BookingApi();

export default bookingApi;
export type { BookingService, CustomerInfo, BookingPricing, BookingScheduling, BookingData, Booking, ApiResponse };
