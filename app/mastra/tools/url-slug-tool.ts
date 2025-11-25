import { createTool } from '@mastra/core';
import { z } from 'zod';
import { brandsRepo } from '../db/repositories';

/**
 * UrlSlugTool - Generates unique URL slugs for brands
 * Ensures slug uniqueness in database
 * REQ-101: Brands must have unique URL slugs
 */

export const urlSlugTool = createTool({
  id: 'url-slug',
  description: 'Generate unique URL-safe slugs for brands',
  inputSchema: z.object({
    text: z.string().describe('Text to convert to slug (typically brand name)'),
    maxLength: z.number().optional().default(50).describe('Maximum slug length'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    slug: z.string().optional(),
    isUnique: z.boolean().optional(),
    error: z.string().optional(),
  }),
  execute: async (input: any) => {
    // Support both direct input (matching inputSchema) and
    // Mastra tool context shape ({ context: ... })
    const context = input && typeof input === 'object' && 'context' in input
      ? (input as any).context
      : input;

    const { text, maxLength = 50 } = context;

    try {
      // Generate base slug
      let slug = text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
        .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

      // Truncate to max length
      if (slug.length > maxLength) {
        slug = slug.substring(0, maxLength);
        // Remove trailing hyphen if truncation created one
        slug = slug.replace(/-+$/, '');
      }

      // Check uniqueness
      const isUnique = await brandsRepo.isSlugAvailable(slug);

      // If not unique, append a number
      if (!isUnique) {
        let counter = 1;
        let uniqueSlug = `${slug}-${counter}`;

        while (!(await brandsRepo.isSlugAvailable(uniqueSlug))) {
          counter++;
          uniqueSlug = `${slug}-${counter}`;

          // Safety limit
          if (counter > 1000) {
            return {
              success: false,
              error: 'Could not generate unique slug after 1000 attempts',
            };
          }
        }

        slug = uniqueSlug;
      }

      return {
        success: true,
        slug,
        isUnique: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
