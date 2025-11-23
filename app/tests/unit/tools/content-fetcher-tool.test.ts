import { describe, test, expect } from '@jest/globals';
import { contentFetcherTool } from '../../../mastra/tools/content-fetcher-tool';
import { executeToolInTest } from '../../helpers/tool-test-helper';

describe('ContentFetcherTool - Phase M2', () => {
  test('TEST-M2-701: Should have correct schema', () => {
    expect(contentFetcherTool.id).toBe('content-fetcher');
    expect(contentFetcherTool.description).toBeDefined();
    expect(contentFetcherTool.inputSchema).toBeDefined();
    expect(contentFetcherTool.outputSchema).toBeDefined();
  });

  test('TEST-M2-702: Should reject invalid URL', async () => {
    const result = await executeToolInTest(contentFetcherTool, {
      url: 'not-a-valid-url',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // Note: Full integration tests with real HTTP calls should be in tests/integration/tools
});
