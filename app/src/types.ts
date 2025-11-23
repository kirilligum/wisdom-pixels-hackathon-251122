/**
 * Data model types for Wisdom Pixels v0
 * Single source of truth for all data structures
 */

export interface Brand {
  id: string;
  name: string;
  domain: string;
  contentSources: string[]; // URLs or text references
}

export interface Persona {
  id: string;
  brandId: string;
  label: string;
  description: string;
  tags: string[]; // e.g., ["yoga", "WFH"]
}

export interface Environment {
  id: string;
  brandId: string;
  label: string;
  description: string;
  type: 'apartment' | 'nature' | 'clinic' | 'gym' | 'park';
}

export interface Influencer {
  id: string;
  brandId: string;
  name: string;
  ageRange: string; // e.g., "30-35"
  role: string; // e.g., "Doctor of PT & yoga teacher"
  bioShort: string;
  tags: string[]; // e.g., ["yoga", "clinic", "runner"]
  imageUrl: string; // avatar URL
  isDefault: boolean;
  enabled: boolean;
  synthetic: true; // v0: all influencers are synthetic
}

export interface Card {
  id: string;
  brandId: string;
  personaId: string;
  influencerId: string;
  environmentId?: string;
  query: string;
  response: string;
  imageUrl: string;
  url: string; // unique path, e.g., "/cards/card_a1b2c3"
  status: 'draft' | 'ready' | 'published';
  viewCount?: number; // for telemetry
}

/**
 * Full brand data structure with all related entities
 */
export interface BrandData {
  brand: Brand;
  personas: Persona[];
  environments: Environment[];
  influencers: Influencer[];
  cards: Card[];
}
