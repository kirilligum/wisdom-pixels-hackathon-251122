import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { dbTool } from '../tools/db-tool';

/**
 * PublishingWorkflow - Publishes draft training cards
 *
 * Input: cardIds[]
 * Output: publishedCount, failedCount
 *
 * Steps:
 * 1. Validate all cards exist and are in draft status
 * 2. Publish each card (update status + set publishedAt timestamp)
 * 3. Return success/failure counts
 *
 * REQ-107: Cards can be published
 */

// Step 1: Validate cards
const validateCardsStep = createStep({
  id: 'validate-cards',
  description: 'Validate that all card IDs exist and are in draft status',
  inputSchema: z.object({
    cardIds: z.array(z.string()),
  }),
  outputSchema: z.object({
    validCardIds: z.array(z.string()),
    invalidCardIds: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { cardIds } = inputData;

    const validCardIds: string[] = [];
    const invalidCardIds: string[] = [];

    for (const cardId of cardIds) {
      const result = await dbTool.execute({
        operation: 'getCard',
        params: { cardId },
      });

      if (!result.success || !result.data) {
        invalidCardIds.push(cardId);
        continue;
      }

      // Only allow publishing cards that are in draft status
      if (result.data.status === 'draft') {
        validCardIds.push(cardId);
      } else {
        invalidCardIds.push(cardId);
      }
    }

    return {
      validCardIds,
      invalidCardIds,
    };
  },
});

// Step 2: Publish each card
const publishCardStep = createStep({
  id: 'publish-card',
  description: 'Publish a single card',
  inputSchema: z.string(),
  outputSchema: z.object({
    cardId: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData: cardId }) => {
    const result = await dbTool.execute({
      operation: 'publishCard',
      params: { cardId },
    });

    if (!result.success) {
      return {
        cardId,
        success: false,
        error: result.error || 'Unknown error',
      };
    }

    return {
      cardId,
      success: true,
    };
  },
});

// Step 3: Summarize results
const summarizeResultsStep = createStep({
  id: 'summarize-results',
  description: 'Count published and failed cards',
  inputSchema: z.object({
    publishResults: z.array(z.object({
      cardId: z.string(),
      success: z.boolean(),
      error: z.string().optional(),
    })),
    invalidCardIds: z.array(z.string()),
  }),
  outputSchema: z.object({
    publishedCount: z.number(),
    failedCount: z.number(),
    invalidCount: z.number(),
    publishedCardIds: z.array(z.string()),
    message: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { publishResults, invalidCardIds } = inputData;

    const publishedCardIds = publishResults
      .filter(r => r.success)
      .map(r => r.cardId);

    const failedCount = publishResults.filter(r => !r.success).length;

    return {
      publishedCount: publishedCardIds.length,
      failedCount,
      invalidCount: invalidCardIds.length,
      publishedCardIds,
      message: `Published ${publishedCardIds.length} cards (${failedCount} failed, ${invalidCardIds.length} invalid)`,
    };
  },
});

// Create and export the workflow
export const publishingWorkflow = createWorkflow({
  id: 'publishing-workflow',
  inputSchema: z.object({
    cardIds: z.array(z.string()),
  }),
  outputSchema: z.object({
    publishedCount: z.number(),
    failedCount: z.number(),
    invalidCount: z.number(),
    publishedCardIds: z.array(z.string()),
    message: z.string(),
  }),
})
  // Step 1: Validate cards
  .then(validateCardsStep)
  // Step 2: Publish each valid card
  .map(async ({ inputData }) => {
    return inputData.validCardIds;
  })
  .foreach(publishCardStep, { concurrency: 5 }) // Publish 5 cards at a time
  // Step 3: Summarize results
  .map(async ({ inputData, getStepResult }) => {
    const validateResult = getStepResult(validateCardsStep);
    return {
      publishResults: inputData,
      invalidCardIds: validateResult.invalidCardIds,
    };
  })
  .then(summarizeResultsStep)
  .commit();
