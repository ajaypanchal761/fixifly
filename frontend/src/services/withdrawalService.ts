// Withdrawal service for vendor withdrawal requests
import { normalizeApiUrl } from '../utils/apiUrl';

const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

interface WithdrawalRequest {
  _id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  amount: number;
  status: 'pending' | 'approved' | 'declined' | 'processed';
  processedBy?: string;
  processedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateWithdrawalRequest {
  amount: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

class WithdrawalService {
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
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log('Making withdrawal API request to:', url);
      console.log('Request config:', config);
      
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
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
    } catch (error) {
      console.error('Withdrawal API request failed:', error);
      throw error;
    }
  }

  /**
   * Create a new withdrawal request
   */
  async createWithdrawalRequest(amount: number): Promise<ApiResponse<{
    requestId: string;
    amount: number;
    status: string;
    submittedAt: string;
  }>> {
    return this.request('/vendors/withdrawal', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  /**
   * Get vendor's withdrawal requests
   */
  async getVendorWithdrawalRequests(): Promise<ApiResponse<WithdrawalRequest[]>> {
    return this.request('/vendors/withdrawal', {
      method: 'GET',
    });
  }

  /**
   * Get withdrawal request by ID
   */
  async getWithdrawalRequest(requestId: string): Promise<ApiResponse<WithdrawalRequest>> {
    return this.request(`/vendors/withdrawal/${requestId}`, {
      method: 'GET',
    });
  }
}

// Create singleton instance
const withdrawalService = new WithdrawalService();

export default withdrawalService;
export type { WithdrawalRequest, CreateWithdrawalRequest, ApiResponse };
