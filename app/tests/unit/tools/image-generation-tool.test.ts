import { describe, test, expect } from '@jest/globals';
import { imageGenerationTool } from '../../../mastra/tools/image-generation-tool';
import { executeToolInTest } from '../../helpers/tool-test-helper';

describe('ImageGenerationTool - Phase M2', () => {
  test('TEST-M2-801: Should have correct schema', () => {
    expect(imageGenerationTool.id).toBe('image-generation');
    expect(imageGenerationTool.description).toBeDefined();
    expect(imageGenerationTool.description).toContain('alpha-image-232/edit-image');
    expect(imageGenerationTool.inputSchema).toBeDefined();
    expect(imageGenerationTool.outputSchema).toBeDefined();
  });

  test('TEST-M2-802: Should require FAL_KEY environment variable', async () => {
    // Save original FAL_KEY
    const originalKey = process.env.FAL_KEY;
    delete process.env.FAL_KEY;

    const result = await executeToolInTest(imageGenerationTool, {
      prompt: 'Test image',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('FAL_KEY');

    // Restore FAL_KEY
    if (originalKey) {
      process.env.FAL_KEY = originalKey;
    }
  });

  test('TEST-M2-803: Should accept reference image URLs', async () => {
    // This test verifies the schema accepts referenceImageUrls
    const context = {
      prompt: 'Professional photo',
      referenceImageUrls: ['https://example.com/photo.jpg'],
      imageSize: 'landscape_4_3' as const,
    };

    // Input schema should validate this
    const parsed = imageGenerationTool.inputSchema.safeParse(context);
    expect(parsed.success).toBe(true);
  });

  // Note: Full integration tests with real fal.ai API calls should be in tests/integration/tools
  // These would require FAL_KEY to be set and would actually call the API
});
