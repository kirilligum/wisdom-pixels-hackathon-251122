import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../../mastra/db/schema';
import {
  BrandsRepository,
  PersonasRepository,
  EnvironmentsRepository,
  InfluencersRepository,
  CardsRepository,
  WorkflowRunsRepository,
} from '../../mastra/db/repositories';
import path from 'path';

export interface TestDatabase {
  db: ReturnType<typeof drizzle<typeof schema>>;
  sqlite: Database.Database;
  repos: {
    brands: BrandsRepository;
    personas: PersonasRepository;
    environments: EnvironmentsRepository;
    influencers: InfluencersRepository;
    cards: CardsRepository;
    workflowRuns: WorkflowRunsRepository;
  };
  cleanup: () => void;
}

/**
 * Creates an in-memory SQLite database for testing
 * Automatically applies migrations and enables foreign keys
 */
export function setupTestDb(): TestDatabase {
  // Create in-memory database
  const sqlite = new Database(':memory:');

  // Enable foreign keys (critical for referential integrity)
  sqlite.pragma('foreign_keys = ON');

  // Create Drizzle instance
  const db = drizzle(sqlite, { schema });

  // Run migrations
  const migrationsFolder = path.join(process.cwd(), 'mastra/db/migrations');
  migrate(db, { migrationsFolder });

  // Create repository instances
  const repos = {
    brands: new BrandsRepository(db),
    personas: new PersonasRepository(db),
    environments: new EnvironmentsRepository(db),
    influencers: new InfluencersRepository(db),
    cards: new CardsRepository(db),
    workflowRuns: new WorkflowRunsRepository(db),
  };

  return {
    db,
    sqlite,
    repos,
    cleanup: () => sqlite.close(),
  };
}

/**
 * Creates test data for a brand with personas, environments, and influencers
 */
export async function createTestBrand(repos: TestDatabase['repos']) {
  const brand = await repos.brands.create({
    name: 'TestBrand',
    domain: 'Test Domain',
    description: 'Test description',
    urlSlug: 'testbrand',
    contentSources: ['https://test.com'],
  });

  const persona = await repos.personas.create({
    brandId: brand.brandId,
    label: 'Test Persona',
    description: 'Test persona description',
    tags: ['test'],
  });

  const environment = await repos.environments.create({
    brandId: brand.brandId,
    label: 'Test Environment',
    description: 'Test environment description',
    tags: ['test'],
  });

  const influencer = await repos.influencers.create({
    name: 'Test Influencer',
    bio: 'Test bio',
    domain: 'Test Domain',
    imageUrl: 'https://test.com/image.jpg',
    enabled: true,
  });

  return { brand, persona, environment, influencer };
}
