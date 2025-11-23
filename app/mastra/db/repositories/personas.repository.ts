import { eq } from 'drizzle-orm';
import type { Database } from '../client';
import { personas, type Persona, type NewPersona } from '../schema';
import { randomUUID } from 'crypto';

export class PersonasRepository {
  constructor(private db: Database) {}

  /**
   * Create a new persona
   */
  async create(data: Omit<NewPersona, 'personaId' | 'createdAt'>): Promise<Persona> {
    const personaId = randomUUID();

    const [persona] = await this.db
      .insert(personas)
      .values({
        ...data,
        personaId,
        createdAt: new Date(),
      })
      .returning();

    return persona;
  }

  /**
   * Get persona by ID
   */
  async findById(personaId: string): Promise<Persona | undefined> {
    const [persona] = await this.db
      .select()
      .from(personas)
      .where(eq(personas.personaId, personaId))
      .limit(1);

    return persona;
  }

  /**
   * Get all personas for a brand
   */
  async findByBrandId(brandId: string): Promise<Persona[]> {
    return await this.db
      .select()
      .from(personas)
      .where(eq(personas.brandId, brandId));
  }

  /**
   * Get all personas
   */
  async findAll(): Promise<Persona[]> {
    return await this.db.select().from(personas);
  }

  /**
   * Update persona
   */
  async update(personaId: string, data: Partial<Omit<Persona, 'personaId' | 'createdAt'>>): Promise<Persona | undefined> {
    const [updated] = await this.db
      .update(personas)
      .set(data)
      .where(eq(personas.personaId, personaId))
      .returning();

    return updated;
  }

  /**
   * Delete persona
   */
  async delete(personaId: string): Promise<void> {
    await this.db.delete(personas).where(eq(personas.personaId, personaId));
  }

  /**
   * Delete all personas for a brand
   */
  async deleteByBrandId(brandId: string): Promise<void> {
    await this.db.delete(personas).where(eq(personas.brandId, brandId));
  }
}
