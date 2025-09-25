// Public Product API service for product search and suggestions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ProductSuggestion {
  _id: string;
  name: string;
  category: string;
  primaryImage?: string;
  slug?: string;
}

export interface PublicProduct {
  _id: string;
  productName: string;
  productImage?: string;
  serviceType: string;
  categories: {
    A: Array<{
      serviceName: string;
      description?: string;
      price: number;
      discountPrice?: number;
      isActive: boolean;
    }>;
    B: Array<{
      serviceName: string;
      description?: string;
      price: number;
      discountPrice?: number;
      isActive: boolean;
    }>;
    C: Array<{
      serviceName: string;
      description?: string;
      price: number;
      discountPrice?: number;
      isActive: boolean;
    }>;
    D: Array<{
      serviceName: string;
      description?: string;
      price: number;
      discountPrice?: number;
      isActive: boolean;
    }>;
  };
  categoryNames: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  // Legacy fields for backward compatibility
  name?: string;
  category?: string;
  primaryImage?: string;
  slug?: string;
  description?: string;
  price?: number;
  rating?: number;
  reviews?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

class PublicProductApi {
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
      console.error('Product API request failed:', error);
      throw error;
    }
  }

  // Get product suggestions based on search query
  async getSuggestions(query: string, limit: number = 8): Promise<ApiResponse<{ suggestions: ProductSuggestion[] }>> {
    try {
      // Since there's no products API in the backend, return empty suggestions
      // This prevents the app from crashing while maintaining the component structure
      return {
        success: true,
        message: 'No products available',
        data: {
          suggestions: []
        }
      };
    } catch (error) {
      console.error('Error fetching product suggestions:', error);
      return {
        success: false,
        message: 'Failed to fetch suggestions',
        data: {
          suggestions: []
        }
      };
    }
  }

  // Get product details by ID
  async getProductById(id: string): Promise<ApiResponse<ProductSuggestion>> {
    try {
      // Placeholder implementation
      return {
        success: false,
        message: 'Product not found',
        data: undefined
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  // Get featured products for hero section
  async getFeaturedProducts(): Promise<ApiResponse<{ products: PublicProduct[] }>> {
    try {
      const response = await this.request<{ products: PublicProduct[] }>('/public/products/featured');
      return response;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return {
        success: false,
        message: 'Failed to fetch featured products',
        data: {
          products: []
        }
      };
    }
  }

  // Get all active products
  async getAllActiveProducts(): Promise<ApiResponse<{ products: PublicProduct[] }>> {
    try {
      const response = await this.request<{ products: PublicProduct[] }>('/public/products/all');
      return response;
    } catch (error) {
      console.error('Error fetching all active products:', error);
      return {
        success: false,
        message: 'Failed to fetch all active products',
        data: {
          products: []
        }
      };
    }
  }

  // Get single product by ID
  async getProductById(productId: string): Promise<ApiResponse<{ product: PublicProduct }>> {
    try {
      const response = await this.request<{ product: PublicProduct }>(`/public/products/${productId}`);
      return response;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return {
        success: false,
        message: 'Failed to fetch product',
        data: {
          product: undefined
        }
      };
    }
  }

  // Get products with filters
  async getProducts(filters: { category?: string; limit?: number; featured?: boolean } = {}): Promise<ApiResponse<{ products: PublicProduct[] }>> {
    try {
      // If requesting featured products, use the dedicated endpoint
      if (filters.featured) {
        return await this.getFeaturedProducts();
      }
      
      // For now, return empty products for other filters
      // This can be extended when more public product endpoints are added
      return {
        success: true,
        message: 'No products available',
        data: {
          products: []
        }
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        message: 'Failed to fetch products',
        data: {
          products: []
        }
      };
    }
  }

  // Search products
  async searchProducts(query: string, page: number = 1, limit: number = 20): Promise<ApiResponse<{ products: ProductSuggestion[]; pagination: any }>> {
    try {
      // Placeholder implementation
      return {
        success: true,
        message: 'No products available',
        data: {
          products: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        }
      };
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
}

// Create singleton instance
const publicProductApi = new PublicProductApi();

export default publicProductApi;
export type { ProductSuggestion, PublicProduct, ApiResponse };
