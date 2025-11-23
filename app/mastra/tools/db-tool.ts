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
    params: z.record(z.any()).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context, runId }) => {
    const { operation, params = {} } = context;

    try {
      let result: any;

      switch (operation) {
        // Brand operations
        case 'getBrand':
          result = await brandsRepo.findById(params.brandId);
          break;

        case 'getBrandBySlug':
          result = await brandsRepo.findBySlug(params.urlSlug);
          break;

        case 'createBrand':
          result = await brandsRepo.create({
            name: params.name,
            domain: params.domain,
            description: params.description,
            urlSlug: params.urlSlug,
            contentSources: params.contentSources || [],
          });
          break;

        case 'updateBrand':
          result = await brandsRepo.update(params.brandId, params.updates);
          break;

        case 'listBrands':
          result = await brandsRepo.findAll();
          break;

        // Persona operations
        case 'getPersonasByBrand':
          result = await personasRepo.findByBrandId(params.brandId);
          break;

        case 'createPersona':
          result = await personasRepo.create({
            brandId: params.brandId,
            label: params.label,
            description: params.description,
            tags: params.tags || [],
          });
          break;

        // Environment operations
        case 'getEnvironmentsByBrand':
          result = await environmentsRepo.findByBrandId(params.brandId);
          break;

        case 'createEnvironment':
          result = await environmentsRepo.create({
            brandId: params.brandId,
            label: params.label,
            description: params.description,
            tags: params.tags || [],
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
          result = await cardsRepo.findById(params.cardId);
          break;

        case 'getCardsByBrand':
          result = await cardsRepo.findByBrandId(params.brandId);
          break;

        case 'getPublishedCardsByBrand':
          result = await cardsRepo.findPublishedByBrandId(params.brandId);
          break;

        case 'createCard':
          result = await cardsRepo.create({
            brandId: params.brandId,
            influencerId: params.influencerId,
            personaId: params.personaId,
            environmentId: params.environmentId,
            query: params.query,
            response: params.response,
            imageUrl: params.imageUrl,
            imageBrief: params.imageBrief,
            status: params.status || 'draft',
          });
          break;

        case 'publishCard':
          result = await cardsRepo.publish(params.cardId);
          break;

        case 'incrementCardViews':
          await cardsRepo.incrementViewCount(params.cardId);
          result = { success: true };
          break;

        // Workflow run operations
        case 'createWorkflowRun':
          result = await workflowRunsRepo.create({
            workflowName: params.workflowName,
            brandId: params.brandId,
            status: 'running',
            input: params.input,
          });
          break;

        case 'completeWorkflowRun':
          result = await workflowRunsRepo.complete(params.runId, params.output);
          break;

        case 'failWorkflowRun':
          result = await workflowRunsRepo.fail(params.runId, params.error);
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
