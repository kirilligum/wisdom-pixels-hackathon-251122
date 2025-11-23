import { Agent } from '@mastra/core';
import { contentFetcherTool } from '../tools/content-fetcher-tool';
import { dbTool } from '../tools/db-tool';
import { z } from 'zod';

/**
 * ContentAnalysisAgent - Analyzes brand content to extract personas and environments
 *
 * Responsibilities:
 * - Fetch content from brand URLs
 * - Extract 3+ customer personas with descriptions
 * - Extract 3+ environments/settings with descriptions
 * - Save extracted data to database
 *
 * REQ-001: System shall extract brand schema from content sources
 * REQ-102: System shall extract 3+ personas per brand
 * REQ-103: System shall extract 3+ environments per brand
 */

export const contentAnalysisAgent = new Agent({
  name: 'ContentAnalysisAgent',
  instructions: `You are a brand content analysis expert. Your job is to analyze brand websites and marketing materials to extract:

1. **Customer Personas** (minimum 3):
   - Label: A short descriptive name (e.g., "Busy Project Manager", "Remote Team Lead")
   - Description: Detailed profile (pain points, goals, context)
   - Tags: 3-5 relevant keywords

2. **Environments/Settings** (minimum 3):
   - Label: Location name (e.g., "Modern Office", "Home Workspace")
   - Description: Physical setting details
   - Tags: 3-5 descriptive keywords

**Analysis Guidelines**:
- Look for pain points, use cases, testimonials, case studies
- Identify common customer profiles from messaging
- Extract settings where product/service is used
- Be specific and actionable (not generic)
- Use brand's actual domain/industry terminology

**Output Format**:
Always respond with valid JSON:
{
  "personas": [
    {
      "label": "Professional Title/Role",
      "description": "Detailed profile with pain points and goals",
      "tags": ["keyword1", "keyword2", "keyword3"]
    }
  ],
  "environments": [
    {
      "label": "Setting Name",
      "description": "Physical environment details",
      "tags": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}`,

  model: process.env.OPENAI_API_KEY
    ? "openai/gpt-5-nano-2025-08-07"
    : "anthropic/claude-haiku-4-5",

  tools: {
    contentFetcher: contentFetcherTool,
    db: dbTool,
  },
});
