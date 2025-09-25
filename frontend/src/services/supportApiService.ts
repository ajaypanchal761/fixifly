import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
        // Add a small delay to allow the error to be handled by the component first
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
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
      const response = await supportApiService.post('/support-tickets', ticketData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create support ticket');
    }
  },

  // Get user's support tickets
  getUserTickets: async () => {
    try {
      const response = await supportApiService.get('/support-tickets');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch support tickets');
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
  }
};

export default supportApiService;
