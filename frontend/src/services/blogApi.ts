import apiService from './api';
import adminApiService from './adminApi';

// Admin API service for admin-specific blog operations
class AdminBlogApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Check if admin is authenticated before making request
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!token || !adminData) {
      throw new Error('Admin not authenticated. Please login as admin first.');
    }
    
    try {
      // Use the enhanced request method from adminApiService for automatic token refresh
      const response = await adminApiService.makeAuthenticatedRequest(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Admin API request failed:', error);
      throw error;
    }
  }

  // Get all blogs for admin
  async getAdminBlogs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
    sort?: string;
  }): Promise<BlogResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/admin/blogs${queryString ? `?${queryString}` : ''}`;
    
    return await this.request(endpoint, { method: 'GET' });
  }

  // Get single blog for admin
  async getAdminBlog(id: string): Promise<SingleBlogResponse> {
    return await this.request(`/admin/blogs/${id}`, { method: 'GET' });
  }

  // Create new blog
  async createBlog(blogData: {
    title: string;
    content: string;
    category: string;
  }): Promise<SingleBlogResponse> {
    return await this.request('/admin/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData)
    });
  }

  // Update blog
  async updateBlog(id: string, blogData: {
    title?: string;
    content?: string;
    category?: string;
    status?: string;
  }): Promise<SingleBlogResponse> {
    return await this.request(`/admin/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blogData)
    });
  }

  // Upload blog featured image
  async uploadBlogImage(id: string, imageFile: File): Promise<{
    success: boolean;
    message: string;
    data: {
      featuredImage: string;
      imageUrl: string;
      publicId: string;
    };
  }> {
    const formData = new FormData();
    formData.append('featuredImage', imageFile);

    const token = localStorage.getItem('adminToken');
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${API_BASE_URL}/admin/blogs/${id}/image`;
    
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

  // Toggle blog status
  async toggleBlogStatus(id: string, status: string): Promise<{
    success: boolean;
    message: string;
    data: {
      status: string;
      publishedAt?: string;
    };
  }> {
    return await this.request(`/admin/blogs/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Delete blog
  async deleteBlog(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return await this.request(`/admin/blogs/${id}`, { method: 'DELETE' });
  }

  // Get blog statistics
  async getBlogStats(): Promise<{
    success: boolean;
    data: {
      stats: {
        totalBlogs: number;
        publishedBlogs: number;
        draftBlogs: number;
        totalViews: number;
        totalLikes: number;
        averageRating: number;
      };
    };
  }> {
    return await this.request('/admin/blogs/stats', { method: 'GET' });
  }
}

// Create singleton instance
const adminBlogApiService = new AdminBlogApiService();

// Blog interface
export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    id: string;
    name: string;
    email?: string;
  };
  featuredImage: string;
  category: string;
  tags: string[];
  readTime: string;
  publishedAt: string;
  formattedDate: string;
  views: number;
  likes: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogResponse {
  success: boolean;
  data: {
    blogs: Blog[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SingleBlogResponse {
  success: boolean;
  data: {
    blog: Blog;
    relatedBlogs?: Blog[];
  };
}

export interface BlogCategoriesResponse {
  success: boolean;
  data: {
    categories: Array<{
      name: string;
      count: number;
    }>;
  };
}

// Public blog API functions
export const blogApi = {
  // Get all published blogs
  getBlogs: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    featured?: boolean;
    sort?: string;
  }): Promise<BlogResponse> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/blogs${queryString ? `?${queryString}` : ''}`;
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET' });
    return await response.json() as BlogResponse;
  },

  // Get single blog by slug
  getBlogBySlug: async (slug: string): Promise<SingleBlogResponse> => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/blogs/${slug}`, { method: 'GET' });
    return await response.json() as SingleBlogResponse;
  },

  // Get featured blogs
  getFeaturedBlogs: async (limit?: number): Promise<BlogResponse> => {
    const endpoint = limit ? `/blogs/featured?limit=${limit}` : '/blogs/featured';
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET' });
    return await response.json() as BlogResponse;
  },

  // Get recent blogs
  getRecentBlogs: async (limit?: number): Promise<BlogResponse> => {
    const endpoint = limit ? `/blogs/recent?limit=${limit}` : '/blogs/recent';
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET' });
    return await response.json() as BlogResponse;
  },

  // Get popular blogs
  getPopularBlogs: async (limit?: number): Promise<BlogResponse> => {
    const endpoint = limit ? `/blogs/popular?limit=${limit}` : '/blogs/popular';
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET' });
    return await response.json() as BlogResponse;
  },

  // Get blog categories
  getBlogCategories: async (): Promise<BlogCategoriesResponse> => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/blogs/categories`, { method: 'GET' });
    return await response.json() as BlogCategoriesResponse;
  },

  // Like a blog
  likeBlog: async (id: string): Promise<{ success: boolean; data: { likes: number }; message: string }> => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/blogs/${id}/like`, { method: 'POST' });
    return await response.json();
  },

  // Unlike a blog
  unlikeBlog: async (id: string): Promise<{ success: boolean; data: { likes: number; hasLiked: boolean }; message: string }> => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/blogs/${id}/unlike`, { method: 'POST' });
    return await response.json();
  },

  // Check if user has liked a blog
  getLikeStatus: async (id: string): Promise<{ success: boolean; data: { hasLiked: boolean; likes: number } }> => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/blogs/${id}/like-status`, { method: 'GET' });
    return await response.json();
  }
};

// Admin blog API functions - using the dedicated admin service
export const adminBlogApi = {
  // Get all blogs for admin
  getAdminBlogs: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
    sort?: string;
  }) => adminBlogApiService.getAdminBlogs(params),

  // Get single blog for admin
  getAdminBlog: (id: string) => adminBlogApiService.getAdminBlog(id),

  // Create new blog
  createBlog: (blogData: {
    title: string;
    content: string;
    category: string;
  }) => adminBlogApiService.createBlog(blogData),

  // Update blog
  updateBlog: (id: string, blogData: {
    title?: string;
    content?: string;
    category?: string;
    status?: string;
  }) => adminBlogApiService.updateBlog(id, blogData),

  // Upload blog featured image
  uploadBlogImage: (id: string, imageFile: File) => adminBlogApiService.uploadBlogImage(id, imageFile),

  // Toggle blog status
  toggleBlogStatus: (id: string, status: string) => adminBlogApiService.toggleBlogStatus(id, status),

  // Delete blog
  deleteBlog: (id: string) => adminBlogApiService.deleteBlog(id),

  // Get blog statistics
  getBlogStats: () => adminBlogApiService.getBlogStats()
};

export default blogApi;
