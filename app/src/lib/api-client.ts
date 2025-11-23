/**
 * Wisdom Pixels API Client
 *
 * Type-safe wrapper for REST API endpoints
 * Connects React frontend to Express.js backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Type definitions matching backend schemas
export interface Brand {
  id: string;
  name: string;
  domain: string;
  urlSlug: string;
  contentSources: string[];
  createdAt: Date;
}

export interface Persona {
  id: string;
  brandId: string;
  label: string;
  description: string;
  tags: string[];
  createdAt: Date;
}

export interface Environment {
  id: string;
  brandId: string;
  label: string;
  description: string;
  tags: string[];
  createdAt: Date;
}

export interface Card {
  cardId: string;
  brandId: string;
  personaId: string;
  environmentId: string;
  influencerId: string;
  query: string;
  response: string;
  imageUrl: string | null;
  imageBrief: string;
  status: 'draft' | 'published';
  viewCount: number;
  shareCount: number;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface Influencer {
  id: string;
  name: string;
  bio: string;
  domainExpertise: string;
  referenceImageUrl: string;
  enabled: boolean;
  createdAt: Date;
}

// Request/Response types
export interface CreateBrandRequest {
  name: string;
  domain: string;
  contentSources?: string[];
}

export interface CreateBrandResponse {
  brand: Brand;
  personaCount: number;
  environmentCount: number;
  message: string;
}

export interface GenerateCardsResponse {
  cardIds: string[];
  totalGenerated: number;
  totalSkipped: number;
  message: string;
}

export interface PublishCardsRequest {
  cardIds: string[];
}

export interface PublishCardsResponse {
  publishedCount: number;
  failedCount: number;
  invalidCount: number;
  publishedCardIds: string[];
  message: string;
}

export interface HealthResponse {
  status: string;
  timestamp: number;
}

// Error handling
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Helper function for API calls
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || 'API request failed',
        response.status,
        data.details
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

/**
 * Wisdom Pixels API Client
 */
export const apiClient = {
  // Health check
  health: async (): Promise<HealthResponse> => {
    return fetchAPI<HealthResponse>('/api/health');
  },

  // Brands
  brands: {
    /**
     * Create a new brand and run BrandOnboardingWorkflow
     */
    create: async (data: CreateBrandRequest): Promise<CreateBrandResponse> => {
      return fetchAPI<CreateBrandResponse>('/api/brands', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Get brand by ID
     */
    get: async (brandId: string): Promise<{ brand: Brand }> => {
      return fetchAPI<{ brand: Brand }>(`/api/brands/${brandId}`);
    },

    /**
     * Get personas for a brand
     */
    getPersonas: async (brandId: string): Promise<{ personas: Persona[] }> => {
      return fetchAPI<{ personas: Persona[] }>(`/api/brands/${brandId}/personas`);
    },

    /**
     * Get environments for a brand
     */
    getEnvironments: async (brandId: string): Promise<{ environments: Environment[] }> => {
      return fetchAPI<{ environments: Environment[] }>(`/api/brands/${brandId}/environments`);
    },

    /**
     * Get cards for a brand with optional filters
     */
    getCards: async (
      brandId: string,
      filters?: {
        status?: string;
        influencerId?: string;
        personaId?: string;
        environmentId?: string;
      }
    ): Promise<{ cards: Card[] }> => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.influencerId) params.append('influencerId', filters.influencerId);
      if (filters?.personaId) params.append('personaId', filters.personaId);
      if (filters?.environmentId) params.append('environmentId', filters.environmentId);

      const query = params.toString() ? `?${params.toString()}` : '';
      return fetchAPI<{ cards: Card[] }>(`/api/brands/${brandId}/cards${query}`);
    },

    /**
     * Generate cards for a brand (runs CardGenerationWorkflow)
     */
    generateCards: async (brandId: string): Promise<GenerateCardsResponse> => {
      return fetchAPI<GenerateCardsResponse>(`/api/brands/${brandId}/cards/generate`, {
        method: 'POST',
      });
    },
  },

  // Cards
  cards: {
    /**
     * Get card by ID
     */
    get: async (cardId: string): Promise<{ card: Card }> => {
      return fetchAPI<{ card: Card }>(`/api/cards/${cardId}`);
    },

    /**
     * Publish cards (runs PublishingWorkflow)
     */
    publish: async (data: PublishCardsRequest): Promise<PublishCardsResponse> => {
      return fetchAPI<PublishCardsResponse>('/api/cards/publish', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};

// Export the error class for error handling
export { APIError };

// Default export
export default apiClient;
