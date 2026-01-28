import axios from 'axios';
import { normalizeApiUrl } from '../utils/apiUrl';

const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

// Create axios instance with default config
const supportApiService = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
supportApiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
supportApiService.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - only redirect if not already on login page
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');

      // Only redirect if not already on login or register page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        // Just log the error, don't redirect to non-existent /login
        console.warn('Unauthorized access detected, but login page is disabled.');
      }
    }
    return Promise.reject(error);
  }
);

// Support Ticket API functions
export const supportTicketAPI = {
  // Create a new support ticket
  createTicket: async (ticketData) => {
    try {
      console.log('Creating support ticket with data:', ticketData);
      const response = await supportApiService.post('/support-tickets', ticketData);
      console.log('Ticket created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating ticket:', error);

      // Log detailed error information for debugging
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Error request:', {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          timeout: error.config?.timeout
        });
      } else {
        console.error('Error message:', error.message);
      }

      // Handle network errors (no response received)
      if (!error.response) {
        // Check if it's a timeout
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          throw new Error('Request timeout: The server took too long to respond. Please try again.');
        }
        // Check if it's a network error
        if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch') || error.request) {
          throw new Error('Network error: Unable to connect to server. Please check your internet connection and try again.');
        }
        throw new Error('Failed to connect to server. Please check your internet connection and try again.');
      }

      // Handle HTTP errors (response received but with error status)
      const { status, data } = error.response;

      // Extract error message from different possible locations
      let errorMessage = data?.message || data?.error || 'Failed to create support ticket';

      // Handle validation errors
      if (status === 400) {
        if (data?.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.join('. ');
        } else if (data?.message) {
          errorMessage = data.message;
        } else {
          errorMessage = 'Invalid request. Please check your input and try again.';
        }
      } else if (status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (status === 403) {
        errorMessage = 'You do not have permission to create support tickets.';
      } else if (status === 404) {
        errorMessage = 'Support ticket endpoint not found. Please contact support.';
      } else if (status === 422) {
        // Unprocessable Entity - validation errors
        errorMessage = data?.message || 'Validation error. Please check your input.';
      } else if (status === 500) {
        errorMessage = data?.message || 'Server error occurred. Please try again later.';
      } else if (status >= 400 && status < 500) {
        errorMessage = errorMessage || `Request failed (${status}). Please check your input.`;
      } else if (status >= 500) {
        errorMessage = errorMessage || `Server error (${status}). Please try again later.`;
      }

      throw new Error(errorMessage);
    }
  },

  // Get user's support tickets
  getUserTickets: async () => {
    try {
      console.log('Fetching user tickets...');
      const token = localStorage.getItem('accessToken');
      console.log('Token exists:', !!token);

      const response = await supportApiService.get('/support-tickets');
      console.log('Tickets response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Support tickets endpoint not found.');
      } else {
        throw new Error(error.response?.data?.message || 'Failed to fetch support tickets');
      }
    }
  },

  // Get single support ticket
  getTicket: async (ticketId) => {
    try {
      const response = await supportApiService.get(`/support-tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch support ticket');
    }
  },

  // Add response to support ticket
  addResponse: async (ticketId, message) => {
    try {
      const response = await supportApiService.post(`/support-tickets/${ticketId}/response`, {
        message
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add response');
    }
  }
};

// Admin Support Ticket API functions - Using admin authentication
export const adminSupportTicketAPI = {
  // Get all support tickets (Admin)
  getAllTickets: async (params = {}) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        // Redirect to admin login instead of user login
        window.location.href = '/admin/login';
        throw new Error('Admin not authenticated. Please login again.');
      }

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/support-tickets/admin/all?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        // If 401, redirect to admin login
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('adminData');
          window.location.href = '/admin/login';
        }
        throw new Error(data.message || 'Failed to fetch support tickets');
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch support tickets');
    }
  },

  // Get support ticket statistics (Admin)
  getStats: async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        window.location.href = '/admin/login';
        throw new Error('Admin not authenticated. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/support-tickets/admin/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('adminData');
          window.location.href = '/admin/login';
        }
        throw new Error(data.message || 'Failed to fetch support statistics');
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch support statistics');
    }
  },

  // Get single support ticket (Admin)
  getTicket: async (ticketId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin not authenticated. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/support-tickets/admin/${ticketId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch support ticket');
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch support ticket');
    }
  },

  // Update support ticket (Admin)
  updateTicket: async (ticketId, updateData) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin not authenticated. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/support-tickets/admin/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update support ticket');
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update support ticket');
    }
  },

  // Add admin response to support ticket
  addResponse: async (ticketId, message, isInternal = false) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin not authenticated. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/support-tickets/admin/${ticketId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ message, isInternal })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add response');
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to add response');
    }
  },

  // Resolve support ticket
  resolveTicket: async (ticketId, resolution) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin not authenticated. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/support-tickets/admin/${ticketId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ resolution })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resolve support ticket');
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to resolve support ticket');
    }
  },

  // Assign vendor to support ticket
  assignVendor: async (ticketId, vendorId, scheduledDate, scheduledTime, priority, notes) => {
    try {
      console.log('🔧 API DEBUG: Starting assignVendor API call...');
      console.log('🔧 API DEBUG: Parameters:', {
        ticketId,
        vendorId,
        scheduledDate,
        scheduledTime,
        priority,
        notes
      });

      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        console.error('❌ API DEBUG: No admin token found');
        throw new Error('Admin not authenticated. Please login again.');
      }

      console.log('🔧 API DEBUG: Admin token found:', adminToken.substring(0, 20) + '...');

      const requestBody: any = { vendorId };
      if (scheduledDate) requestBody.scheduledDate = scheduledDate;
      if (scheduledTime) requestBody.scheduledTime = scheduledTime;
      if (priority) requestBody.priority = priority;
      if (notes) requestBody.notes = notes;

      console.log('🔧 API DEBUG: Request body:', requestBody);
      console.log('🔧 API DEBUG: API Base URL:', API_BASE_URL);
      console.log('🔧 API DEBUG: Full URL:', `${API_BASE_URL}/support-tickets/admin/${ticketId}/assign-vendor`);

      const response = await fetch(`${API_BASE_URL}/support-tickets/admin/${ticketId}/assign-vendor`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🔧 API DEBUG: Response status:', response.status);
      console.log('🔧 API DEBUG: Response ok:', response.ok);

      const data = await response.json();
      console.log('🔧 API DEBUG: Response data:', data);

      if (!response.ok) {
        console.error('❌ API DEBUG: Request failed with status:', response.status);
        console.error('❌ API DEBUG: Error data:', data);
        throw new Error(data.message || 'Failed to assign vendor to support ticket');
      }

      console.log('✅ API DEBUG: Request successful');
      return data;
    } catch (error) {
      console.error('❌ API DEBUG: Error in assignVendor:', error);
      throw new Error(error.message || 'Failed to assign vendor to support ticket');
    }
  }
};

export default supportApiService;
