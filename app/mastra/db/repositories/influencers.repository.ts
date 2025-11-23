import { eq } from 'drizzle-orm';
import type { Database } from '../client';
import { influencers, type Influencer, type NewInfluencer } from '../schema';
import { randomUUID } from 'crypto';

export class InfluencersRepository {
  constructor(private db: Database) {}

  /**
   * Create a new influencer
   */
  async create(data: Omit<NewInfluencer, 'influencerId' | 'createdAt'>): Promise<Influencer> {
    const influencerId = randomUUID();

    const [influencer] = await this.db
      .insert(influencers)
      .values({
        ...data,
        influencerId,
        enabled: data.enabled ?? true,
        createdAt: new Date(),
      })
      .returning();

    return influencer;
  }

  /**
   * Get influencer by ID
   */
  async findById(influencerId: string): Promise<Influencer | undefined> {
    const [influencer] = await this.db
      .select()
      .from(influencers)
      .where(eq(influencers.influencerId, influencerId))
      .limit(1);

    return influencer;
  }

  /**
   * Get all influencers
   */
  async findAll(): Promise<Influencer[]> {
    return await this.db.select().from(influencers);
  }

  /**
   * Get only enabled influencers
   */
  async findEnabled(): Promise<Influencer[]> {
    return await this.db
      .select()
      .from(influencers)
      .where(eq(influencers.enabled, true));
  }

  /**
   * Update influencer
   */
  async update(influencerId: string, data: Partial<Omit<Influencer, 'influencerId' | 'createdAt'>>): Promise<Influencer | undefined> {
    const [updated] = await this.db
      .update(influencers)
      .set(data)
      .where(eq(influencers.influencerId, influencerId))
      .returning();

    return updated;
  }

  /**
   * Toggle influencer enabled status
   */
  async toggleEnabled(influencerId: string): Promise<Influencer | undefined> {
    const existing = await this.findById(influencerId);
    if (!existing) return undefined;

    return await this.update(influencerId, { enabled: !existing.enabled });
  }

  /**
   * Delete influencer
   */
  async delete(influencerId: string): Promise<void> {
    await this.db.delete(influencers).where(eq(influencers.influencerId, influencerId));
  }
}
