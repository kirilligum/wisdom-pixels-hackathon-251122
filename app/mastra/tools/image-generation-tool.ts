import { createTool } from '@mastra/core';
import { z } from 'zod';

/**
 * ImageGenerationTool - Generates images using fal-ai/nano-banana-pro models
 * Uses:
 *   - fal-ai/nano-banana-pro         for text-to-image
 *   - fal-ai/nano-banana-pro/edit    for image-to-image with reference images
 *
 * REQ-305: All cards must have non-empty imageUrl from the image generator
 * REQ-209: Calls fal.subscribe with Nano Banana Pro endpoints
 */

export const imageGenerationTool = createTool({
  id: 'image-generation',
  description:
    'Generate branded product images using fal-ai/nano-banana-pro (text) and fal-ai/nano-banana-pro/edit (image edit) with optional reference images',
  inputSchema: z.object({
    prompt: z.string().describe('Detailed image generation prompt'),
    referenceImageUrls: z
      .array(z.string().url())
      .optional()
      .describe('Reference images for consistent appearance (e.g., influencer photos)'),
    imageSize: z
      .enum(['square', 'square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'])
      .optional()
      .default('landscape_4_3')
      .describe('Logical size hint mapped to Nano Banana aspect_ratio'),
    numInferenceSteps: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .default(28)
      .describe('Kept for backward compatibility; not used by Nano Banana Pro'),
    guidanceScale: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .default(3.5)
      .describe('Kept for backward compatibility; not used by Nano Banana Pro'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    imageUrl: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    contentType: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async (input: any) => {
    // Support both direct input (matching inputSchema) and
    // Mastra tool context shape ({ context: ... })
    const context = input && typeof input === 'object' && 'context' in input
      ? (input as any).context
      : input;

    const {
      prompt,
      referenceImageUrls = [],
      imageSize = 'landscape_4_3',
      // numInferenceSteps and guidanceScale are accepted but not forwarded to Nano Banana Pro
    } = context;

    try {
      const falKey = process.env.FAL_KEY || process.env.FALAI_API_KEY;
      if (!falKey) {
        return {
          success: false,
          error:
            'FAL_KEY or FALAI_API_KEY environment variable is not set. Please configure your fal.ai API key.',
        };
      }

      const { fal } = await import('@fal-ai/client');
      fal.config({ credentials: falKey });

      const aspectRatio = (() => {
        switch (imageSize) {
          case 'square':
          case 'square_hd':
            return '1:1';
          case 'portrait_4_3':
            return '3:4';
          case 'portrait_16_9':
            return '9:16';
          case 'landscape_4_3':
            return '4:3';
          case 'landscape_16_9':
          default:
            return '16:9';
        }
      })();

      const input: any = {
        prompt,
        num_images: 1,
        aspect_ratio: aspectRatio,
        output_format: 'png',
        resolution: '1K',
      };

      const hasReferenceImages = referenceImageUrls.length > 0;
      const endpoint = hasReferenceImages ? 'fal-ai/nano-banana-pro/edit' : 'fal-ai/nano-banana-pro';

      if (hasReferenceImages) {
        input.image_urls = referenceImageUrls;
      }

      const result: any = await fal.subscribe(endpoint, {
        input,
        logs: false,
      });

      if (result?.data?.images && result.data.images.length > 0) {
        const image = result.data.images[0];
        return {
          success: true,
          imageUrl: image.url,
          // Nano Banana Pro response schema includes file_name/content_type; width/height may be undefined
          width: image.width,
          height: image.height,
          contentType: image.content_type,
        };
      }

      return {
        success: false,
        error: 'No image generated. Nano Banana Pro returned an empty result.',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
