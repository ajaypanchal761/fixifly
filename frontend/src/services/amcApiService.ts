import axios from 'axios';

// Normalize API base (ensure trailing /api exists exactly once)
const configuredBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
const API_BASE_URL = (() => {
  try {
    let base = configuredBase.trim();
    if (base.endsWith('/')) base = base.slice(0, -1);
    if (!/\/api$/i.test(base)) base = `${base}/api`;
    return base;
  } catch {
    return 'http://localhost:5000/api';
  }
})();
console.info('[amcApi] Using API base:', API_BASE_URL);

// Create axios instance with default config
const amcApi = axios.create({
  baseURL: `${API_BASE_URL}/amc`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
amcApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Basic token validation before making request
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          if (payload.exp && payload.exp < currentTime) {
            console.log('Token expired, removing from localStorage');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userData');
            return Promise.reject(new Error('Token expired'));
          }
        }
      } catch (error) {
        console.log('Invalid token format, removing from localStorage');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        return Promise.reject(new Error('Invalid token'));
      }

      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
amcApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only logout if it's a token-related error, not other 401 errors
      const errorMessage = error.response?.data?.message || '';

      if (errorMessage.includes('token') || errorMessage.includes('authorized') || errorMessage.includes('expired')) {
        console.log('Token expired or invalid, logging out user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
      } else {
        console.log('401 error but not token-related:', errorMessage);
        // Don't logout for other 401 errors
      }
    }
    return Promise.reject(error);
  }
);

// ==================== USER AMC API SERVICES ====================

// AMC Plans
export const getAMCPlans = async () => {
  try {
    const response = await amcApi.get('/plans');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch AMC plans');
  }
};

export const getAMCPlan = async (planId) => {
  try {
    const response = await amcApi.get(`/plans/${planId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch AMC plan');
  }
};

// AMC Subscriptions
export const getUserAMCSubscriptions = async (status = 'all') => {
  try {
    const response = await amcApi.get(`/subscriptions?status=${status}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch AMC subscriptions');
  }
};

export const getUserAMCSubscription = async (subscriptionId) => {
  try {
    const response = await amcApi.get(`/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch AMC subscription');
  }
};

export const createAMCSubscription = async (subscriptionData) => {
  try {
    console.log('Sending subscription data to API:', subscriptionData);
    const response = await amcApi.post('/subscriptions', subscriptionData);
    console.log('API response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);

    const errorMessage = error.response?.data?.message || error.message || 'Failed to create AMC subscription';
    throw new Error(errorMessage);
  }
};

export const verifyAMCSubscriptionPayment = async (subscriptionId, paymentData) => {
  try {
    console.log('Verifying payment for subscription:', subscriptionId, paymentData);
    const response = await amcApi.post(`/subscriptions/${subscriptionId}/verify-payment`, paymentData);
    console.log('Payment verification response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Payment verification error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);

    const errorMessage = error.response?.data?.message || error.message || 'Failed to verify payment';
    throw new Error(errorMessage);
  }
};

export const updateAMCSubscription = async (subscriptionId, updateData) => {
  try {
    const response = await amcApi.put(`/subscriptions/${subscriptionId}`, updateData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update AMC subscription');
  }
};

export const cancelAMCSubscription = async (subscriptionId, reason) => {
  try {
    const response = await amcApi.post(`/subscriptions/${subscriptionId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to cancel AMC subscription');
  }
};

export const renewAMCSubscription = async (subscriptionId, period = 365) => {
  try {
    const response = await amcApi.post(`/subscriptions/${subscriptionId}/renew`, { period });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to renew AMC subscription');
  }
};

// AMC Services
export const requestAMCService = async (subscriptionId, serviceData) => {
  try {
    const response = await amcApi.post(`/subscriptions/${subscriptionId}/services`, serviceData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to request AMC service');
  }
};

export const getAMCServiceHistory = async (subscriptionId) => {
  try {
    const response = await amcApi.get(`/subscriptions/${subscriptionId}/services`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch service history');
  }
};

// Usage Tracking
export const getAMCUsage = async (subscriptionId) => {
  try {
    const response = await amcApi.get(`/subscriptions/${subscriptionId}/usage`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch AMC usage');
  }
};

// ==================== ADMIN AMC API SERVICES ====================

// Create admin API instance
const adminAmcApi = axios.create({
  baseURL: `${API_BASE_URL}/amc/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for admin auth
adminAmcApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for admin error handling
adminAmcApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Admin token expired, redirect to admin login
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Admin AMC Plans Management
export const getAdminAMCPlans = async (params = {}) => {
  try {
    const response = await adminAmcApi.get('/plans', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch AMC plans');
  }
};

export const getAdminAMCPlan = async (planId) => {
  try {
    const response = await adminAmcApi.get(`/plans/${planId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch AMC plan');
  }
};

export const createAdminAMCPlan = async (planData) => {
  try {
    const response = await adminAmcApi.post('/plans', planData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create AMC plan');
  }
};

export const updateAdminAMCPlan = async (planId, planData) => {
  try {
    const response = await adminAmcApi.put(`/plans/${planId}`, planData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update AMC plan');
  }
};

export const deleteAdminAMCPlan = async (planId) => {
  try {
    const response = await adminAmcApi.delete(`/plans/${planId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete AMC plan');
  }
};

export const seedAdminAMCPlans = async () => {
  try {
    const response = await adminAmcApi.post('/seed-plans');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to seed AMC plans');
  }
};

// Admin AMC Subscriptions Management
export const getAdminAMCSubscriptions = async (params = {}) => {
  try {
    const response = await adminAmcApi.get('/subscriptions', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch AMC subscriptions');
  }
};

export const getAdminAMCSubscription = async (subscriptionId) => {
  try {
    const response = await adminAmcApi.get(`/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch AMC subscription');
  }
};

export const updateAdminAMCSubscriptionStatus = async (subscriptionId, status, reason) => {
  try {
    const response = await adminAmcApi.put(`/subscriptions/${subscriptionId}/status`, { status, reason });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update subscription status');
  }
};

export const addAdminAMCService = async (subscriptionId, serviceData) => {
  try {
    const response = await adminAmcApi.post(`/subscriptions/${subscriptionId}/services`, serviceData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add service to subscription');
  }
};

// Admin AMC Statistics
export const getAdminAMCStats = async (period = 'month') => {
  try {
    const response = await adminAmcApi.get('/stats', { params: { period } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch AMC statistics');
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Format AMC plan data for display
export const formatAMCPlan = (plan) => {
  return {
    ...plan,
    formattedPrice: `₹${plan.price}`,
    duration: plan.period === 'yearly' ? '1 Year' : '1 Month',
    features: plan.features || [],
    benefits: plan.benefits || {}
  };
};

// Format AMC subscription data for display
export const formatAMCSubscription = (subscription) => {
  return {
    ...subscription,
    formattedAmount: `₹${subscription.amount}`,
    daysRemaining: subscription.daysRemaining || 0,
    isExpired: subscription.isExpired || false,
    isActive: subscription.isActive || false,
    formattedStartDate: new Date(subscription.startDate).toLocaleDateString(),
    formattedEndDate: new Date(subscription.endDate).toLocaleDateString()
  };
};

// Calculate subscription status color
export const getSubscriptionStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'green';
    case 'expired':
      return 'red';
    case 'cancelled':
      return 'orange';
    case 'suspended':
      return 'yellow';
    default:
      return 'gray';
  }
};

// Calculate usage percentage
export const calculateUsagePercentage = (used, limit) => {
  if (limit === 'unlimited') return 0;
  if (limit === 0) return 0;
  return Math.round((used / limit) * 100);
};

// Get service type icon
export const getServiceTypeIcon = (serviceType) => {
  switch (serviceType) {
    case 'call_support':
      return 'phone';
    case 'remote_support':
      return 'monitor';
    case 'home_visit':
      return 'home';
    case 'repair':
      return 'wrench';
    case 'maintenance':
      return 'settings';
    default:
      return 'help-circle';
  }
};

// Get service type label
export const getServiceTypeLabel = (serviceType) => {
  switch (serviceType) {
    case 'call_support':
      return 'Call Support';
    case 'remote_support':
      return 'Remote Support';
    case 'home_visit':
      return 'Home Visit';
    case 'repair':
      return 'Repair Service';
    case 'maintenance':
      return 'Maintenance';
    default:
      return 'Service';
  }
};

export default {
  // User AMC Services
  getAMCPlans,
  getAMCPlan,
  getUserAMCSubscriptions,
  getUserAMCSubscription,
  createAMCSubscription,
  updateAMCSubscription,
  cancelAMCSubscription,
  renewAMCSubscription,
  requestAMCService,
  getAMCServiceHistory,
  getAMCUsage,

  // Admin AMC Services
  getAdminAMCPlans,
  getAdminAMCPlan,
  createAdminAMCPlan,
  updateAdminAMCPlan,
  deleteAdminAMCPlan,
  seedAdminAMCPlans,
  getAdminAMCSubscriptions,
  getAdminAMCSubscription,
  updateAdminAMCSubscriptionStatus,
  addAdminAMCService,
  getAdminAMCStats,

  // Utility Functions
  formatAMCPlan,
  formatAMCSubscription,
  getSubscriptionStatusColor,
  calculateUsagePercentage,
  getServiceTypeIcon,
  getServiceTypeLabel
};
