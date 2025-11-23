import { createTool } from '@mastra/core';
import { z } from 'zod';

/**
 * ImageGenerationTool - Generates images using FLUX alpha-image-232/edit-image
 * Supports reference images for consistent influencer appearance
 * REQ-201: All cards must have non-empty imageUrl from FLUX
 * REQ-204: Images should use influencer reference images
 */

export const imageGenerationTool = createTool({
  id: 'image-generation',
  description: 'Generate branded product images using FLUX alpha-image-232/edit-image model with influencer reference images',
  inputSchema: z.object({
    prompt: z.string().describe('Detailed image generation prompt'),
    referenceImageUrls: z.array(z.string().url()).optional().describe('Reference images for consistent appearance (e.g., influencer photos)'),
    imageSize: z.enum(['square', 'square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9']).optional().default('landscape_4_3'),
    numInferenceSteps: z.number().min(1).max(50).optional().default(28),
    guidanceScale: z.number().min(1).max(20).optional().default(3.5),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    imageUrl: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    contentType: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const {
      prompt,
      referenceImageUrls = [],
      imageSize = 'landscape_4_3',
      numInferenceSteps = 28,
      guidanceScale = 3.5,
    } = context;

    try {
      // Check for FAL_KEY or FALAI_API_KEY in environment
      const falKey = process.env.FAL_KEY || process.env.FALAI_API_KEY;
      if (!falKey) {
        return {
          success: false,
          error: 'FAL_KEY or FALAI_API_KEY environment variable is not set. Please configure your fal.ai API key.',
        };
      }

      // Import fal.ai dynamically
      const { fal } = await import('@fal-ai/client');
      fal.config({ credentials: falKey });

      // Prepare input for alpha-image-232/edit-image
      const input: any = {
        prompt,
        image_size: imageSize,
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
        num_images: 1,
        enable_safety_checker: true,
      };

      // Add reference images if provided (key feature of alpha-image-232/edit-image)
      if (referenceImageUrls.length > 0) {
        input.image_urls = referenceImageUrls;
      }

      // Call FLUX alpha-image-232/edit-image model
      const result: any = await fal.subscribe('fal-ai/alpha-image-232/edit-image', {
        input,
        logs: false,
      });

      // Extract generated image
      if (result?.data?.images && result.data.images.length > 0) {
        const image = result.data.images[0];
        return {
          success: true,
          imageUrl: image.url,
          width: image.width,
          height: image.height,
          contentType: image.content_type,
        };
      }

      return {
        success: false,
        error: 'No image generated. FLUX returned empty result.',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
