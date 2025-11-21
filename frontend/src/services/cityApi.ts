interface City {
  _id: string;
  name: string;
  state: string;
  isActive: boolean;
  serviceCount: number;
  estimatedDeliveryTime: string;
  coverage: {
    pincodes: string[];
    areas: string[];
  };
  pricing: {
    baseServiceFee: number;
    travelFee: number;
    currency: string;
  };
  stats: {
    totalBookings: number;
    activeVendors: number;
    averageRating: number;
  };
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class CityApiService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  async getActiveCities(params?: {
    page?: number;
    limit?: number;
    search?: string;
    state?: string;
  }): Promise<ApiResponse<{ cities: City[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.state) queryParams.append('state', params.state);

    const response = await fetch(`${this.baseUrl}/cities?${queryParams}`);
    return response.json();
  }

  async getCityById(cityId: string): Promise<ApiResponse<{ city: City }>> {
    const response = await fetch(`${this.baseUrl}/cities/${cityId}`);
    return response.json();
  }

  async searchCities(query: string, params?: {
    state?: string;
    limit?: number;
  }): Promise<ApiResponse<{ cities: City[] }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (params?.state) queryParams.append('state', params.state);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}/cities/search?${queryParams}`);
    return response.json();
  }

  async getCitiesByState(state: string, limit?: number): Promise<ApiResponse<{ cities: City[] }>> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/cities/state/${state}?${queryParams}`);
    return response.json();
  }

  // ==================== ADMIN METHODS ====================

  async getAllCities(params?: {
    page?: number;
    limit?: number;
    search?: string;
    state?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<{ cities: City[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.state) queryParams.append('state', params.state);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseUrl}/admin/cities?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  async createCity(cityData: Partial<City>): Promise<ApiResponse<{ city: City }>> {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseUrl}/admin/cities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cityData)
    });
    return response.json();
  }

  async updateCity(cityId: string, cityData: Partial<City>): Promise<ApiResponse<{ city: City }>> {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseUrl}/admin/cities/${cityId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cityData)
    });
    return response.json();
  }

  async deleteCity(cityId: string): Promise<ApiResponse<{ message: string }>> {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseUrl}/admin/cities/${cityId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  async toggleCityStatus(cityId: string): Promise<ApiResponse<{ city: City }>> {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseUrl}/admin/cities/${cityId}/toggle-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  async getCityStats(): Promise<ApiResponse<{ stats: any }>> {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${this.baseUrl}/admin/cities/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
}

const cityApiService = new CityApiService();
export default cityApiService;
export type { City };
