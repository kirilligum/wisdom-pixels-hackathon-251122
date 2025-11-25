import { describe, test, expect, beforeEach } from '@jest/globals';

jest.mock('../../../mastra/tools/db-tool', () => ({
  dbTool: {
    execute: jest.fn(),
  },
}));

jest.mock('../../../mastra/agents/card-query-agent', () => ({
  cardQueryAgent: {
    generate: jest.fn().mockResolvedValue({ text: 'Mock question?' }),
  },
}));

jest.mock('../../../mastra/agents/card-answer-agent', () => ({
  cardAnswerAgent: {
    generate: jest.fn().mockResolvedValue({ text: 'Mock answer.' }),
  },
}));

jest.mock('../../../mastra/agents/safety-agent', () => ({
  safetyAgent: {
    generate: jest
      .fn()
      .mockResolvedValue({
        text: JSON.stringify({
          approved: true,
          issues: [],
          recommendation: 'approve',
        }),
      }),
  },
}));

jest.mock('../../../mastra/agents/image-brief-agent', () => ({
  imageBriefAgent: {
    generate: jest.fn().mockResolvedValue({
      text: JSON.stringify({
        prompt: 'Test Nano Banana prompt',
        referenceImageUrls: ['https://example.com/influencer.png'],
        imageSize: 'landscape_4_3',
      }),
    }),
  },
}));

jest.mock('../../../mastra/tools/image-generation-tool', () => ({
  imageGenerationTool: {
    execute: jest.fn(),
  },
}));

import { cardGenerationWorkflow } from '../../../mastra/workflows/card-generation-workflow';
import { dbTool } from '../../../mastra/tools/db-tool';
import { imageGenerationTool } from '../../../mastra/tools/image-generation-tool';

const dbExecuteMock = dbTool.execute as jest.Mock;
const imageExecuteMock = imageGenerationTool.execute as jest.Mock;

describe('CardGenerationWorkflow - image generation integration', () => {
  beforeEach(() => {
    dbExecuteMock.mockReset();
    imageExecuteMock.mockReset();
  });

  test('TEST-M4-105: uses influencer and product images as references', async () => {
    // Mock DB operations used by the workflow
    dbExecuteMock.mockImplementation(async (input: any) => {
      const payload = input && typeof input === 'object' && 'context' in input ? input.context : input;
      switch (payload.operation) {
        case 'getBrand':
          return {
            success: true,
            data: {
              brandId: 'brand-1',
              name: 'Test Brand',
              domain: 'test.example',
              description: 'Test brand',
              urlSlug: 'test-brand',
              contentSources: [],
              productImages: ['https://example.com/product.png'],
            },
          };
        case 'getPersonasByBrand':
          return {
            success: true,
            data: [
              {
                personaId: 'persona-1',
                brandId: 'brand-1',
                label: 'Test Persona',
                description: 'Persona description',
                tags: [],
              },
            ],
          };
        case 'getEnvironmentsByBrand':
          return {
            success: true,
            data: [
              {
                environmentId: 'env-1',
                brandId: 'brand-1',
                label: 'Home Gym',
                description: 'Home gym environment',
                tags: [],
              },
            ],
          };
        case 'getEnabledInfluencers':
          // Simulate no enabled influencers so workflow falls back to all influencers
          return {
            success: true,
            data: [],
          };
        case 'getInfluencers':
          return {
            success: true,
            data: [
              {
                influencerId: 'inf-1',
                name: 'Test Influencer',
                bio: 'Test bio',
                domain: 'Fitness',
                imageUrl: 'https://example.com/headshot.png',
                actionImageUrls: [],
                enabled: true,
                createdAt: new Date(),
              },
            ],
          };
        case 'createCard':
          return {
            success: true,
            data: {
              cardId: 'card-1',
            },
          };
        default:
          throw new Error(`Unexpected dbTool operation in test: ${payload.operation}`);
      }
    });

    imageExecuteMock.mockResolvedValue({
      success: true,
      imageUrl: 'https://example.com/generated.png',
    });

    const run = await cardGenerationWorkflow.createRunAsync();
    const result = await run.start({ inputData: { brandId: 'brand-1' } });

    const status: any = result.status;
    expect(status === 'success' || status === 'succeeded').toBe(true);
    const output: any = result as any;
    expect(output.result.totalGenerated).toBe(1);
    expect(output.result.totalSkipped).toBe(0);

    expect(imageExecuteMock).toHaveBeenCalledTimes(1);
    const callArg = imageExecuteMock.mock.calls[0][0];

    expect(callArg.prompt).toBe('Test Nano Banana prompt');
    expect(callArg.referenceImageUrls).toEqual([
      'https://example.com/influencer.png',
      'https://example.com/product.png',
    ]);
    expect(callArg.imageSize).toBe('landscape_4_3');
  });
});
