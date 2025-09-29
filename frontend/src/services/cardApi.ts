const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Card {
  _id: string;
  name: string;
  speciality: string;
  subtitle: string;
  price?: number;
  priceDisplay?: string;
  image: string;
  status: 'active' | 'inactive' | 'pending';
  isPopular: boolean;
  isFeatured: boolean;
  rating?: number;
  totalReviews?: number;
  completedJobs: number;
  totalJobs: number;
  location?: {
    city?: string;
    state?: string;
    pincode?: string;
  };
  serviceDetails?: {
    description?: string;
    experience?: string;
    certifications?: string[];
    languages?: string[];
  };
  availability?: {
    isAvailable: boolean;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: string[];
  };
  tags: string[];
  displayOrder: number;
  stats: {
    views: number;
    clicks: number;
    bookings: number;
    lastViewedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CardsResponse {
  success: boolean;
  data: {
    cards: Card[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCards: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface CardResponse {
  success: boolean;
  data: {
    card: Card;
  };
}

class CardApiService {
  async getCards(params?: {
    page?: number;
    limit?: number;
    search?: string;
    speciality?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<CardsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`${API_BASE_URL}/cards?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch cards');
      }

      return data;
    } catch (error: any) {
      console.error('Get cards error:', error);
      throw new Error(error.message || 'Failed to fetch cards');
    }
  }

  async getCard(cardId: string): Promise<CardResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch card');
      }

      return data;
    } catch (error: any) {
      console.error('Get card error:', error);
      throw new Error(error.message || 'Failed to fetch card');
    }
  }

  async getPopularCards(limit: number = 10): Promise<{ success: boolean; data: { cards: Card[] } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/popular?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch popular cards');
      }

      return data;
    } catch (error: any) {
      console.error('Get popular cards error:', error);
      throw new Error(error.message || 'Failed to fetch popular cards');
    }
  }

  async getFeaturedCards(limit: number = 10): Promise<{ success: boolean; data: { cards: Card[] } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/featured?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch featured cards');
      }

      return data;
    } catch (error: any) {
      console.error('Get featured cards error:', error);
      throw new Error(error.message || 'Failed to fetch featured cards');
    }
  }

  async getCardsBySpeciality(speciality: string, limit: number = 10): Promise<{ success: boolean; data: { cards: Card[] } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/speciality/${encodeURIComponent(speciality)}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch cards by speciality');
      }

      return data;
    } catch (error: any) {
      console.error('Get cards by speciality error:', error);
      throw new Error(error.message || 'Failed to fetch cards by speciality');
    }
  }

  async searchCards(params: {
    q?: string;
    speciality?: string;
    city?: string;
    limit?: number;
  }): Promise<{ success: boolean; data: { cards: Card[] } }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/cards/search?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search cards');
      }

      return data;
    } catch (error: any) {
      console.error('Search cards error:', error);
      throw new Error(error.message || 'Failed to search cards');
    }
  }

  async incrementCardClicks(cardId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/${cardId}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record click');
      }

      return data;
    } catch (error: any) {
      console.error('Increment card clicks error:', error);
      throw new Error(error.message || 'Failed to record click');
    }
  }

  async getSpecialities(): Promise<{ success: boolean; data: { specialities: string[] } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/specialities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch specialities');
      }

      return data;
    } catch (error: any) {
      console.error('Get specialities error:', error);
      throw new Error(error.message || 'Failed to fetch specialities');
    }
  }
}

const cardApiService = new CardApiService();
export default cardApiService;
export type { Card, CardsResponse, CardResponse };
