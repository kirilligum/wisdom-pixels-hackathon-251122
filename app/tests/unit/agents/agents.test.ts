import { describe, test, expect } from '@jest/globals';
import { contentAnalysisAgent } from '../../../mastra/agents/content-analysis-agent';
import { cardQueryAgent } from '../../../mastra/agents/card-query-agent';
import { cardAnswerAgent } from '../../../mastra/agents/card-answer-agent';
import { safetyAgent } from '../../../mastra/agents/safety-agent';
import { imageBriefAgent } from '../../../mastra/agents/image-brief-agent';

/**
 * Phase M3: Agent Tests
 *
 * Tests for 5 specialized agents
 */

describe('Phase M3: Specialized Agents', () => {
  describe('ContentAnalysisAgent', () => {
    test('TEST-M3-101: Should have correct configuration', () => {
      expect(contentAnalysisAgent.name).toBe('ContentAnalysisAgent');
      expect(contentAnalysisAgent.instructions).toContain('personas');
      expect(contentAnalysisAgent.instructions).toContain('environments');
      expect(contentAnalysisAgent.tools).toHaveProperty('contentFetcher');
      expect(contentAnalysisAgent.tools).toHaveProperty('db');
    });

    test('TEST-M3-102: Should use correct model', () => {
      const hasOpenAI = process.env.OPENAI_API_KEY;
      if (hasOpenAI) {
        expect(contentAnalysisAgent.model).toBe('openai/gpt-5-nano-2025-08-07');
      } else {
        expect(contentAnalysisAgent.model).toBe('anthropic/claude-haiku-4-5');
      }
    });

    test('TEST-M3-103: Should have persona extraction instructions', () => {
      expect(contentAnalysisAgent.instructions).toContain('minimum 3');
      expect(contentAnalysisAgent.instructions).toContain('Customer Personas');
    });
  });

  describe('CardQueryAgent', () => {
    test('TEST-M3-201: Should have correct configuration', () => {
      expect(cardQueryAgent.name).toBe('CardQueryAgent');
      expect(cardQueryAgent.instructions).toContain('influencer by name');
      expect(cardQueryAgent.tools).toHaveProperty('db');
    });

    test('TEST-M3-202: Should enforce influencer mention requirement (REQ-202)', () => {
      expect(cardQueryAgent.instructions).toContain('MUST mention the influencer by name');
      expect(cardQueryAgent.instructions).toContain('200 characters');
    });

    test('TEST-M3-203: Should have example questions', () => {
      expect(cardQueryAgent.instructions).toContain('Example Good Questions');
      expect(cardQueryAgent.instructions).toContain('Example Bad Questions');
    });
  });

  describe('CardAnswerAgent', () => {
    test('TEST-M3-301: Should have correct configuration', () => {
      expect(cardAnswerAgent.name).toBe('CardAnswerAgent');
      expect(cardAnswerAgent.instructions).toContain('first person');
      expect(cardAnswerAgent.tools).toHaveProperty('db');
    });

    test('TEST-M3-302: Should enforce brand mention requirement (REQ-204)', () => {
      expect(cardAnswerAgent.instructions).toContain('MUST mention the brand/product by name');
      expect(cardAnswerAgent.instructions).toContain('300 characters');
    });

    test('TEST-M3-303: Should emphasize authentic voice', () => {
      expect(cardAnswerAgent.instructions).toContain('authentic');
      expect(cardAnswerAgent.instructions).toContain('natural');
    });
  });

  describe('SafetyAgent', () => {
    test('TEST-M3-401: Should have correct configuration', () => {
      expect(safetyAgent.name).toBe('SafetyAgent');
      expect(safetyAgent.instructions).toContain('safety');
      expect(safetyAgent.tools).toHaveProperty('db');
    });

    test('TEST-M3-402: Should check for policy violations (REQ-106)', () => {
      expect(safetyAgent.instructions).toContain('Medical/Health Claims');
      expect(safetyAgent.instructions).toContain('Offensive Content');
      expect(safetyAgent.instructions).toContain('Misleading Claims');
    });

    test('TEST-M3-403: Should return structured JSON output', () => {
      expect(safetyAgent.instructions).toContain('approved');
      expect(safetyAgent.instructions).toContain('issues');
      expect(safetyAgent.instructions).toContain('recommendation');
    });
  });

  describe('ImageBriefAgent', () => {
    test('TEST-M3-501: Should have correct configuration', () => {
      expect(imageBriefAgent.name).toBe('ImageBriefAgent');
      expect(imageBriefAgent.instructions).toContain('FLUX');
      expect(imageBriefAgent.tools).toHaveProperty('imageGeneration');
      expect(imageBriefAgent.tools).toHaveProperty('db');
    });

    test('TEST-M3-502: Should require reference images (REQ-109)', () => {
      expect(imageBriefAgent.instructions).toContain('referenceImageUrl');
      // Check for any mention of reference images/photos
      const hasReferenceImageMention =
        imageBriefAgent.instructions.includes('referenceImageUrl') ||
        imageBriefAgent.instructions.toLowerCase().includes('reference');
      expect(hasReferenceImageMention).toBe(true);
    });

    test('TEST-M3-503: Should specify photorealistic style', () => {
      expect(imageBriefAgent.instructions).toContain('photorealistic');
      expect(imageBriefAgent.instructions).toContain('Photorealistic');
    });
  });

  describe('Agent Integration', () => {
    test('TEST-M3-601: All agents should be available', () => {
      const agents = [
        contentAnalysisAgent,
        cardQueryAgent,
        cardAnswerAgent,
        safetyAgent,
        imageBriefAgent,
      ];

      agents.forEach(agent => {
        expect(agent).toBeDefined();
        expect(agent.name).toBeDefined();
        expect(agent.instructions).toBeDefined();
      });
    });

    test('TEST-M3-602: All agents should have model configuration', () => {
      const agents = [
        contentAnalysisAgent,
        cardQueryAgent,
        cardAnswerAgent,
        safetyAgent,
        imageBriefAgent,
      ];

      agents.forEach(agent => {
        expect(agent.model).toBeDefined();
        // Model can be string or object, just check it's defined
      });
    });

    test('TEST-M3-603: All agents should have tools', () => {
      const agents = [
        contentAnalysisAgent,
        cardQueryAgent,
        cardAnswerAgent,
        safetyAgent,
        imageBriefAgent,
      ];

      agents.forEach(agent => {
        expect(agent.tools).toBeDefined();
        expect(Object.keys(agent.tools).length).toBeGreaterThan(0);
      });
    });
  });
});
