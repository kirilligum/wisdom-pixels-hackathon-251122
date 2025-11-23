import { eq } from 'drizzle-orm';
import type { Database } from '../client';
import { environments, type Environment, type NewEnvironment } from '../schema';
import { randomUUID } from 'crypto';

export class EnvironmentsRepository {
  constructor(private db: Database) {}

  /**
   * Create a new environment
   */
  async create(data: Omit<NewEnvironment, 'environmentId' | 'createdAt'>): Promise<Environment> {
    const environmentId = randomUUID();

    const [environment] = await this.db
      .insert(environments)
      .values({
        ...data,
        environmentId,
        createdAt: new Date(),
      })
      .returning();

    return environment;
  }

  /**
   * Get environment by ID
   */
  async findById(environmentId: string): Promise<Environment | undefined> {
    const [environment] = await this.db
      .select()
      .from(environments)
      .where(eq(environments.environmentId, environmentId))
      .limit(1);

    return environment;
  }

  /**
   * Get all environments for a brand
   */
  async findByBrandId(brandId: string): Promise<Environment[]> {
    return await this.db
      .select()
      .from(environments)
      .where(eq(environments.brandId, brandId));
  }

  /**
   * Get all environments
   */
  async findAll(): Promise<Environment[]> {
    return await this.db.select().from(environments);
  }

  /**
   * Update environment
   */
  async update(environmentId: string, data: Partial<Omit<Environment, 'environmentId' | 'createdAt'>>): Promise<Environment | undefined> {
    const [updated] = await this.db
      .update(environments)
      .set(data)
      .where(eq(environments.environmentId, environmentId))
      .returning();

    return updated;
  }

  /**
   * Delete environment
   */
  async delete(environmentId: string): Promise<void> {
    await this.db.delete(environments).where(eq(environments.environmentId, environmentId));
  }

  /**
   * Delete all environments for a brand
   */
  async deleteByBrandId(brandId: string): Promise<void> {
    await this.db.delete(environments).where(eq(environments.brandId, brandId));
  }
}
