import axios from 'axios';
import { getApiBaseUrl } from '@/utils/apiUrl';

// Use normalized API base URL so it works correctly on live (no localhost fallback)
const API_BASE_URL = getApiBaseUrl();

// Debug API URL
console.log('🔗 ReviewService API_BASE_URL:', API_BASE_URL);

// Types
export interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  category: string;
  rating: number;
  comment: string;
  likes: number;
  likedBy: string[];
  isAnonymous: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  userDisplayName: string;
  userInitials: string;
  formattedDate: string;
  ratingText: string;
  adminResponse?: {
    message: string;
    respondedBy: string;
    respondedAt: string;
  };
}

export interface CreateReviewData {
  category: string;
  rating: number;
  comment: string;
  cardId?: string;
  vendorId?: string;
  bookingId?: string;
  isAnonymous?: boolean;
}

export interface ReviewFilters {
  category?: string;
  rating?: number;
  featured?: boolean;
  limit?: number;
  skip?: number;
  sort?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_liked';
}

export interface ReviewStats {
  overview: {
    totalReviews: number;
    approvedReviews: number;
    averageRating: number;
    featuredReviews: number;
    totalLikes: number;
  };
  categories: Array<{
    _id: string;
    count: number;
    averageRating: number;
    totalLikes: number;
  }>;
}

// API functions
export const reviewService = {
  // Get all reviews with filters
  getReviews: async (filters: ReviewFilters = {}): Promise<{ success: boolean; data: Review[]; count: number; total: number }> => {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.rating) params.append('rating', filters.rating.toString());
    if (filters.featured) params.append('featured', 'true');
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.sort) params.append('sort', filters.sort);

    const response = await axios.get(`${API_BASE_URL}/reviews?${params.toString()}`);
    return response.data;
  },

  // Get featured reviews
  getFeaturedReviews: async (limit: number = 5): Promise<{ success: boolean; data: Review[]; count: number }> => {
    const response = await axios.get(`${API_BASE_URL}/reviews/featured?limit=${limit}`);
    return response.data;
  },

  // Get reviews by category
  getReviewsByCategory: async (category: string, limit: number = 10): Promise<{ success: boolean; data: Review[]; count: number }> => {
    const response = await axios.get(`${API_BASE_URL}/reviews/category/${category}?limit=${limit}`);
    return response.data;
  },

  // Get user's reviews
  getUserReviews: async (userId: string, limit: number = 10): Promise<{ success: boolean; data: Review[]; count: number }> => {
    const response = await axios.get(`${API_BASE_URL}/reviews/user/${userId}?limit=${limit}`);
    return response.data;
  },

  // Get single review
  getReview: async (reviewId: string): Promise<{ success: boolean; data: Review }> => {
    const response = await axios.get(`${API_BASE_URL}/reviews/${reviewId}`);
    return response.data;
  },

  // Create new review
  createReview: async (reviewData: CreateReviewData, token: string): Promise<{ success: boolean; data: Review; message: string }> => {
    console.log('=== REVIEW SERVICE DEBUG ===');
    console.log('Creating review with data:', reviewData);
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Full URL:', `${API_BASE_URL}/reviews`);
    console.log('Token present:', !!token);
    console.log('Token value:', token);
    console.log('Token type:', typeof token);
    console.log('Authorization header:', `Bearer ${token}`);
    
    const response = await axios.post(`${API_BASE_URL}/reviews`, reviewData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  // Update review
  updateReview: async (reviewId: string, reviewData: Partial<CreateReviewData>, token: string): Promise<{ success: boolean; data: Review; message: string }> => {
    const response = await axios.put(`${API_BASE_URL}/reviews/${reviewId}`, reviewData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  // Delete review
  deleteReview: async (reviewId: string, token: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Like/Unlike review
  toggleLikeReview: async (reviewId: string, token: string): Promise<{ success: boolean; data: { likes: number; isLiked: boolean }; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/reviews/${reviewId}/like`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Get vendor reviews
  getVendorReviews: async (vendorId: string, limit: number = 10): Promise<{ success: boolean; data: Review[]; count: number }> => {
    console.log('🔍 Fetching vendor reviews for:', vendorId, 'URL:', `${API_BASE_URL}/reviews/vendor/${vendorId}?limit=${limit}`);
    try {
      const response = await axios.get(`${API_BASE_URL}/reviews/vendor/${vendorId}?limit=${limit}`);
      console.log('✅ Vendor reviews response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vendor reviews:', error);
      throw error;
    }
  },

  // Get vendor rating statistics
  getVendorRatingStats: async (vendorId: string): Promise<{ success: boolean; data: { totalReviews: number; averageRating: number; ratingDistribution: { [key: number]: number } } }> => {
    console.log('📊 Fetching vendor rating stats for:', vendorId, 'URL:', `${API_BASE_URL}/reviews/vendor/${vendorId}/stats`);
    try {
      const response = await axios.get(`${API_BASE_URL}/reviews/vendor/${vendorId}/stats`);
      console.log('✅ Vendor rating stats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vendor rating stats:', error);
      throw error;
    }
  },

  // Get review statistics
  getReviewStats: async (): Promise<{ success: boolean; data: ReviewStats }> => {
    const response = await axios.get(`${API_BASE_URL}/reviews/stats/overview`);
    return response.data;
  }
};

export default reviewService;
