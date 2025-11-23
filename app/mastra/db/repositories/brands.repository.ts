import { eq } from 'drizzle-orm';
import type { Database } from '../client';
import { brands, type Brand, type NewBrand } from '../schema';
import { randomUUID } from 'crypto';

export class BrandsRepository {
  constructor(private db: Database) {}

  /**
   * Create a new brand with auto-generated ID and timestamps
   */
  async create(data: Omit<NewBrand, 'brandId' | 'createdAt' | 'updatedAt'>): Promise<Brand> {
    const brandId = randomUUID();
    const now = new Date();

    const [brand] = await this.db
      .insert(brands)
      .values({
        ...data,
        brandId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return brand;
  }

  /**
   * Get brand by ID
   */
  async findById(brandId: string): Promise<Brand | undefined> {
    const [brand] = await this.db
      .select()
      .from(brands)
      .where(eq(brands.brandId, brandId))
      .limit(1);

    return brand;
  }

  /**
   * Get brand by URL slug (unique)
   */
  async findBySlug(urlSlug: string): Promise<Brand | undefined> {
    const [brand] = await this.db
      .select()
      .from(brands)
      .where(eq(brands.urlSlug, urlSlug))
      .limit(1);

    return brand;
  }

  /**
   * Get all brands
   */
  async findAll(): Promise<Brand[]> {
    return await this.db.select().from(brands);
  }

  /**
   * Update brand
   */
  async update(brandId: string, data: Partial<Omit<Brand, 'brandId' | 'createdAt'>>): Promise<Brand | undefined> {
    const [updated] = await this.db
      .update(brands)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(brands.brandId, brandId))
      .returning();

    return updated;
  }

  /**
   * Delete brand (cascades to personas, environments, cards)
   */
  async delete(brandId: string): Promise<void> {
    await this.db.delete(brands).where(eq(brands.brandId, brandId));
  }

  /**
   * Check if URL slug is available
   */
  async isSlugAvailable(urlSlug: string): Promise<boolean> {
    const existing = await this.findBySlug(urlSlug);
    return !existing;
  }
}
