import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { urlSlugTool } from '../../../mastra/tools/url-slug-tool';
import { setupTestDb, type TestDatabase } from '../../helpers/db-test-helper';
import { executeToolInTest } from '../../helpers/tool-test-helper';

describe('UrlSlugTool - Phase M2', () => {
  let testDb: TestDatabase;

  beforeEach(() => {
    testDb = setupTestDb();
  });

  afterEach(() => {
    if (testDb) {
      testDb.cleanup();
    }
  });

  test('TEST-M2-601: Should generate slug from brand name', async () => {
    const result = await executeToolInTest(urlSlugTool, {
      text: 'FlowForm Project Management',
    });

    expect(result.success).toBe(true);
    expect(result.slug).toBe('flowform-project-management');
    expect(result.isUnique).toBe(true);
  });

  test('TEST-M2-602: Should handle special characters', async () => {
    const result = await executeToolInTest(urlSlugTool, {
      text: 'Brand@Name! With #Special $Characters%',
    });

    expect(result.success).toBe(true);
    expect(result.slug).toBe('brandname-with-special-characters');
  });

  test('TEST-M2-603: Should truncate long slugs', async () => {
    const result = await executeToolInTest(urlSlugTool, {
      text: 'This is a very long brand name that should be truncated to meet the maximum length requirement',
      maxLength: 30,
    });

    expect(result.success).toBe(true);
    expect(result.slug).toBeDefined();
    expect(result.slug!.length).toBeLessThanOrEqual(30);
  });

  test('TEST-M2-604: Should append number for duplicate slugs', async () => {
    // Create brand with 'testbrand' slug
    await testDb.repos.brands.create({
      name: 'Test',
      domain: 'Domain',
      urlSlug: 'testbrand',
      contentSources: [],
    });

    // Try to create same slug
    const result = await executeToolInTest(urlSlugTool, {
      text: 'TestBrand',
    });

    expect(result.success).toBe(true);
    expect(result.slug).toBe('testbrand-1');
    expect(result.isUnique).toBe(true);
  });

  test('TEST-M2-605: Should handle multiple duplicates', async () => {
    // Create brands with 'company' and 'company-1' slugs
    await testDb.repos.brands.create({
      name: 'Company',
      domain: 'Domain',
      urlSlug: 'company',
      contentSources: [],
    });

    await testDb.repos.brands.create({
      name: 'Company 1',
      domain: 'Domain',
      urlSlug: 'company-1',
      contentSources: [],
    });

    // Try to create same slug
    const result = await executeToolInTest(urlSlugTool, {
      text: 'Company',
    });

    expect(result.success).toBe(true);
    expect(result.slug).toBe('company-2');
    expect(result.isUnique).toBe(true);
  });

  test('TEST-M2-606: Should handle empty/whitespace input', async () => {
    const result = await executeToolInTest(urlSlugTool, {
      text: '   ',
    });

    // Should handle gracefully, either returning empty slug or error
    expect(result).toBeDefined();
  });

  test('TEST-M2-607: Should handle unicode characters', async () => {
    const result = await executeToolInTest(urlSlugTool, {
      text: 'Café Müller & Company™',
    });

    expect(result.success).toBe(true);
    expect(result.slug).toBeDefined();
    // Should remove or convert special unicode chars
    expect(result.slug).not.toContain('é');
    expect(result.slug).not.toContain('ü');
  });
});
