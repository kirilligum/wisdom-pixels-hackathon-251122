# Inter-Phase Testing Strategy

**Document Version**: 1.0
**Created**: 2025-11-23
**Purpose**: Define how to test and validate each phase before proceeding to the next

---

## Testing Stack Overview

We use **different testing tools for different layers**:

| Layer | Tool | Phases | Purpose |
|-------|------|--------|---------|
| **Backend (Database, Tools, Agents, Workflows)** | **Jest** | M1-M4 | Unit and integration tests without browser |
| **API Layer** | **Supertest + Jest** | M5 | HTTP endpoint testing |
| **Frontend (Browser)** | **Playwright** | M6-M7 | Real browser E2E testing |

### Why This Stack?

- **Jest**: Fast, excellent mocking, perfect for backend logic (database, agents, workflows)
- **Supertest**: Tests HTTP APIs without starting server or browser
- **Playwright**: Real browser testing for user flows (you already have 47 tests!)

### Installation Required

```bash
# You already have:
# - Jest (^30.2.0) ✅
# - Playwright (^1.56.1) ✅
# - ts-jest (^29.4.5) ✅

# Add for API testing:
npm install -D supertest @types/supertest

# Add for database testing:
npm install -D better-sqlite3 @types/better-sqlite3
```

### File Naming Convention

- **`.test.ts`** → Jest tests (backend, API)
- **`.spec.ts`** → Playwright tests (frontend E2E)

```
tests/
├── unit/db/schema.test.ts           # Jest
├── api/brands.api.test.ts           # Jest + Supertest
└── e2e/frontend/setup-flow.spec.ts  # Playwright
```

---

## Overview

Each phase must pass **three types of validation** before proceeding:

1. **Unit Tests** (Jest) - Individual components work correctly
2. **Integration Tests** (Jest/Playwright) - Components work together
3. **Exit Criteria Validation** (Script) - Phase-specific requirements met

---

## Testing Philosophy

### Red-Green-Refactor Per Phase

```
1. Write tests FIRST (based on exit criteria)
2. Implement phase features
3. Run tests until all GREEN
4. Refactor if needed
5. Git tag phase completion
6. Move to next phase
```

### Test Isolation

- Each phase's tests should run independently
- Use mocks/stubs for dependencies not yet implemented
- Clean database state between tests
- No test pollution between phases

---

## Phase M1: Database Foundation

**Testing Tool**: Jest + better-sqlite3 (in-memory database)

### What to Test

✅ Schema creation
✅ Foreign key constraints
✅ Repository CRUD operations
✅ Data integrity
✅ Seed data loading

### Test Structure

```
tests/
└── unit/
    └── db/
        ├── schema.test.ts              # Schema validation (Jest)
        ├── repositories/
        │   ├── brand.repository.test.ts        # (Jest)
        │   ├── persona.repository.test.ts      # (Jest)
        │   ├── environment.repository.test.ts  # (Jest)
        │   ├── influencer.repository.test.ts   # (Jest)
        │   ├── card.repository.test.ts         # (Jest)
        │   └── workflow-run.repository.test.ts # (Jest)
        └── seed.test.ts                 # Seed data validation (Jest)
```

### Test Examples

**1. Schema Validation Test** (`tests/unit/db/schema.test.ts`)

```typescript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { drizzle } from 'drizzle-orm/libsql';
import Database from 'better-sqlite3';
import * as schema from '../../../app/mastra/db/schema';

describe('Database Schema', () => {
  let db: ReturnType<typeof drizzle>;
  let sqlite: Database.Database;

  beforeEach(() => {
    // Create in-memory database for testing
    sqlite = new Database(':memory:');
    db = drizzle(sqlite, { schema });

    // Run migrations
    migrate(db, { migrationsFolder: './app/mastra/db/migrations' });
  });

  afterEach(() => {
    sqlite.close();
  });

  test('TEST-M1-001: All 6 tables should exist', () => {
    const tables = db.select().from(schema.brands).toSQL();
    expect(tables).toBeDefined();

    // Verify all tables
    const tableNames = ['brands', 'personas', 'environments', 'influencers', 'cards', 'workflow_runs'];
    tableNames.forEach(tableName => {
      const result = sqlite.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
      ).get(tableName);
      expect(result).toBeDefined();
    });
  });

  test('TEST-M1-002: Foreign key constraints should be enforced', () => {
    // Enable foreign keys
    sqlite.exec('PRAGMA foreign_keys = ON');

    // Try to insert card without valid brand
    expect(() => {
      db.insert(schema.cards).values({
        id: 'card-1',
        brandId: 'nonexistent-brand',
        personaId: 'persona-1',
        influencerId: 'influencer-1',
        query: 'Test query',
        response: 'Test response',
        imageUrl: 'https://example.com/image.jpg',
        urlSlug: 'test-slug',
        status: 'draft',
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).run();
    }).toThrow(); // Should throw foreign key constraint error
  });

  test('TEST-M1-003: URL slug should be unique per brand', () => {
    // Insert brand
    const brandId = 'brand-1';
    db.insert(schema.brands).values({
      id: brandId,
      name: 'Test Brand',
      domain: 'fitness',
      contentSources: ['https://example.com'],
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();

    // Insert persona and influencer
    const personaId = 'persona-1';
    const influencerId = 'influencer-1';
    // ... (insert statements)

    // Insert first card with slug
    db.insert(schema.cards).values({
      id: 'card-1',
      brandId,
      personaId,
      influencerId,
      query: 'Test query 1',
      response: 'Test response 1',
      imageUrl: 'https://example.com/image1.jpg',
      urlSlug: 'test-slug',
      status: 'draft',
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();

    // Try to insert second card with same slug
    expect(() => {
      db.insert(schema.cards).values({
        id: 'card-2',
        brandId,
        personaId,
        influencerId,
        query: 'Test query 2',
        response: 'Test response 2',
        imageUrl: 'https://example.com/image2.jpg',
        urlSlug: 'test-slug', // Same slug!
        status: 'draft',
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).run();
    }).toThrow(); // Should throw unique constraint error
  });
});
```

**2. Repository Test** (`tests/unit/db/repositories/brand.repository.test.ts`)

```typescript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { BrandRepository } from '../../../../app/mastra/db/repositories/brand.repository';
import { setupTestDb, teardownTestDb } from '../../../helpers/db-test-helper';

describe('BrandRepository', () => {
  let repository: BrandRepository;
  let cleanup: () => void;

  beforeEach(() => {
    const { db, cleanup: cleanupFn } = setupTestDb();
    repository = new BrandRepository(db);
    cleanup = cleanupFn;
  });

  afterEach(() => {
    cleanup();
  });

  test('TEST-M1-004: Should create brand', async () => {
    const brand = await repository.create({
      name: 'FlowForm Motion Suit',
      domain: 'fitness',
      contentSources: ['https://flowform.example.com'],
    });

    expect(brand.id).toBeDefined();
    expect(brand.name).toBe('FlowForm Motion Suit');
    expect(brand.domain).toBe('fitness');
  });

  test('TEST-M1-005: Should read brand by id', async () => {
    const created = await repository.create({
      name: 'Test Brand',
      domain: 'fitness',
      contentSources: [],
    });

    const found = await repository.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
  });

  test('TEST-M1-006: Should update brand', async () => {
    const created = await repository.create({
      name: 'Original Name',
      domain: 'fitness',
      contentSources: [],
    });

    const updated = await repository.update(created.id, {
      name: 'Updated Name',
    });

    expect(updated.name).toBe('Updated Name');
  });

  test('TEST-M1-007: Should delete brand and cascade', async () => {
    // This will test if cascading deletes work properly
    const brand = await repository.create({
      name: 'Test Brand',
      domain: 'fitness',
      contentSources: [],
    });

    await repository.delete(brand.id);

    const found = await repository.findById(brand.id);
    expect(found).toBeNull();
  });
});
```

**3. Seed Data Test** (`tests/unit/db/seed.test.ts`)

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { seedDatabase } from '../../../app/mastra/db/seed';
import { setupTestDb } from '../../helpers/db-test-helper';
import { BrandRepository } from '../../../app/mastra/db/repositories/brand.repository';
import { PersonaRepository } from '../../../app/mastra/db/repositories/persona.repository';
import { InfluencerRepository } from '../../../app/mastra/db/repositories/influencer.repository';

describe('Database Seeding', () => {
  test('TEST-M1-008: Should seed FlowForm brand with full schema', async () => {
    const { db, cleanup } = setupTestDb();

    // Run seed
    await seedDatabase(db);

    // Verify brand exists
    const brandRepo = new BrandRepository(db);
    const brands = await brandRepo.findAll();
    expect(brands.length).toBeGreaterThan(0);

    const flowform = brands.find(b => b.name.includes('FlowForm'));
    expect(flowform).toBeDefined();

    // Verify personas
    const personaRepo = new PersonaRepository(db);
    const personas = await personaRepo.findByBrandId(flowform!.id);
    expect(personas.length).toBeGreaterThanOrEqual(3);

    // Verify influencers
    const influencerRepo = new InfluencerRepository(db);
    const influencers = await influencerRepo.findByBrandId(flowform!.id);
    expect(influencers.length).toBe(5);

    // Verify at least one influencer in 30s
    const thirties = influencers.filter(i => i.ageRange.includes('30'));
    expect(thirties.length).toBeGreaterThanOrEqual(1);

    // Verify all synthetic
    influencers.forEach(inf => {
      expect(inf.synthetic).toBe(true);
    });

    cleanup();
  });
});
```

### Test Helper Setup

**File**: `tests/helpers/db-test-helper.ts`

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '../../app/mastra/db/schema';

export function setupTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });

  // Enable foreign keys
  sqlite.exec('PRAGMA foreign_keys = ON');

  // Run migrations
  migrate(db, { migrationsFolder: './app/mastra/db/migrations' });

  return {
    db,
    sqlite,
    cleanup: () => sqlite.close(),
  };
}

export function teardownTestDb(sqlite: Database.Database) {
  sqlite.close();
}
```

### Running M1 Tests

```bash
# Run all M1 tests
npm run test:m1

# Or individual test suites
npm test tests/unit/db/schema.test.ts
npm test tests/unit/db/repositories/brand.repository.test.ts
npm test tests/unit/db/seed.test.ts
```

### Exit Criteria Validation Script

**File**: `scripts/validate-m1.ts`

```typescript
#!/usr/bin/env tsx
import { setupTestDb } from '../tests/helpers/db-test-helper';
import { seedDatabase } from '../app/mastra/db/seed';
import { BrandRepository } from '../app/mastra/db/repositories/brand.repository';
import chalk from 'chalk';

async function validateM1() {
  console.log(chalk.blue('🔍 Validating Phase M1 Exit Criteria...\n'));

  const { db, cleanup } = setupTestDb();

  const checks = [
    {
      name: 'All 6 tables created',
      test: async () => {
        const tables = ['brands', 'personas', 'environments', 'influencers', 'cards', 'workflow_runs'];
        return tables.every(t => {
          try {
            db.execute(`SELECT 1 FROM ${t} LIMIT 1`);
            return true;
          } catch {
            return false;
          }
        });
      }
    },
    {
      name: 'All repositories implement CRUD',
      test: async () => {
        const brandRepo = new BrandRepository(db);
        const brand = await brandRepo.create({
          name: 'Test',
          domain: 'test',
          contentSources: [],
        });
        const found = await brandRepo.findById(brand.id);
        const updated = await brandRepo.update(brand.id, { name: 'Updated' });
        await brandRepo.delete(brand.id);
        return found !== null && updated.name === 'Updated';
      }
    },
    {
      name: 'Seed data loads successfully',
      test: async () => {
        await seedDatabase(db);
        const brandRepo = new BrandRepository(db);
        const brands = await brandRepo.findAll();
        return brands.length > 0;
      }
    },
    {
      name: 'Foreign key constraints enforced',
      test: async () => {
        try {
          db.insert(schema.cards).values({
            id: 'test',
            brandId: 'nonexistent',
            // ... other fields
          });
          return false; // Should have thrown
        } catch {
          return true; // Correctly threw FK error
        }
      }
    }
  ];

  let allPassed = true;
  for (const check of checks) {
    try {
      const passed = await check.test();
      if (passed) {
        console.log(chalk.green('✓'), check.name);
      } else {
        console.log(chalk.red('✗'), check.name);
        allPassed = false;
      }
    } catch (error) {
      console.log(chalk.red('✗'), check.name, chalk.gray(`(${error.message})`));
      allPassed = false;
    }
  }

  cleanup();

  console.log('\n' + chalk.bold(allPassed ? chalk.green('✓ Phase M1 READY') : chalk.red('✗ Phase M1 NOT READY')));

  if (!allPassed) {
    console.log(chalk.yellow('\nFix failing checks before proceeding to Phase M2'));
    process.exit(1);
  }
}

validateM1();
```

```bash
# Run validation
npm run validate:m1
```

---

## Phase M2: Infrastructure Tools

**Testing Tool**: Jest (with mocks for external APIs)

### What to Test

✅ Tool input/output schemas
✅ DbTool CRUD operations
✅ ContentFetcherTool HTTP fetching
✅ ImageGenerationTool fal.ai integration
✅ UrlSlugTool uniqueness

### Test Structure

```
tests/
├── unit/
│   └── tools/
│       ├── db-tool.test.ts                   # (Jest + in-memory DB)
│       ├── content-fetcher-tool.test.ts      # (Jest + mocked HTTP)
│       ├── image-generation-tool.test.ts     # (Jest + mocked fal.ai)
│       └── url-slug-tool.test.ts             # (Jest)
└── integration/
    └── tools/
        └── tools-integration.test.ts         # (Jest)
```

### Test Examples

**1. DbTool Test** (`tests/unit/tools/db-tool.test.ts`)

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { dbTool } from '../../../app/mastra/tools/db-tool';
import { setupTestDb } from '../../helpers/db-test-helper';

describe('DbTool', () => {
  let db: any;
  let cleanup: () => void;

  beforeEach(() => {
    const setup = setupTestDb();
    db = setup.db;
    cleanup = setup.cleanup;
  });

  afterEach(() => cleanup());

  test('TEST-M2-001: Should create entity via DbTool', async () => {
    const result = await dbTool.execute({
      context: {
        operation: 'create',
        entity: 'brand',
        data: {
          name: 'Test Brand',
          domain: 'fitness',
          contentSources: [],
        },
      },
      db, // Inject db for testing
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Brand');
  });

  test('TEST-M2-002: Should query entities with filters', async () => {
    // Create test data
    await dbTool.execute({
      context: { operation: 'create', entity: 'brand', data: { name: 'Brand A', domain: 'fitness', contentSources: [] } },
      db,
    });
    await dbTool.execute({
      context: { operation: 'create', entity: 'brand', data: { name: 'Brand B', domain: 'wellness', contentSources: [] } },
      db,
    });

    // Query with filter
    const result = await dbTool.execute({
      context: {
        operation: 'query',
        entity: 'brand',
        filters: { domain: 'fitness' },
      },
      db,
    });

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Brand A');
  });
});
```

**2. ImageGenerationTool Test (with mock)** (`tests/unit/tools/image-generation-tool.test.ts`)

```typescript
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { imageGenerationTool } from '../../../app/mastra/tools/image-generation-tool';

// Mock fal.ai
jest.mock('@fal-ai/client', () => ({
  fal: {
    config: jest.fn(),
    subscribe: jest.fn(),
  },
}));

describe('ImageGenerationTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TEST-M2-003: Should call alpha-image-232/edit-image model', async () => {
    const { fal } = await import('@fal-ai/client');

    // Mock successful response
    (fal.subscribe as jest.Mock).mockResolvedValue({
      data: {
        images: [{
          url: 'https://example.com/generated.jpg',
          width: 1024,
          height: 768,
        }],
        seed: 12345,
      },
    });

    const result = await imageGenerationTool.execute({
      context: {
        prompt: 'A professional athlete in a gym',
        image_urls: ['https://example.com/influencer.jpg'],
        image_size: 'landscape_4_3',
      },
    });

    expect(fal.subscribe).toHaveBeenCalledWith(
      'fal-ai/alpha-image-232/edit-image',
      expect.objectContaining({
        input: expect.objectContaining({
          prompt: 'A professional athlete in a gym',
          image_urls: ['https://example.com/influencer.jpg'],
        }),
      })
    );

    expect(result.url).toBe('https://example.com/generated.jpg');
  });

  test('TEST-M2-004: Should handle fal.ai errors gracefully', async () => {
    const { fal } = await import('@fal-ai/client');

    // Mock error
    (fal.subscribe as jest.Mock).mockRejectedValue(new Error('API rate limit exceeded'));

    await expect(
      imageGenerationTool.execute({
        context: {
          prompt: 'Test prompt',
        },
      })
    ).rejects.toThrow('API rate limit exceeded');
  });

  test('TEST-M2-005: Should support optional image_urls parameter', async () => {
    const { fal } = await import('@fal-ai/client');

    (fal.subscribe as jest.Mock).mockResolvedValue({
      data: {
        images: [{ url: 'https://example.com/image.jpg', width: 1024, height: 768 }],
        seed: 123,
      },
    });

    const result = await imageGenerationTool.execute({
      context: {
        prompt: 'A gym scene',
        // No image_urls
      },
    });

    expect(fal.subscribe).toHaveBeenCalledWith(
      'fal-ai/alpha-image-232/edit-image',
      expect.objectContaining({
        input: expect.objectContaining({
          prompt: 'A gym scene',
          image_urls: [], // Should default to empty array
        }),
      })
    );
  });
});
```

**3. Integration Test** (`tests/integration/tools/tools-integration.test.ts`)

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { dbTool } from '../../../app/mastra/tools/db-tool';
import { urlSlugTool } from '../../../app/mastra/tools/url-slug-tool';
import { setupTestDb } from '../../helpers/db-test-helper';

describe('Tools Integration', () => {
  test('TEST-M2-006: DbTool + UrlSlugTool should create unique slugs', async () => {
    const { db, cleanup } = setupTestDb();

    try {
      // Create brand via DbTool
      const brand = await dbTool.execute({
        context: {
          operation: 'create',
          entity: 'brand',
          data: { name: 'Test Brand', domain: 'fitness', contentSources: [] },
        },
        db,
      });

      // Generate slug via UrlSlugTool
      const slug1 = await urlSlugTool.execute({
        context: {
          brandId: brand.id,
          text: 'What does Alex Chen recommend for recovery?',
        },
        db,
      });

      // Try to generate same slug (should add counter)
      const slug2 = await urlSlugTool.execute({
        context: {
          brandId: brand.id,
          text: 'What does Alex Chen recommend for recovery?',
        },
        db,
      });

      expect(slug1).toBe('what-does-alex-chen-recommend-for-recovery');
      expect(slug2).toBe('what-does-alex-chen-recommend-for-recovery-2');
    } finally {
      cleanup();
    }
  });
});
```

### Running M2 Tests

```bash
# Unit tests only (fast, with mocks)
npm run test:m2:unit

# Integration tests (slower, real HTTP/DB)
npm run test:m2:integration

# All M2 tests
npm run test:m2
```

### Exit Criteria Validation Script

**File**: `scripts/validate-m2.ts`

```typescript
#!/usr/bin/env tsx
import chalk from 'chalk';

async function validateM2() {
  console.log(chalk.blue('🔍 Validating Phase M2 Exit Criteria...\n'));

  const checks = [
    {
      name: 'All 4 tools created',
      test: async () => {
        const tools = [
          '../app/mastra/tools/db-tool',
          '../app/mastra/tools/content-fetcher-tool',
          '../app/mastra/tools/image-generation-tool',
          '../app/mastra/tools/url-slug-tool',
        ];
        return tools.every(t => {
          try {
            require(t);
            return true;
          } catch {
            return false;
          }
        });
      }
    },
    {
      name: 'ImageGenerationTool uses alpha-image-232/edit-image',
      test: async () => {
        const { imageGenerationTool } = await import('../app/mastra/tools/image-generation-tool');
        // Check if model ID is correct in implementation
        const toolSource = await fs.promises.readFile(
          './app/mastra/tools/image-generation-tool.ts',
          'utf-8'
        );
        return toolSource.includes('fal-ai/alpha-image-232/edit-image');
      }
    },
    {
      name: 'TEST-501: Image generation returns URL',
      test: async () => {
        // Run actual test
        const result = await runTest('tests/unit/tools/image-generation-tool.test.ts', 'TEST-M2-003');
        return result.passed;
      }
    },
    {
      name: 'TEST-502: Error handling works',
      test: async () => {
        const result = await runTest('tests/unit/tools/image-generation-tool.test.ts', 'TEST-M2-004');
        return result.passed;
      }
    },
  ];

  // Run checks and report
  let allPassed = true;
  for (const check of checks) {
    try {
      const passed = await check.test();
      console.log(passed ? chalk.green('✓') : chalk.red('✗'), check.name);
      if (!passed) allPassed = false;
    } catch (error) {
      console.log(chalk.red('✗'), check.name, chalk.gray(`(${error.message})`));
      allPassed = false;
    }
  }

  console.log('\n' + chalk.bold(allPassed ? chalk.green('✓ Phase M2 READY') : chalk.red('✗ Phase M2 NOT READY')));

  if (!allPassed) {
    process.exit(1);
  }
}

validateM2();
```

---

## Phase M3: Specialized Agents

**Testing Tool**: Jest (with mocked LLM responses for speed)

### What to Test

✅ Agent prompt quality
✅ Agent tool usage
✅ Output schema validation
✅ Content quality (queries, answers, briefs)

### Test Structure

```
tests/
├── unit/
│   └── agents/
│       ├── content-analysis-agent.test.ts    # (Jest + mocked LLM)
│       ├── card-query-agent.test.ts          # (Jest + mocked LLM)
│       ├── card-answer-agent.test.ts         # (Jest + mocked LLM)
│       ├── safety-agent.test.ts              # (Jest + mocked LLM)
│       └── image-brief-agent.test.ts         # (Jest + mocked LLM)
└── integration/
    └── agents/
        └── agent-tool-integration.test.ts    # (Jest)
```

### Test Examples

**1. CardQueryAgent Test** (`tests/unit/agents/card-query-agent.test.ts`)

```typescript
import { describe, test, expect } from '@jest/globals';
import { cardQueryAgent } from '../../../app/mastra/agents/card-query-agent';

describe('CardQueryAgent', () => {
  test('TEST-M3-001: Should generate query mentioning influencer', async () => {
    const result = await cardQueryAgent.generate({
      messages: [{
        role: 'user',
        content: JSON.stringify({
          persona: {
            label: 'Marathon Runner',
            goals: ['Improve recovery time', 'Prevent injuries'],
          },
          influencer: {
            name: 'Alex Chen',
            role: 'Professional marathoner',
          },
          productName: 'FlowForm Motion Suit',
        }),
      }],
    });

    const query = result.text;

    // TEST-302: Query must contain influencer name
    expect(query.toLowerCase()).toContain('alex chen');

    // Should be reasonable length
    expect(query.split(' ').length).toBeGreaterThanOrEqual(10);
    expect(query.split(' ').length).toBeLessThanOrEqual(25);

    // Should be a question
    expect(query).toMatch(/\?/);
  });

  test('TEST-M3-002: Should generate diverse queries for different personas', async () => {
    const personas = [
      { label: 'Marathon Runner', goals: ['Improve recovery'] },
      { label: 'Gym Enthusiast', goals: ['Build muscle'] },
      { label: 'Yoga Practitioner', goals: ['Improve flexibility'] },
    ];

    const queries = [];
    for (const persona of personas) {
      const result = await cardQueryAgent.generate({
        messages: [{
          role: 'user',
          content: JSON.stringify({
            persona,
            influencer: { name: 'Alex Chen', role: 'Athlete' },
            productName: 'FlowForm',
          }),
        }],
      });
      queries.push(result.text);
    }

    // All queries should be different
    const uniqueQueries = new Set(queries);
    expect(uniqueQueries.size).toBe(personas.length);
  });
});
```

**2. SafetyAgent Test** (`tests/unit/agents/safety-agent.test.ts`)

```typescript
import { describe, test, expect } from '@jest/globals';
import { safetyAgent } from '../../../app/mastra/agents/safety-agent';

describe('SafetyAgent', () => {
  test('TEST-M3-003: Should flag medical claims', async () => {
    const testCases = [
      {
        response: 'This suit treats back pain and cures muscle soreness.',
        shouldFlag: true,
        reason: 'Contains "treats" and "cures"',
      },
      {
        response: 'This suit helps me feel more comfortable during workouts.',
        shouldFlag: false,
        reason: 'No medical claims',
      },
      {
        response: 'It prevents injuries and heals muscle damage.',
        shouldFlag: true,
        reason: 'Contains "prevents injuries" and "heals"',
      },
      {
        response: 'Great product for recovery and performance.',
        shouldFlag: false,
        reason: 'Generic benefits, not medical',
      },
    ];

    for (const testCase of testCases) {
      const result = await safetyAgent.generate({
        messages: [{
          role: 'user',
          content: JSON.stringify({
            query: 'Test query with influencer name',
            response: testCase.response,
            influencerName: 'Alex Chen',
            productName: 'FlowForm',
          }),
        }],
      });

      const validation = JSON.parse(result.text);

      if (testCase.shouldFlag) {
        expect(validation.safe).toBe(false);
        expect(validation.issues.length).toBeGreaterThan(0);
      } else {
        expect(validation.safe).toBe(true);
      }
    }
  });

  test('TEST-M3-004: Should flag missing influencer mention', async () => {
    const result = await safetyAgent.generate({
      messages: [{
        role: 'user',
        content: JSON.stringify({
          query: 'What is good for recovery?', // No influencer name!
          response: 'FlowForm Motion Suit is great.',
          influencerName: 'Alex Chen',
          productName: 'FlowForm',
        }),
      }],
    });

    const validation = JSON.parse(result.text);
    expect(validation.safe).toBe(false);
    expect(validation.issues).toContain(expect.stringMatching(/influencer/i));
  });
});
```

### Running M3 Tests

```bash
# Run agent tests (may take longer due to LLM calls)
npm run test:m3

# Run with cached responses (faster)
LLM_CACHE=true npm run test:m3
```

### Exit Criteria Validation

```bash
npm run validate:m3
```

---

## Phase M4: Workflows

**Testing Tool**: Jest (integration tests with real DB, mocked external APIs)

### What to Test

✅ Workflow orchestration
✅ Step execution order
✅ Error handling and retries
✅ WorkflowRun state tracking
✅ End-to-end data flow

### Test Structure

```
tests/
├── integration/
│   └── workflows/
│       ├── brand-onboarding.workflow.test.ts     # (Jest)
│       ├── card-generation.workflow.test.ts      # (Jest)
│       └── publishing.workflow.test.ts           # (Jest)
└── e2e/
    └── workflows/
        └── full-card-generation-flow.test.ts     # (Jest, may be slow)
```

### Test Examples

**1. BrandOnboardingWorkflow Test**

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { brandOnboardingWorkflow } from '../../../app/mastra/workflows/brand-onboarding.workflow';
import { setupTestDb } from '../../helpers/db-test-helper';
import { WorkflowRunRepository } from '../../../app/mastra/db/repositories/workflow-run.repository';

describe('BrandOnboardingWorkflow', () => {
  test('TEST-M4-001: Should extract personas and environments from content', async () => {
    const { db, cleanup } = setupTestDb();

    try {
      const input = {
        brandName: 'FlowForm',
        domain: 'fitness',
        contentSources: [
          'https://example.com/flowform', // Would be mocked in real test
        ],
      };

      const result = await brandOnboardingWorkflow.execute(input, { db });

      // Verify workflow completed
      expect(result.status).toBe('succeeded');

      // Verify brand created
      expect(result.output.brandId).toBeDefined();

      // TEST-002: At least 3 personas and 3 environments
      expect(result.output.personas.length).toBeGreaterThanOrEqual(3);
      expect(result.output.environments.length).toBeGreaterThanOrEqual(3);
      expect(result.output.influencers.length).toBe(5);

      // Verify WorkflowRun recorded
      const workflowRepo = new WorkflowRunRepository(db);
      const workflowRun = await workflowRepo.findById(result.workflowRunId);
      expect(workflowRun?.status).toBe('succeeded');
    } finally {
      cleanup();
    }
  });

  test('TEST-M4-002: Should handle workflow failures gracefully', async () => {
    const { db, cleanup } = setupTestDb();

    try {
      const input = {
        brandName: 'Test',
        domain: 'test',
        contentSources: ['https://invalid-url-that-404s.com'],
      };

      const result = await brandOnboardingWorkflow.execute(input, { db });

      // Workflow should fail but record the failure
      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();

      // WorkflowRun should reflect failure
      const workflowRepo = new WorkflowRunRepository(db);
      const workflowRun = await workflowRepo.findById(result.workflowRunId);
      expect(workflowRun?.status).toBe('failed');
      expect(workflowRun?.error).toBeDefined();
    } finally {
      cleanup();
    }
  });
});
```

**2. CardGenerationWorkflow E2E Test**

```typescript
import { describe, test, expect } from '@jest/globals';
import { cardGenerationWorkflow } from '../../../app/mastra/workflows/card-generation.workflow';
import { setupTestDb } from '../../helpers/db-test-helper';
import { seedDatabase } from '../../../app/mastra/db/seed';

describe('CardGenerationWorkflow E2E', () => {
  test('TEST-M4-003: Should generate N cards end-to-end', async () => {
    const { db, cleanup } = setupTestDb();

    try {
      // Seed database with FlowForm
      await seedDatabase(db);

      // Get brand ID
      const brandRepo = new BrandRepository(db);
      const brands = await brandRepo.findAll();
      const flowform = brands[0];

      // Run workflow to generate 5 cards
      const result = await cardGenerationWorkflow.execute({
        brandId: flowform.id,
        cardCount: 5,
      }, { db });

      // TEST-006: Workflow should generate requested number of cards
      expect(result.status).toBe('succeeded');
      expect(result.output.cards.length).toBe(5);

      // TEST-303: All cards should have imageUrl
      result.output.cards.forEach(card => {
        expect(card.imageUrl).toBeDefined();
        expect(card.imageUrl).toMatch(/^https?:\/\//);
      });

      // TEST-302 & TEST-304: Content validation
      result.output.cards.forEach(card => {
        // Query should mention influencer
        const influencer = result.output.influencers.find(i => i.id === card.influencerId);
        expect(card.query.toLowerCase()).toContain(influencer.name.toLowerCase());

        // Response should mention product
        expect(card.response.toLowerCase()).toContain('flowform');
      });
    } finally {
      cleanup();
    }
  }, 120000); // 2 minute timeout for full workflow
});
```

### Running M4 Tests

```bash
# Integration tests
npm run test:m4:integration

# E2E tests (slowest)
npm run test:m4:e2e

# All M4 tests
npm run test:m4
```

### Exit Criteria Validation

```bash
npm run validate:m4
```

---

## Phase M5: REST API

**Testing Tool**: Supertest + Jest (tests HTTP without browser)

### What to Test

✅ Endpoint contracts
✅ Request validation
✅ Response formats
✅ Error handling
✅ Performance (SLA)

### Test Structure

```
tests/
└── api/
    ├── brands.api.test.ts          # (Supertest + Jest)
    ├── cards.api.test.ts           # (Supertest + Jest)
    ├── workflows.api.test.ts       # (Supertest + Jest)
    └── performance.api.test.ts     # (Supertest + Jest)
```

### Test Examples

**1. API Contract Test**

```typescript
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../../app/server';
import { setupTestDb } from '../../helpers/db-test-helper';

describe('Brands API', () => {
  let db: any;
  let cleanup: () => void;

  beforeAll(() => {
    const setup = setupTestDb();
    db = setup.db;
    cleanup = setup.cleanup;

    // Inject db into app
    app.set('db', db);
  });

  afterAll(() => cleanup());

  test('TEST-M5-001: POST /api/brands should create brand', async () => {
    const response = await request(app)
      .post('/api/brands')
      .send({
        name: 'Test Brand',
        domain: 'fitness',
        contentSources: ['https://example.com'],
      })
      .expect(201)
      .expect('Content-Type', /json/);

    expect(response.body.brandId).toBeDefined();
    expect(response.body.name).toBe('Test Brand');
  });

  test('TEST-M5-002: POST /api/brands with invalid data should return 400', async () => {
    const response = await request(app)
      .post('/api/brands')
      .send({
        name: '', // Invalid: empty name
        domain: 'fitness',
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('TEST-M5-003: GET /api/brands/:id/cards should filter by status', async () => {
    // Create brand with cards
    const brand = await createTestBrand(db);
    await createTestCards(db, brand.id, [
      { status: 'draft' },
      { status: 'published' },
      { status: 'published' },
    ]);

    const response = await request(app)
      .get(`/api/brands/${brand.id}/cards`)
      .query({ status: 'published' })
      .expect(200);

    expect(response.body.cards.length).toBe(2);
    response.body.cards.forEach(card => {
      expect(card.status).toBe('published');
    });
  });
});
```

**2. Performance Test**

```typescript
import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../../../app/server';

describe('API Performance', () => {
  test('TEST-M5-004: GET /api/brands/:id/cards should respond <500ms', async () => {
    // Seed 20 cards
    const { brandId } = await seedTestData(db, { cardCount: 20 });

    const start = Date.now();

    await request(app)
      .get(`/api/brands/${brandId}/cards`)
      .expect(200);

    const duration = Date.now() - start;

    // TEST-102: Should be under 500ms
    expect(duration).toBeLessThan(500);
  });
});
```

### Running M5 Tests

```bash
# API contract tests
npm run test:m5:api

# Performance tests
npm run test:m5:perf

# All M5 tests
npm run test:m5
```

---

## Phase M6: Frontend Migration

**Testing Tool**: Playwright (real browser testing) + Jest (dependency audit)

### What to Test

✅ API client integration
✅ No direct Mastra calls
✅ Error handling in UI
✅ Loading states
✅ E2E user flows

### Test Structure

```
tests/
├── e2e/
│   └── frontend/
│       ├── brand-setup-flow.spec.ts          # (Playwright)
│       ├── card-generation-flow.spec.ts      # (Playwright)
│       └── card-gallery-flow.spec.ts         # (Playwright)
└── integration/
    └── frontend-deps.test.ts                 # (Jest - check no @mastra/client-js)
```

**Note**: Your existing 47 Playwright tests in `tests/TEST-*.spec.ts` continue to work!

### Test Examples

**1. E2E Flow Test (Playwright)**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Brand Setup Flow', () => {
  test('TEST-M6-001: Should create brand and onboard via API', async ({ page }) => {
    // Go to setup page
    await page.goto('/brand/setup');

    // Fill form
    await page.fill('[name="brandName"]', 'FlowForm Motion Suit');
    await page.fill('[name="domain"]', 'fitness');
    await page.fill('[name="url-0"]', 'https://flowform.example.com');

    // Submit
    await page.click('button[type="submit"]');

    // Should show loading state
    await expect(page.getByText('Analyzing content...')).toBeVisible();

    // Wait for completion (may take time)
    await expect(page.getByText('Onboarding complete')).toBeVisible({ timeout: 30000 });

    // Should show extracted personas
    const personas = page.locator('[data-testid="persona-card"]');
    await expect(personas).toHaveCount(3, { timeout: 5000 });
  });

  test('TEST-M6-002: Should handle API errors gracefully', async ({ page }) => {
    // Intercept API call and make it fail
    await page.route('**/api/brands', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Database connection failed',
          },
        }),
      });
    });

    await page.goto('/brand/setup');
    await page.fill('[name="brandName"]', 'Test');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.getByText('Database connection failed')).toBeVisible();
  });
});
```

**2. No Direct Mastra Calls Test**

```typescript
import { describe, test, expect } from '@jest/globals';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Frontend Dependencies', () => {
  test('TEST-M6-003: Frontend should not import @mastra/client-js', async () => {
    // Check if any frontend files import Mastra client
    const { stdout } = await execAsync(
      'grep -r "@mastra/client-js" app/src/'
    );

    expect(stdout).toBe(''); // Should be no matches
  });

  test('TEST-M6-004: Frontend should only use apiClient', async () => {
    // Check that all API calls go through apiClient
    const { stdout } = await execAsync(
      'grep -r "mastraClient" app/src/'
    );

    expect(stdout).toBe(''); // Should be no old mastraClient usage
  });
});
```

### Running M6 Tests

```bash
# E2E tests
npm run test:m6:e2e

# Dependency audit
npm run test:m6:deps

# All M6 tests
npm run test:m6
```

---

## Phase M7: Testing & Validation

**Testing Tool**: Mix of Jest (backend) and Playwright (frontend E2E)

### What to Test

✅ All PRD test IDs implemented
✅ Requirements Traceability Matrix satisfied
✅ Performance metrics met
✅ Content quality validation

### Test Structure

```
tests/
├── prd/
│   ├── TEST-001-brand-creation.test.ts          # (Jest - backend)
│   ├── TEST-002-persona-extraction.test.ts      # (Jest - backend)
│   ├── TEST-006-card-generation.test.ts         # (Jest - workflow)
│   ├── TEST-012-view-count.test.ts              # (Playwright - frontend)
│   ├── TEST-101-usability.spec.ts               # (Playwright - E2E)
│   ├── TEST-102-api-performance.test.ts         # (Jest - API)
│   ├── TEST-103-gallery-performance.spec.ts     # (Playwright - frontend)
│   ├── TEST-104-workflow-reliability.test.ts    # (Jest - workflows)
│   ├── TEST-201-api-contracts.test.ts           # (Jest - API)
│   ├── TEST-301-data-integrity.test.ts          # (Jest - DB)
│   ├── TEST-302-query-content.test.ts           # (Jest - agents)
│   ├── TEST-303-image-urls.test.ts              # (Jest - workflow)
│   ├── TEST-304-response-content.test.ts        # (Jest - agents)
│   ├── TEST-305-influencer-diversity.test.ts    # (Jest - DB)
│   ├── TEST-306-safety-validation.test.ts       # (Jest - agent)
│   ├── TEST-401-image-briefs.test.ts            # (Jest - agent)
│   ├── TEST-501-flux-tool.test.ts               # (Jest - tool)
│   └── TEST-502-flux-errors.test.ts             # (Jest - tool)
└── rtm-validation.test.ts                       # (Jest - meta)
```

### RTM Validation Test

```typescript
import { describe, test, expect } from '@jest/globals';
import { getAllTests } from '../helpers/test-registry';
import { RTM } from '../../../plans/rtm-mapping.json';

describe('Requirements Traceability Matrix', () => {
  test('TEST-M7-001: All requirements have test coverage', () => {
    const allTests = getAllTests();
    const reqsWithTests = new Set();

    // Map tests to requirements
    RTM.forEach(mapping => {
      reqsWithTests.add(mapping.reqId);
    });

    // Check all REQ-### have tests
    const allReqs = [
      ...Array.from({ length: 20 }, (_, i) => `REQ-${String(i + 1).padStart(3, '0')}`),
      ...Array.from({ length: 8 }, (_, i) => `REQ-${String(i + 101).padStart(3, '0')}`),
      // ... etc
    ];

    const missingTests = allReqs.filter(req => !reqsWithTests.has(req));

    expect(missingTests).toEqual([]);
  });

  test('TEST-M7-002: All PRD test IDs are implemented', () => {
    const expectedTests = [
      'TEST-001', 'TEST-002', 'TEST-006', 'TEST-012',
      'TEST-101', 'TEST-102', 'TEST-103', 'TEST-104',
      'TEST-201', 'TEST-210',
      'TEST-301', 'TEST-302', 'TEST-303', 'TEST-304', 'TEST-305', 'TEST-306',
      'TEST-401',
      'TEST-501', 'TEST-502',
      'TEST-111',
    ];

    const implementedTests = getAllTests();
    const missing = expectedTests.filter(t => !implementedTests.includes(t));

    expect(missing).toEqual([]);
  });
});
```

### Running M7 Tests

```bash
# Run all PRD tests
npm run test:prd

# Run RTM validation
npm run test:rtm

# Generate coverage report
npm run test:coverage
```

### Exit Criteria Validation

```bash
npm run validate:m7
```

---

## Summary: Test Scripts Configuration

Add these to `package.json`:

```json
{
  "scripts": {
    // Core test runners
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",  // Keep existing Playwright tests

    // Phase M1: Database (Jest)
    "test:m1": "jest tests/unit/db",
    "test:m1:unit": "jest tests/unit/db",
    "validate:m1": "tsx scripts/validate-m1.ts",

    // Phase M2: Tools (Jest with mocks)
    "test:m2": "npm run test:m2:unit && npm run test:m2:integration",
    "test:m2:unit": "jest tests/unit/tools",
    "test:m2:integration": "jest tests/integration/tools",
    "validate:m2": "tsx scripts/validate-m2.ts",

    // Phase M3: Agents (Jest with mocked LLMs)
    "test:m3": "jest tests/unit/agents",
    "validate:m3": "tsx scripts/validate-m3.ts",

    // Phase M4: Workflows (Jest)
    "test:m4": "npm run test:m4:integration && npm run test:m4:e2e",
    "test:m4:integration": "jest tests/integration/workflows",
    "test:m4:e2e": "jest tests/e2e/workflows",
    "validate:m4": "tsx scripts/validate-m4.ts",

    // Phase M5: REST API (Supertest + Jest)
    "test:m5": "npm run test:m5:api && npm run test:m5:perf",
    "test:m5:api": "jest tests/api",
    "test:m5:perf": "jest tests/api/performance",
    "validate:m5": "tsx scripts/validate-m5.ts",

    // Phase M6: Frontend Migration (Playwright + Jest)
    "test:m6": "npm run test:m6:e2e && npm run test:m6:deps",
    "test:m6:e2e": "playwright test tests/e2e/frontend",
    "test:m6:deps": "jest tests/integration/frontend-deps",
    "validate:m6": "tsx scripts/validate-m6.ts",

    // Phase M7: PRD Validation (Jest + Playwright)
    "test:m7": "npm run test:prd && npm run test:rtm",
    "test:prd": "jest tests/prd/*.test.ts && playwright test tests/prd/*.spec.ts",
    "test:rtm": "jest tests/rtm-validation.test.ts",
    "validate:m7": "tsx scripts/validate-m7.ts",

    // Coverage and all tests
    "test:coverage": "jest --coverage",
    "test:all": "npm run test:m1 && npm run test:m2 && npm run test:m3 && npm run test:m4 && npm run test:m5 && npm run test:m6 && npm run test:m7"
  }
}
```

**Note**: Jest handles `.test.ts` files, Playwright handles `.spec.ts` files

---

## Test Progression Workflow

```bash
# Phase M1
npm run test:m1        # Run M1 tests
npm run validate:m1    # Validate exit criteria
git tag -a m1-database -m "Phase M1 complete"

# Phase M2
npm run test:m2        # Run M2 tests
npm run validate:m2    # Validate exit criteria
git tag -a m2-tools -m "Phase M2 complete"

# Phase M3
npm run test:m3        # Run M3 tests
npm run validate:m3    # Validate exit criteria
git tag -a m3-agents -m "Phase M3 complete"

# ... and so on for M4-M7
```

---

**Document Status**: ✅ Ready for Implementation
**Next**: Begin Phase M1 with `npm run validate:m1`
