import { describe, test, expect, afterEach } from '@jest/globals';
import { setupTestDb } from '../../helpers/db-test-helper';
import { sql } from 'drizzle-orm';

describe('Database Schema - Phase M1', () => {
  let testDb: ReturnType<typeof setupTestDb>;

  afterEach(() => {
    if (testDb) {
      testDb.cleanup();
    }
  });

  test('TEST-M1-001: All 6 tables should exist', () => {
    testDb = setupTestDb();
    const { sqlite } = testDb;

    // Query SQLite metadata to get table names
    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);

    // Check all 6 tables exist
    expect(tableNames).toContain('brands');
    expect(tableNames).toContain('personas');
    expect(tableNames).toContain('environments');
    expect(tableNames).toContain('influencers');
    expect(tableNames).toContain('cards');
    expect(tableNames).toContain('workflow_runs');
  });

  test('TEST-M1-002: brands table should have correct schema', () => {
    testDb = setupTestDb();
    const { sqlite } = testDb;

    const columns = sqlite.pragma('table_info(brands)') as Array<{
      name: string;
      type: string;
      notnull: number;
    }>;

    const columnNames = columns.map((c) => c.name);

    expect(columnNames).toContain('brand_id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('domain');
    expect(columnNames).toContain('url_slug');
    expect(columnNames).toContain('content_sources');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  test('TEST-M1-003: url_slug should be unique per brand', () => {
    testDb = setupTestDb();
    const { sqlite } = testDb;

    const indexes = sqlite.pragma('index_list(brands)') as Array<{
      name: string;
      unique: number;
    }>;

    const uniqueIndexes = indexes.filter((i) => i.unique === 1);
    expect(uniqueIndexes.length).toBeGreaterThan(0);
    expect(uniqueIndexes.some((i) => i.name.includes('url_slug'))).toBe(true);
  });

  test('TEST-M1-004: Foreign keys should be enforced', () => {
    testDb = setupTestDb();
    const { sqlite } = testDb;

    // Check that foreign keys are enabled
    const fkEnabled = sqlite.pragma('foreign_keys') as Array<{ foreign_keys: number }>;
    expect(fkEnabled[0].foreign_keys).toBe(1);
  });

  test('TEST-M1-005: cards table should have all required foreign keys', () => {
    testDb = setupTestDb();
    const { sqlite } = testDb;

    const fks = sqlite.pragma('foreign_key_list(cards)') as Array<{
      table: string;
      from: string;
      to: string;
    }>;

    const fkTables = fks.map((fk) => fk.table);

    expect(fkTables).toContain('brands');
    expect(fkTables).toContain('influencers');
    expect(fkTables).toContain('personas');
    expect(fkTables).toContain('environments');
  });

  test('TEST-M1-006: workflow_runs table should have brand_id foreign key', () => {
    testDb = setupTestDb();
    const { sqlite } = testDb;

    const fks = sqlite.pragma('foreign_key_list(workflow_runs)') as Array<{
      table: string;
      from: string;
      to: string;
    }>;

    expect(fks.some((fk) => fk.table === 'brands')).toBe(true);
  });

  test('TEST-M1-007: Default values should be set correctly', async () => {
    testDb = setupTestDb();
    const { repos } = testDb;

    const brand = await repos.brands.create({
      name: 'Test Brand',
      domain: 'Test',
      urlSlug: 'test',
      contentSources: [],
    });

    expect(brand.createdAt).toBeDefined();
    expect(brand.updatedAt).toBeDefined();
    expect(brand.contentSources).toEqual([]);
  });
});
