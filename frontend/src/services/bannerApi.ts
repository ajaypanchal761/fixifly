interface Banner {
  _id: string;
  title: string;
  image: {
    public_id: string;
    url: string;
  };
  isActive: boolean;
  order: number;
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
  async getActiveBanners(): Promise<BannerResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/banners`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BannerResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching active banners:', error);
      throw error;
    }
  }

  /**
   * Get banner image URLs for easy use in components
   */
  async getBannerImageUrls(): Promise<string[]> {
    try {
      const response = await this.getActiveBanners();
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
