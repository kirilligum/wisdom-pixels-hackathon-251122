import { createTool } from '@mastra/core';
import { z } from 'zod';

/**
 * ContentFetcherTool - Fetches content from URLs
 * Used by ContentAnalysisAgent to extract brand information
 * REQ-001: Extract brand schema from content sources
 */

export const contentFetcherTool = createTool({
  id: 'content-fetcher',
  description: 'Fetch HTML content from URLs for analysis',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to fetch content from'),
    maxLength: z.number().optional().describe('Maximum content length in characters (default: 50000)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    url: z.string(),
    content: z.string().optional(),
    contentLength: z.number().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { url, maxLength = 50000 } = context;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WisdomPixels-Bot/1.0 (Content Extraction)',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        return {
          success: false,
          url,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        return {
          success: false,
          url,
          error: `Unsupported content type: ${contentType}`,
        };
      }

      let content = await response.text();

      // Strip HTML tags for simplicity (in production, use a proper HTML parser)
      content = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Limit content length
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...';
      }

      return {
        success: true,
        url,
        content,
        contentLength: content.length,
      };
    } catch (error) {
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
