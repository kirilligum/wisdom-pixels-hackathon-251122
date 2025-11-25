import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupTestDb, createTestBrand, type TestDatabase } from '../../helpers/db-test-helper';

describe('Repositories - Phase M1', () => {
  let testDb: TestDatabase;

  beforeEach(() => {
    testDb = setupTestDb();
  });

  afterEach(() => {
    if (testDb) {
      testDb.cleanup();
    }
  });

  describe('BrandsRepository', () => {
    test('TEST-M1-101: Should create a brand with auto-generated ID', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'TestBrand',
        domain: 'Test Domain',
        urlSlug: 'testbrand',
        contentSources: ['https://test.com'],
      });

      expect(brand.brandId).toBeDefined();
      expect(brand.name).toBe('TestBrand');
      expect(brand.urlSlug).toBe('testbrand');
      expect(brand.createdAt).toBeDefined();
    });

    test('TEST-M1-102: Should find brand by ID', async () => {
      const created = await testDb.repos.brands.create({
        name: 'TestBrand',
        domain: 'Test',
        urlSlug: 'test',
        contentSources: [],
      });

      const found = await testDb.repos.brands.findById(created.brandId);
      expect(found).toBeDefined();
      expect(found?.brandId).toBe(created.brandId);
    });

    test('TEST-M1-103: Should find brand by slug', async () => {
      await testDb.repos.brands.create({
        name: 'TestBrand',
        domain: 'Test',
        urlSlug: 'unique-slug',
        contentSources: [],
      });

      const found = await testDb.repos.brands.findBySlug('unique-slug');
      expect(found).toBeDefined();
      expect(found?.urlSlug).toBe('unique-slug');
    });

    test('TEST-M1-104: Should update brand', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Original',
        domain: 'Test',
        urlSlug: 'test',
        contentSources: [],
      });

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 5));

      const updated = await testDb.repos.brands.update(brand.brandId, {
        name: 'Updated',
      });

      expect(updated?.name).toBe('Updated');
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(brand.createdAt.getTime());
    });

    test('TEST-M1-105: Should delete brand and cascade to related entities', async () => {
      const { brand, persona } = await createTestBrand(testDb.repos);

      await testDb.repos.brands.delete(brand.brandId);

      const foundBrand = await testDb.repos.brands.findById(brand.brandId);
      const foundPersona = await testDb.repos.personas.findById(persona.personaId);

      expect(foundBrand).toBeUndefined();
      expect(foundPersona).toBeUndefined(); // Should cascade delete
    });
  });

  describe('PersonasRepository', () => {
    test('TEST-M1-201: Should create persona linked to brand', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Test',
        urlSlug: 'test',
        contentSources: [],
      });

      const persona = await testDb.repos.personas.create({
        brandId: brand.brandId,
        label: 'Test Persona',
        description: 'Description',
        tags: ['tag1', 'tag2'],
      });

      expect(persona.personaId).toBeDefined();
      expect(persona.brandId).toBe(brand.brandId);
      expect(persona.tags).toEqual(['tag1', 'tag2']);
    });

    test('TEST-M1-202: Should find personas by brand ID', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Test',
        urlSlug: 'test',
        contentSources: [],
      });

      await testDb.repos.personas.create({
        brandId: brand.brandId,
        label: 'Persona 1',
        description: 'Desc',
        tags: [],
      });

      await testDb.repos.personas.create({
        brandId: brand.brandId,
        label: 'Persona 2',
        description: 'Desc',
        tags: [],
      });

      const personas = await testDb.repos.personas.findByBrandId(brand.brandId);
      expect(personas.length).toBe(2);
    });
  });

  describe('EnvironmentsRepository', () => {
    test('TEST-M1-301: Should create environment linked to brand', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Test',
        urlSlug: 'test',
        contentSources: [],
      });

      const environment = await testDb.repos.environments.create({
        brandId: brand.brandId,
        label: 'Office',
        description: 'Modern office',
        tags: ['professional'],
      });

      expect(environment.environmentId).toBeDefined();
      expect(environment.brandId).toBe(brand.brandId);
    });

    test('TEST-M1-302: Should find environments by brand ID', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Test',
        urlSlug: 'test',
        contentSources: [],
      });

      await testDb.repos.environments.create({
        brandId: brand.brandId,
        label: 'Env 1',
        description: 'Desc',
        tags: [],
      });

      const environments = await testDb.repos.environments.findByBrandId(brand.brandId);
      expect(environments.length).toBe(1);
    });
  });

  describe('InfluencersRepository', () => {
    test('TEST-M1-401: Should create influencer with default enabled=true', async () => {
      const influencer = await testDb.repos.influencers.create({
        name: 'John Doe',
        bio: 'Expert',
        domain: 'Tech',
        imageUrl: 'https://example.com/photo.jpg',
      });

      expect(influencer.influencerId).toBeDefined();
      expect(influencer.enabled).toBe(true);
    });

    test('TEST-M1-402: Should find only enabled influencers', async () => {
      await testDb.repos.influencers.create({
        name: 'Enabled',
        bio: 'Bio',
        domain: 'Domain',
        imageUrl: 'url',
        enabled: true,
      });

      await testDb.repos.influencers.create({
        name: 'Disabled',
        bio: 'Bio',
        domain: 'Domain',
        imageUrl: 'url',
        enabled: false,
      });

      const enabled = await testDb.repos.influencers.findEnabled();
      expect(enabled.length).toBe(1);
      expect(enabled[0].name).toBe('Enabled');
    });

    test('TEST-M1-403: Should toggle influencer enabled status', async () => {
      const influencer = await testDb.repos.influencers.create({
        name: 'Test',
        bio: 'Bio',
        domain: 'Domain',
        imageUrl: 'url',
        enabled: true,
      });

      const toggled = await testDb.repos.influencers.toggleEnabled(influencer.influencerId);
      expect(toggled?.enabled).toBe(false);

      const toggledAgain = await testDb.repos.influencers.toggleEnabled(influencer.influencerId);
      expect(toggledAgain?.enabled).toBe(true);
    });
  });

  describe('CardsRepository', () => {
    test('TEST-M1-501: Should create card with all relationships', async () => {
      const { brand, persona, environment, influencer } = await createTestBrand(testDb.repos);

      const card = await testDb.repos.cards.create({
        brandId: brand.brandId,
        influencerId: influencer.influencerId,
        personaId: persona.personaId,
        environmentId: environment.environmentId,
        query: 'Test question?',
        response: 'Test answer',
        imageUrl: 'https://example.com/image.jpg',
        imageBrief: 'Image description',
      });

      expect(card.cardId).toBeDefined();
      expect(card.status).toBe('draft');
      expect(card.viewCount).toBe(0);
      expect(card.shareCount).toBe(0);
    });

    test('TEST-M1-502: Should publish card', async () => {
      const { brand, influencer } = await createTestBrand(testDb.repos);

      const card = await testDb.repos.cards.create({
        brandId: brand.brandId,
        influencerId: influencer.influencerId,
        query: 'Q',
        response: 'A',
        imageUrl: 'url',
        imageBrief: 'brief',
      });

      const published = await testDb.repos.cards.publish(card.cardId);
      expect(published?.status).toBe('published');
      expect(published?.publishedAt).toBeDefined();
    });

    test('TEST-M1-503: Should increment view and share counts', async () => {
      const { brand, influencer } = await createTestBrand(testDb.repos);

      const card = await testDb.repos.cards.create({
        brandId: brand.brandId,
        influencerId: influencer.influencerId,
        query: 'Q',
        response: 'A',
        imageUrl: 'url',
        imageBrief: 'brief',
      });

      await testDb.repos.cards.incrementViewCount(card.cardId);
      await testDb.repos.cards.incrementViewCount(card.cardId);
      await testDb.repos.cards.incrementShareCount(card.cardId);

      const updated = await testDb.repos.cards.findById(card.cardId);
      expect(updated?.viewCount).toBe(2);
      expect(updated?.shareCount).toBe(1);
    });

    test('TEST-M1-504: Should find published cards by brand', async () => {
      const { brand, influencer } = await createTestBrand(testDb.repos);

      const draft = await testDb.repos.cards.create({
        brandId: brand.brandId,
        influencerId: influencer.influencerId,
        query: 'Q1',
        response: 'A1',
        imageUrl: 'url',
        imageBrief: 'brief',
        status: 'draft',
      });

      const published = await testDb.repos.cards.create({
        brandId: brand.brandId,
        influencerId: influencer.influencerId,
        query: 'Q2',
        response: 'A2',
        imageUrl: 'url',
        imageBrief: 'brief',
        status: 'published',
        publishedAt: new Date(),
      });

      const publishedCards = await testDb.repos.cards.findPublishedByBrandId(brand.brandId);
      expect(publishedCards.length).toBe(1);
      expect(publishedCards[0].cardId).toBe(published.cardId);
    });
  });

  describe('WorkflowRunsRepository', () => {
    test('TEST-M1-601: Should create workflow run', async () => {
      const run = await testDb.repos.workflowRuns.create({
        workflowName: 'TestWorkflow',
        status: 'running',
        input: { test: 'data' },
      });

      expect(run.runId).toBeDefined();
      expect(run.workflowName).toBe('TestWorkflow');
      expect(run.startedAt).toBeDefined();
    });

    test('TEST-M1-602: Should complete workflow run with duration', async () => {
      const run = await testDb.repos.workflowRuns.create({
        workflowName: 'TestWorkflow',
        status: 'running',
      });

      // Wait a bit to ensure duration > 0
      await new Promise((resolve) => setTimeout(resolve, 10));

      const completed = await testDb.repos.workflowRuns.complete(run.runId, {
        result: 'success',
      });

      expect(completed?.status).toBe('completed');
      expect(completed?.completedAt).toBeDefined();
      expect(completed?.durationMs).toBeGreaterThan(0);
      expect(completed?.output).toEqual({ result: 'success' });
    });

    test('TEST-M1-603: Should mark workflow run as failed', async () => {
      const run = await testDb.repos.workflowRuns.create({
        workflowName: 'TestWorkflow',
        status: 'running',
      });

      const failed = await testDb.repos.workflowRuns.fail(run.runId, 'Test error');

      expect(failed?.status).toBe('failed');
      expect(failed?.error).toBe('Test error');
      expect(failed?.completedAt).toBeDefined();
    });

    test('TEST-M1-604: Should find workflow runs by brand', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Test',
        urlSlug: 'test',
        contentSources: [],
      });

      await testDb.repos.workflowRuns.create({
        workflowName: 'Workflow1',
        brandId: brand.brandId,
        status: 'running',
      });

      await testDb.repos.workflowRuns.create({
        workflowName: 'Workflow2',
        brandId: brand.brandId,
        status: 'completed',
      });

      const runs = await testDb.repos.workflowRuns.findByBrandId(brand.brandId);
      expect(runs.length).toBe(2);
    });
  });
});
