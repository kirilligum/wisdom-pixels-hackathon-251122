import { describe, test, expect } from '@jest/globals';
import { brandOnboardingWorkflow } from '../../../mastra/workflows/brand-onboarding-workflow';
import { cardGenerationWorkflow } from '../../../mastra/workflows/card-generation-workflow';
import { publishingWorkflow } from '../../../mastra/workflows/publishing-workflow';

/**
 * Phase M4: Workflow Tests
 *
 * Tests for 3 orchestrated workflows
 */

describe('Phase M4: Orchestrated Workflows', () => {
  describe('BrandOnboardingWorkflow', () => {
    test('TEST-M4-101: Should have correct configuration', () => {
      expect(brandOnboardingWorkflow.id).toBe('brand-onboarding-workflow');
      expect(brandOnboardingWorkflow.inputSchema).toBeDefined();
      expect(brandOnboardingWorkflow.outputSchema).toBeDefined();
    });

    test('TEST-M4-102: Should validate input schema', () => {
      const validInput = {
        brandName: 'TestBrand',
        domain: 'Test Domain',
        contentSources: ['https://test.com'],
      };

      const result = brandOnboardingWorkflow.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('TEST-M4-103: Should validate output schema', () => {
      const validOutput = {
        brandId: 'test-id',
        personaCount: 3,
        environmentCount: 3,
        message: 'Success',
      };

      const result = brandOnboardingWorkflow.outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('TEST-M4-104: Should have default empty contentSources', () => {
      const input = {
        brandName: 'TestBrand',
        domain: 'Test Domain',
      };

      const result = brandOnboardingWorkflow.inputSchema.parse(input);
      expect(result.contentSources).toEqual([]);
    });
  });

  describe('CardGenerationWorkflow', () => {
    test('TEST-M4-201: Should have correct configuration', () => {
      expect(cardGenerationWorkflow.id).toBe('card-generation-workflow');
      expect(cardGenerationWorkflow.inputSchema).toBeDefined();
      expect(cardGenerationWorkflow.outputSchema).toBeDefined();
    });

    test('TEST-M4-202: Should validate input schema', () => {
      const validInput = {
        brandId: 'test-brand-id',
      };

      const result = cardGenerationWorkflow.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('TEST-M4-203: Should validate output schema', () => {
      const validOutput = {
        cardIds: ['card-1', 'card-2'],
        totalGenerated: 2,
        totalSkipped: 1,
        message: 'Generated 2 cards',
      };

      const result = cardGenerationWorkflow.outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('TEST-M4-204: Should require brandId in input', () => {
      const invalidInput = {};

      const result = cardGenerationWorkflow.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('PublishingWorkflow', () => {
    test('TEST-M4-301: Should have correct configuration', () => {
      expect(publishingWorkflow.id).toBe('publishing-workflow');
      expect(publishingWorkflow.inputSchema).toBeDefined();
      expect(publishingWorkflow.outputSchema).toBeDefined();
    });

    test('TEST-M4-302: Should validate input schema', () => {
      const validInput = {
        cardIds: ['card-1', 'card-2', 'card-3'],
      };

      const result = publishingWorkflow.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('TEST-M4-303: Should validate output schema', () => {
      const validOutput = {
        publishedCount: 2,
        failedCount: 0,
        invalidCount: 1,
        publishedCardIds: ['card-1', 'card-2'],
        message: 'Published 2 cards',
      };

      const result = publishingWorkflow.outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('TEST-M4-304: Should require cardIds array in input', () => {
      const invalidInput = {
        cardIds: 'not-an-array',
      };

      const result = publishingWorkflow.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('Workflow Integration', () => {
    test('TEST-M4-401: All workflows should be available', () => {
      const workflows = [
        brandOnboardingWorkflow,
        cardGenerationWorkflow,
        publishingWorkflow,
      ];

      workflows.forEach(workflow => {
        expect(workflow).toBeDefined();
        expect(workflow.id).toBeDefined();
        expect(workflow.inputSchema).toBeDefined();
        expect(workflow.outputSchema).toBeDefined();
      });
    });
  });
});
