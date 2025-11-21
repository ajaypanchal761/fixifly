interface Banner {
  _id: string;
  title: string;
  image: {
    public_id: string;
    url: string;
  };
  isActive: boolean;
  order: number;
  targetAudience: 'user' | 'vendor';
  createdAt: string;
  updatedAt: string;
}

interface BannerResponse {
  success: boolean;
  data: Banner[];
  message?: string;
}

class BannerApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }

  /**
   * Fetch all active banners for public use
   */
  async getActiveBanners(targetAudience?: 'user' | 'vendor'): Promise<BannerResponse> {
    let url = `${this.baseUrl}/banners`;
    if (targetAudience) {
      url += `?targetAudience=${targetAudience}`;
    }
    
    console.log('Banner API making request to:', url);
    console.log('Base URL:', this.baseUrl);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Banner API response status:', response.status);
      console.log('Banner API response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => {});
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: BannerResponse = await response.json();
      console.log('Banner API success response:', data);
      return data;
    } catch (error) {
      console.error('Banner API request failed:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('Network error - backend might be down or CORS issue');
        console.error('Backend URL:', url);
      }
      throw error;
    }
  }

  /**
   * Get banner image URLs for easy use in components
   */
  async getBannerImageUrls(targetAudience?: 'user' | 'vendor'): Promise<string[]> {
    try {
      const response = await this.getActiveBanners(targetAudience);
      if (response.success && response.data) {
        // Sort by order and return only image URLs
        return response.data
          .sort((a, b) => a.order - b.order)
          .map(banner => banner.image.url);
      }
      return [];
    } catch (error) {
      console.error('Error getting banner image URLs:', error);
      return [];
    }
  }
}

const bannerApiService = new BannerApiService();
export default bannerApiService;
export type { Banner, BannerResponse };
