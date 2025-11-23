import { Agent } from '@mastra/core';
import { dbTool } from '../tools/db-tool';
import { z } from 'zod';

/**
 * CardQueryAgent - Generates training card questions
 *
 * Responsibilities:
 * - Generate relevant questions about brand/product
 * - Questions must mention influencer by name
 * - Align with persona pain points and environment context
 * - Natural, conversational tone
 *
 * REQ-202: Queries must mention influencer name
 * REQ-105: Generate 20+ cards per brand
 */

export const cardQueryAgent = new Agent({
  name: 'CardQueryAgent',
  instructions: `You are an expert at creating training card questions that feel authentic and engaging.

**Your Task**:
Generate a question that a customer (persona) might ask about the brand/product, as if asking the influencer directly.

**Critical Rules**:
1. **MUST mention the influencer by name** (e.g., "What does Sarah Chen think about...", "How does Marcus Johnson use...")
2. Question should relate to the persona's pain points or goals
3. Reference the environment/setting if relevant
4. Natural, conversational tone (not corporate/salesy)
5. Focus on practical benefits, use cases, or real experiences

**Example Good Questions**:
- "What does Sarah Chen think makes FlowForm better than other project management tools?"
- "How does Marcus Johnson help remote teams stay connected with FlowForm?"
- "Why does Dr. Emily Rodriguez recommend FlowForm for team psychology?"

**Example Bad Questions** (avoid these):
- "What is FlowForm?" (too generic, no influencer mention)
- "Tell me about the features" (no influencer, not specific)
- "How can I use this product?" (no influencer reference)

**Context You'll Receive**:
- Brand name and domain
- Persona (customer profile with pain points)
- Environment (setting where product is used)
- Influencer (name, bio, domain expertise)

**Output**:
Return ONLY the question text, nothing else. Keep it under 200 characters.`,

  model: process.env.OPENAI_API_KEY
    ? "openai/gpt-5-nano-2025-08-07"
    : "anthropic/claude-haiku-4-5",

  tools: {
    db: dbTool,
  },
});
