import { eq, and, sql } from 'drizzle-orm';
import type { Database } from '../client';
import { cards, type Card, type NewCard } from '../schema';
import { randomUUID } from 'crypto';

export class CardsRepository {
  constructor(private db: Database) {}

  /**
   * Create a new card
   */
  async create(data: Omit<NewCard, 'cardId' | 'createdAt'>): Promise<Card> {
    const cardId = randomUUID();

    const [card] = await this.db
      .insert(cards)
      .values({
        ...data,
        cardId,
        status: data.status ?? 'draft',
        viewCount: data.viewCount ?? 0,
        shareCount: data.shareCount ?? 0,
        createdAt: new Date(),
      })
      .returning();

    return card;
  }

  /**
   * Get card by ID
   */
  async findById(cardId: string): Promise<Card | undefined> {
    const [card] = await this.db
      .select()
      .from(cards)
      .where(eq(cards.cardId, cardId))
      .limit(1);

    return card;
  }

  /**
   * Get all cards for a brand
   */
  async findByBrandId(brandId: string, filters?: {
    status?: string;
    influencerId?: string;
    personaId?: string;
    environmentId?: string;
  }): Promise<Card[]> {
    const conditions = [eq(cards.brandId, brandId)];

    if (filters?.status) {
      conditions.push(eq(cards.status, filters.status));
    }
    if (filters?.influencerId) {
      conditions.push(eq(cards.influencerId, filters.influencerId));
    }
    if (filters?.personaId) {
      conditions.push(eq(cards.personaId, filters.personaId));
    }
    if (filters?.environmentId) {
      conditions.push(eq(cards.environmentId, filters.environmentId));
    }

    return await this.db
      .select()
      .from(cards)
      .where(and(...conditions))
      .orderBy(sql`${cards.createdAt} DESC`);
  }

  /**
   * Get published cards for a brand
   */
  async findPublishedByBrandId(brandId: string): Promise<Card[]> {
    return await this.db
      .select()
      .from(cards)
      .where(and(eq(cards.brandId, brandId), eq(cards.status, 'published')))
      .orderBy(sql`${cards.publishedAt} DESC`);
  }

  /**
   * Get all cards
   */
  async findAll(): Promise<Card[]> {
    return await this.db
      .select()
      .from(cards)
      .orderBy(sql`${cards.createdAt} DESC`);
  }

  /**
   * Update card
   */
  async update(cardId: string, data: Partial<Omit<Card, 'cardId' | 'createdAt'>>): Promise<Card | undefined> {
    const [updated] = await this.db
      .update(cards)
      .set(data)
      .where(eq(cards.cardId, cardId))
      .returning();

    return updated;
  }

  /**
   * Publish a card (set status to 'published' and set publishedAt)
   */
  async publish(cardId: string): Promise<Card | undefined> {
    return await this.update(cardId, {
      status: 'published',
      publishedAt: new Date(),
    });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(cardId: string): Promise<void> {
    await this.db
      .update(cards)
      .set({ viewCount: sql`${cards.viewCount} + 1` })
      .where(eq(cards.cardId, cardId));
  }

  /**
   * Increment share count
   */
  async incrementShareCount(cardId: string): Promise<void> {
    await this.db
      .update(cards)
      .set({ shareCount: sql`${cards.shareCount} + 1` })
      .where(eq(cards.cardId, cardId));
  }

  /**
   * Delete card
   */
  async delete(cardId: string): Promise<void> {
    await this.db.delete(cards).where(eq(cards.cardId, cardId));
  }

  /**
   * Delete all cards for a brand
   */
  async deleteByBrandId(brandId: string): Promise<void> {
    await this.db.delete(cards).where(eq(cards.brandId, brandId));
  }

  /**
   * Get card count by status for a brand
   */
  async getCountByStatus(brandId: string, status: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(cards)
      .where(and(eq(cards.brandId, brandId), eq(cards.status, status)));

    return result[0]?.count ?? 0;
  }
}
