const BASE_URL = (() => {
  const envBase = import.meta.env.VITE_API_URL?.trim();
  const hasWindow = typeof window !== 'undefined';
  const looksLocal = envBase && (envBase.includes('127.0.0.1') || envBase.includes('localhost'));
  const origin = hasWindow ? window.location.origin : undefined;

  // In production, if the env accidentally points to localhost, prefer same-origin so Pages/Workers work.
  if (looksLocal && origin) {
    return origin;
  }

  if (envBase) return envBase;
  if (origin) return origin;
  return 'http://localhost:3001';
})();

const USE_SEED = (() => {
  const flag = import.meta.env.VITE_USE_SEED === '1';
  const hasWindow = typeof window !== 'undefined';
  const isLocalOrigin = hasWindow && /^(https?:\/\/localhost|https?:\/\/127\.0\.0\.1)/i.test(window.location.origin);
  // Disable seed mode automatically when not running on localhost to avoid shipping seed data to production.
  if (!isLocalOrigin) return false;
  return flag;
})();

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(path: string, method: HttpMethod = 'GET', body?: any): Promise<T> {
  if (USE_SEED) {
    throw new Error('__SEED_MODE__');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${path} failed: ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json() as Promise<T>;
}

export type BrandInput = { name: string; domain: string; contentSources: string[] };
export type Brand = {
  brandId: string;
  name: string;
  domain: string;
  description?: string | null;
  productImages?: string[];
  urlSlug: string;
  contentSources: string[];
};

export type Persona = {
  personaId: string;
  brandId: string;
  label: string;
  description: string;
  tags: string[];
};

export type Environment = {
  environmentId: string;
  brandId: string;
  label: string;
  description: string;
  tags: string[];
};

export type Influencer = {
  influencerId: string;
  name: string;
  bio: string;
  domain: string;
  imageUrl: string;
  actionImageUrls?: string[];
  enabled: boolean;
  status?: string;
  errorMessage?: string | null;
};

export type Card = {
  cardId: string;
  brandId: string;
  influencerId: string;
  personaId?: string | null;
  environmentId?: string | null;
  query: string;
  response: string;
  imageUrl: string;
  imageBrief: string;
  status: 'draft' | 'published' | string;
};

export type WorkflowRunResponse = {
  cardIds?: string[];
  totalGenerated?: number;
  totalSkipped?: number;
  message?: string;
  runId?: string;
};

export const apiClient = {
  health: () => request<{ status: string }>('/api/health'),

  createBrand: (data: BrandInput) =>
    request<{ brand: Brand }>('/api/brands', 'POST', data),

  listBrands: () => request<{ brands: Brand[] }>('/api/brands'),

  getBrandBySlug: (slug: string) => request<{ brand: Brand }>(`/api/brands/slug/${slug}`),

  getBrand: (brandId: string) =>
    request<{ brand: Brand }>(`/api/brands/${brandId}`),

  getPersonas: (brandId: string) =>
    request<{ personas: Persona[] }>(`/api/brands/${brandId}/personas`),

  getEnvironments: (brandId: string) =>
    request<{ environments: Environment[] }>(`/api/brands/${brandId}/environments`),

  getCards: (brandId: string) =>
    request<{ cards: Card[] }>(`/api/brands/${brandId}/cards`),

  getCard: (cardId: string) => request<{ card: Card }>(`/api/cards/${cardId}`),

  getInfluencers: () => request<{ influencers: Influencer[] }>(`/api/influencers`),
  getInfluencerGallery: (influencerId: string) => request<{ headshot: string; actionImages: string[] }>(`/api/influencers/${influencerId}/gallery`),

  updateInfluencerEnabled: (influencerId: string, enabled: boolean) =>
    request<{ influencer: Influencer }>(`/api/influencers/${influencerId}/enabled`, 'PATCH', { enabled }),

  findNewInfluencers: (payload?: { name?: string; bio?: string; domain?: string; brief?: string }) =>
    request<{ influencer: Influencer; status: string }>(`/api/influencers/find-new`, 'POST', payload || {}),
  getInfluencerStatus: (influencerId: string) => request<{ influencer: Influencer }>(`/api/influencers/${influencerId}/status`),
  generateInfluencerHeadshot: (influencerId: string) =>
    request<{ headshot: string; influencer: Influencer }>(`/api/influencers/${influencerId}/generate/headshot`, 'POST', {}),
  generateInfluencerActions: (influencerId: string) =>
    request<{ actionImages: string[]; influencer: Influencer }>(`/api/influencers/${influencerId}/generate/actions`, 'POST', {}),
  deleteInfluencer: (influencerId: string) => request<{}>(`/api/influencers/${influencerId}`, 'DELETE'),

  generateCards: (brandId: string) =>
    request<WorkflowRunResponse>(`/api/brands/${brandId}/cards/generate`, 'POST', {}),

  getWorkflowRun: (runId: string) =>
    request<{ run: any }>(`/api/workflow-runs/${runId}`),

  publishCards: (cardIds: string[]) =>
    request<{ publishedCardIds: string[] }>(`/api/cards/publish`, 'POST', { cardIds }),

  deleteCards: (cardIds: string[]) =>
    request<{ deleted: number }>(`/api/cards/delete`, 'POST', { cardIds }),

  unpublishCards: (cardIds: string[]) =>
    request<{ updated: number }>(`/api/cards/unpublish`, 'POST', { cardIds }),

  generateContent: (prompt: string) =>
    request<{ text: string }>(`/api/content/generate`, 'POST', { prompt }),

  generateImage: (prompt: string) =>
    request<{ url: string }>(`/api/images/generate`, 'POST', { prompt }),

  addProductImage: (brandId: string, imageUrl: string) =>
    request<{ brand: Brand }>(`/api/brands/${brandId}/images`, 'POST', { url: imageUrl }),
};

export type ApiClient = typeof apiClient;
