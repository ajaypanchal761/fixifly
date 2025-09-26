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
      if (!query || query.trim().length < 2) {
        return {
          success: true,
          message: 'Query too short',
          data: {
            suggestions: []
          }
        };
      }

      // Get all products and filter by search query
      const response = await this.getAllActiveProducts();
      
      if (!response.success || !response.data?.products) {
        return {
          success: true,
          message: 'No products available',
          data: {
            suggestions: []
          }
        };
      }

      // Filter products based on search query
      const filteredProducts = response.data.products.filter(product => {
        const searchTerm = query.toLowerCase();
        const productName = (product.name || product.productName || '').toLowerCase();
        const categoryName = (product.category?.name || product.serviceType || '').toLowerCase();
        
        return productName.includes(searchTerm) || categoryName.includes(searchTerm);
      });

      // Take only the first 'limit' products for suggestions
      const limitedProducts = filteredProducts.slice(0, limit);

      // Convert to ProductSuggestion format
      const suggestions: ProductSuggestion[] = limitedProducts.map(product => ({
        _id: product._id,
        name: product.name || product.productName || 'Unknown Product',
        category: product.category?.name || product.serviceType || 'General',
        primaryImage: product.primaryImage || product.productImage,
        slug: product.slug || product._id
      }));

      return {
        success: true,
        message: 'Suggestions found',
        data: {
          suggestions
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
  async getProducts(filters: { category?: string; serviceType?: string; limit?: number; featured?: boolean; search?: string; page?: number } = {}): Promise<ApiResponse<{ products: PublicProduct[]; pagination?: any }>> {
    try {
      // If requesting featured products, use the dedicated endpoint
      if (filters.featured) {
        return await this.getFeaturedProducts();
      }
      
      // If requesting by service type, use the service type endpoint
      if (filters.serviceType) {
        const response = await this.request<{ products: PublicProduct[] }>(`/public/products/service-type/${filters.serviceType}?limit=${filters.limit || 6}`);
        return response;
      }
      
      // If search is provided, use search functionality
      if (filters.search) {
        const searchResponse = await this.searchProducts(filters.search, filters.page || 1, filters.limit || 12);
        return {
          success: searchResponse.success,
          message: searchResponse.message,
          data: {
            products: searchResponse.data.products.map(suggestion => ({
              _id: suggestion._id,
              name: suggestion.name,
              productName: suggestion.name,
              category: { name: suggestion.category },
              serviceType: suggestion.category,
              primaryImage: suggestion.primaryImage,
              productImage: suggestion.primaryImage,
              slug: suggestion.slug
            } as PublicProduct)),
            pagination: searchResponse.data.pagination
          }
        };
      }
      
      // For other filters, get all products and apply filters
      const response = await this.getAllActiveProducts();
      
      if (!response.success || !response.data?.products) {
        return {
          success: true,
          message: 'No products available',
          data: {
            products: []
          }
        };
      }

      let filteredProducts = response.data.products;

      // Apply category filter
      if (filters.category) {
        filteredProducts = filteredProducts.filter(product => 
          (product.category?.name || product.serviceType || '').toLowerCase().includes(filters.category!.toLowerCase())
        );
      }

      // Apply limit
      if (filters.limit) {
        filteredProducts = filteredProducts.slice(0, filters.limit);
      }

      return {
        success: true,
        message: 'Products found',
        data: {
          products: filteredProducts
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
      // Get all products and filter by search query
      const response = await this.getAllActiveProducts();
      
      if (!response.success || !response.data?.products) {
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
      }

      // Filter products based on search query
      const filteredProducts = response.data.products.filter(product => {
        const searchTerm = query.toLowerCase();
        const productName = (product.name || product.productName || '').toLowerCase();
        const categoryName = (product.category?.name || product.serviceType || '').toLowerCase();
        
        return productName.includes(searchTerm) || categoryName.includes(searchTerm);
      });

      // Calculate pagination
      const total = filteredProducts.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      // Convert to ProductSuggestion format
      const suggestions: ProductSuggestion[] = paginatedProducts.map(product => ({
        _id: product._id,
        name: product.name || product.productName || 'Unknown Product',
        category: product.category?.name || product.serviceType || 'General',
        primaryImage: product.primaryImage || product.productImage,
        slug: product.slug || product._id
      }));

      return {
        success: true,
        message: 'Products found',
        data: {
          products: suggestions,
          pagination: {
            currentPage: page,
            totalPages,
            totalProducts: total,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return {
        success: false,
        message: 'Failed to search products',
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
    }
  }
}

// Create singleton instance
const publicProductApi = new PublicProductApi();

export default publicProductApi;
export type { ProductSuggestion, PublicProduct, ApiResponse };
