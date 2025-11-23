/**
 * Data model types for Wisdom Pixels v0
 * Single source of truth for all data structures
 */

export interface Brand {
  brandId: string;
  name: string;
  domain: string;
  description?: string | null;
  contentSources: string[]; // URLs or text references
  urlSlug?: string;
}

export interface Persona {
  personaId: string;
  brandId: string;
  label: string;
  description: string;
  tags: string[];
}

export interface Environment {
  environmentId: string;
  brandId: string;
  label: string;
  description: string;
  tags: string[];
}

export interface Influencer {
  influencerId: string;
  name: string;
  bio: string;
  domain: string;
  imageUrl: string;
  actionImageUrls?: string[];
  enabled: boolean;
}

export interface Card {
  cardId: string;
  brandId: string;
  personaId?: string | null;
  influencerId: string;
  environmentId?: string | null;
  query: string;
  response: string;
  imageUrl: string;
  imageBrief: string;
  status: 'draft' | 'published' | string;
  viewCount?: number;
}

export interface BrandData {
  brand: Brand;
  personas: Persona[];
  environments: Environment[];
  influencers: Influencer[];
  cards: Card[];
}
