import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { dbTool } from '../../../mastra/tools/db-tool';
import { setupTestDb, type TestDatabase } from '../../helpers/db-test-helper';
import { executeToolInTest } from '../../helpers/tool-test-helper';

describe('DbTool - Phase M2', () => {
  let testDb: TestDatabase;

  beforeEach(() => {
    testDb = setupTestDb();
  });

  afterEach(() => {
    if (testDb) {
      testDb.cleanup();
    }
  });

  describe('Brand Operations', () => {
    test('TEST-M2-101: Should create brand via tool', async () => {
      const result = await executeToolInTest(dbTool, {
        operation: 'createBrand',
      params: {
          name: 'TestBrand',
          domain: 'Test Domain',
          urlSlug: 'testbrand',
          contentSources: ['https://test.com'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('TestBrand');
      expect(result.data?.brandId).toBeDefined();
    });

    test('TEST-M2-102: Should get brand by slug', async () => {
      // Create brand first
      await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Domain',
        urlSlug: 'unique-slug',
        contentSources: [],
      });

      const result = await executeToolInTest(dbTool, {
        operation: 'getBrandBySlug',
      params: { urlSlug: 'unique-slug' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.urlSlug).toBe('unique-slug');
    });
  });

  describe('Persona Operations', () => {
    test('TEST-M2-201: Should create persona via tool', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Domain',
        urlSlug: 'test',
        contentSources: [],
      });

      const result = await executeToolInTest(dbTool, {
    operation: 'createPersona',
      params: {
            brandId: brand.brandId,
            label: 'Test Persona',
            description: 'Description',
            tags: ['tag1'],
          },
      });

      expect(result.success).toBe(true);
      expect(result.data?.label).toBe('Test Persona');
    });

    test('TEST-M2-202: Should get personas by brand', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Domain',
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

      const result = await executeToolInTest(dbTool, {
    operation: 'getPersonasByBrand',
      params: { brandId: brand.brandId }
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Card Operations', () => {
    test('TEST-M2-301: Should create card via tool', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Domain',
        urlSlug: 'test',
        contentSources: [],
      });

      const influencer = await testDb.repos.influencers.create({
        name: 'Test Influencer',
        bio: 'Bio',
        domain: 'Domain',
        imageUrl: 'url',
      });

      const result = await executeToolInTest(dbTool, {
    operation: 'createCard',
      params: {
            brandId: brand.brandId,
            influencerId: influencer.influencerId,
            query: 'Test question?',
            response: 'Test answer',
            imageUrl: 'https://example.com/image.jpg',
            imageBrief: 'Image description',
          },
      });

      expect(result.success).toBe(true);
      expect(result.data?.query).toBe('Test question?');
      expect(result.data?.status).toBe('draft');
    });

    test('TEST-M2-302: Should publish card via tool', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Domain',
        urlSlug: 'test',
        contentSources: [],
      });

      const influencer = await testDb.repos.influencers.create({
        name: 'Test',
        bio: 'Bio',
        domain: 'Domain',
        imageUrl: 'url',
      });

      const card = await testDb.repos.cards.create({
        brandId: brand.brandId,
        influencerId: influencer.influencerId,
        query: 'Q',
        response: 'A',
        imageUrl: 'url',
        imageBrief: 'brief',
      });

      const result = await executeToolInTest(dbTool, {
    operation: 'publishCard',
      params: { cardId: card.cardId }
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('published');
      expect(result.data?.publishedAt).toBeDefined();
    });
  });

  describe('Workflow Run Operations', () => {
    test('TEST-M2-401: Should create workflow run via tool', async () => {
      const brand = await testDb.repos.brands.create({
        name: 'Test',
        domain: 'Domain',
        urlSlug: 'test',
        contentSources: [],
      });

      const result = await executeToolInTest(dbTool, {
    operation: 'createWorkflowRun',
      params: {
            workflowName: 'TestWorkflow',
            brandId: brand.brandId,
            input: { test: 'data' },
          },
      });

      expect(result.success).toBe(true);
      expect(result.data?.workflowName).toBe('TestWorkflow');
      expect(result.data?.status).toBe('running');
    });

    test('TEST-M2-402: Should complete workflow run via tool', async () => {
      const run = await testDb.repos.workflowRuns.create({
        workflowName: 'Test',
        status: 'running',
      });

      const result = await executeToolInTest(dbTool, {
    operation: 'completeWorkflowRun',
      params: {
            runId: run.runId,
            output: { result: 'success' },
          },
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('completed');
    });
  });

  describe('Error Handling', () => {
    test('TEST-M2-501: Should handle unknown operation', async () => {
      const result = await executeToolInTest(dbTool, {
    operation: 'unknownOp' as any,
          params: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown operation');
    });

    test('TEST-M2-502: Should handle missing brand ID', async () => {
      const result = await executeToolInTest(dbTool, {
    operation: 'getBrand',
      params: { brandId: 'nonexistent' }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });
});
