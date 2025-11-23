import { createTool } from '@mastra/core';
import { z } from 'zod';
import {
  brandsRepo,
  personasRepo,
  environmentsRepo,
  influencersRepo,
  cardsRepo,
  workflowRunsRepo,
} from '../db/repositories';

/**
 * DbTool - Provides database access to agents
 * Wraps repository operations for use in agent workflows
 * REQ-003: Database persistence layer
 */

export const dbTool = createTool({
  id: 'db-tool',
  description: 'Access and manipulate database entities (brands, personas, environments, influencers, cards)',
  inputSchema: z.object({
    operation: z.enum([
      'getBrand',
      'getBrandBySlug',
      'createBrand',
      'updateBrand',
      'listBrands',
      'getPersonasByBrand',
      'createPersona',
      'getEnvironmentsByBrand',
      'createEnvironment',
      'getInfluencers',
      'getEnabledInfluencers',
      'getCard',
      'getCardsByBrand',
      'getPublishedCardsByBrand',
      'createCard',
      'publishCard',
      'incrementCardViews',
      'createWorkflowRun',
      'completeWorkflowRun',
      'failWorkflowRun',
    ]),
    params: z.record(z.string(), z.any()).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
  }),
  execute: async (input: any) => {
    const operation = input.operation;
    const params = input.params || {};
    const p = params as Record<string, any>;

    try {
      let result: any;

      switch (operation) {
        // Brand operations
        case 'getBrand':
          result = await brandsRepo.findById(p.brandId);
          break;

        case 'getBrandBySlug':
          result = await brandsRepo.findBySlug(p.urlSlug);
          break;

        case 'createBrand':
          result = await brandsRepo.create({
            name: p.name,
            domain: p.domain,
            description: p.description,
            urlSlug: p.urlSlug,
            contentSources: p.contentSources || [],
          });
          break;

        case 'updateBrand':
          result = await brandsRepo.update(p.brandId, p.updates);
          break;

        case 'listBrands':
          result = await brandsRepo.findAll();
          break;

        // Persona operations
        case 'getPersonasByBrand':
          result = await personasRepo.findByBrandId(p.brandId);
          break;

        case 'createPersona':
          result = await personasRepo.create({
            brandId: p.brandId,
            label: p.label,
            description: p.description,
            tags: p.tags || [],
          });
          break;

        // Environment operations
        case 'getEnvironmentsByBrand':
          result = await environmentsRepo.findByBrandId(p.brandId);
          break;

        case 'createEnvironment':
          result = await environmentsRepo.create({
            brandId: p.brandId,
            label: p.label,
            description: p.description,
            tags: p.tags || [],
          });
          break;

        // Influencer operations
        case 'getInfluencers':
          result = await influencersRepo.findAll();
          break;

        case 'getEnabledInfluencers':
          result = await influencersRepo.findEnabled();
          break;

        // Card operations
        case 'getCard':
          result = await cardsRepo.findById(p.cardId);
          break;

        case 'getCardsByBrand':
          result = await cardsRepo.findByBrandId(p.brandId);
          break;

        case 'getPublishedCardsByBrand':
          result = await cardsRepo.findPublishedByBrandId(p.brandId);
          break;

        case 'createCard':
          result = await cardsRepo.create({
            brandId: p.brandId,
            influencerId: p.influencerId,
            personaId: p.personaId,
            environmentId: p.environmentId,
            query: p.query,
            response: p.response,
            imageUrl: p.imageUrl,
            imageBrief: p.imageBrief,
            status: p.status || 'draft',
          });
          break;

        case 'publishCard':
          result = await cardsRepo.publish(p.cardId);
          break;

        case 'incrementCardViews':
          await cardsRepo.incrementViewCount(p.cardId);
          result = { success: true };
          break;

        // Workflow run operations
        case 'createWorkflowRun':
          result = await workflowRunsRepo.create({
            workflowName: p.workflowName,
            brandId: p.brandId,
            status: 'running',
            input: p.input,
          });
          break;

        case 'completeWorkflowRun':
          result = await workflowRunsRepo.complete(p.runId, p.output);
          break;

        case 'failWorkflowRun':
          result = await workflowRunsRepo.fail(p.runId, p.error);
          break;

        default:
          return {
            success: false,
            error: `Unknown operation: ${operation}`,
          };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
