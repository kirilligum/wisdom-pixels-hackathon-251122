import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { urlSlugTool } from '../tools/url-slug-tool';
import { dbTool } from '../tools/db-tool';
import { contentAnalysisAgent } from '../agents/content-analysis-agent';

/**
 * BrandOnboardingWorkflow - Onboards a new brand with content analysis
 *
 * Input: brand name, domain, contentSources[]
 * Output: brandId, personas[], environments[]
 *
 * Steps:
 * 1. Generate unique URL slug
 * 2. Create brand record
 * 3. Fetch and analyze content
 * 4. Extract personas and environments
 * 5. Save to database
 *
 * REQ-001: Extract brand schema from content sources
 * REQ-102: Extract 3+ personas per brand
 * REQ-103: Extract 3+ environments per brand
 */

// Step 1: Generate unique URL slug
const generateSlugStep = createStep({
  id: 'generate-slug',
  description: 'Generate unique URL slug for brand',
  inputSchema: z.object({
    brandName: z.string(),
  }),
  outputSchema: z.object({
    urlSlug: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { brandName } = inputData;

    const result = await urlSlugTool.execute({
      text: brandName,
    });

    if (!result.success || !result.slug) {
      throw new Error(`Failed to generate slug: ${result.error}`);
    }

    return {
      urlSlug: result.slug,
    };
  },
});

// Step 2: Create brand record
const createBrandStep = createStep({
  id: 'create-brand',
  description: 'Create brand record in database',
  inputSchema: z.object({
    brandName: z.string(),
    domain: z.string(),
    contentSources: z.array(z.string()),
    urlSlug: z.string(),
  }),
  outputSchema: z.object({
    brandId: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { brandName, domain, contentSources, urlSlug } = inputData;

    const result = await dbTool.execute({
      operation: 'createBrand',
      params: {
        name: brandName,
        domain,
        urlSlug,
        contentSources,
      },
    });

    if (!result.success || !result.data) {
      throw new Error(`Failed to create brand: ${result.error}`);
    }

    return {
      brandId: result.data.brandId,
    };
  },
});

// Step 3: Analyze brand content
const analyzeContentStep = createStep({
  id: 'analyze-content',
  description: 'Fetch and analyze brand content to extract personas and environments',
  inputSchema: z.object({
    brandId: z.string(),
    brandName: z.string(),
    domain: z.string(),
    contentSources: z.array(z.string()),
  }),
  outputSchema: z.object({
    brandId: z.string(),
    personas: z.array(z.object({
      label: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
    })),
    environments: z.array(z.object({
      label: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
    })),
  }),
  execute: async ({ inputData }) => {
    const { brandId, brandName, domain, contentSources } = inputData;

    // Fetch content from first source (could be extended to analyze multiple sources)
    const contentSource = contentSources[0] || `https://${domain}`;

    const prompt = `Analyze the brand "${brandName}" (${domain}) from the following content source: ${contentSource}

Extract:
1. At least 3 customer personas with labels, descriptions, and tags
2. At least 3 environments/settings with labels, descriptions, and tags

Respond with a valid JSON object in this format:
{
  "personas": [
    {
      "label": "Customer Type Name",
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
}`;

    const response = await contentAnalysisAgent.generate(prompt);

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(response.text);
      }
    } catch (error) {
      throw new Error(`Failed to parse content analysis response: ${error.message}`);
    }

    if (!analysis.personas || analysis.personas.length < 3) {
      throw new Error('Content analysis did not extract at least 3 personas');
    }

    if (!analysis.environments || analysis.environments.length < 3) {
      throw new Error('Content analysis did not extract at least 3 environments');
    }

    return {
      brandId,
      personas: analysis.personas,
      environments: analysis.environments,
    };
  },
});

// Step 4: Save personas to database
const savePersonasStep = createStep({
  id: 'save-personas',
  description: 'Save extracted personas to database',
  inputSchema: z.object({
    brandId: z.string(),
    personas: z.array(z.object({
      label: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
    })),
  }),
  outputSchema: z.object({
    personaIds: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { brandId, personas } = inputData;

    const personaIds: string[] = [];

    for (const persona of personas) {
      const result = await dbTool.execute({
        operation: 'createPersona',
        params: {
          brandId,
          label: persona.label,
          description: persona.description,
          tags: persona.tags,
        },
      });

      if (!result.success || !result.data) {
        throw new Error(`Failed to save persona "${persona.label}": ${result.error}`);
      }

      personaIds.push(result.data.personaId);
    }

    return {
      personaIds,
    };
  },
});

// Step 5: Save environments to database
const saveEnvironmentsStep = createStep({
  id: 'save-environments',
  description: 'Save extracted environments to database',
  inputSchema: z.object({
    brandId: z.string(),
    environments: z.array(z.object({
      label: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
    })),
  }),
  outputSchema: z.object({
    environmentIds: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { brandId, environments } = inputData;

    const environmentIds: string[] = [];

    for (const environment of environments) {
      const result = await dbTool.execute({
        operation: 'createEnvironment',
        params: {
          brandId,
          label: environment.label,
          description: environment.description,
          tags: environment.tags,
        },
      });

      if (!result.success || !result.data) {
        throw new Error(`Failed to save environment "${environment.label}": ${result.error}`);
      }

      environmentIds.push(result.data.environmentId);
    }

    return {
      environmentIds,
    };
  },
});

// Final step: Combine results
const combineResultsStep = createStep({
  id: 'combine-results',
  description: 'Combine all results into final output',
  inputSchema: z.object({
    brandId: z.string(),
    personaIds: z.array(z.string()),
    environmentIds: z.array(z.string()),
    personas: z.array(z.object({
      label: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
    })),
    environments: z.array(z.object({
      label: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
    })),
  }),
  outputSchema: z.object({
    brandId: z.string(),
    personaCount: z.number(),
    environmentCount: z.number(),
    message: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { brandId, personas, environments } = inputData;

    return {
      brandId,
      personaCount: personas.length,
      environmentCount: environments.length,
      message: `Brand onboarded successfully with ${personas.length} personas and ${environments.length} environments`,
    };
  },
});

// Create and export the workflow
export const brandOnboardingWorkflow = createWorkflow({
  id: 'brand-onboarding-workflow',
  inputSchema: z.object({
    brandName: z.string(),
    domain: z.string(),
    contentSources: z.array(z.string()).optional().default([]),
  }),
  outputSchema: z.object({
    brandId: z.string(),
    personaCount: z.number(),
    environmentCount: z.number(),
    message: z.string(),
  }),
})
  // Step 1: Generate slug
  .then(generateSlugStep)
  // Step 2: Create brand with slug from previous step
  .map(async ({ inputData, getStepResult, getWorkflowInputData }) => {
    const workflowInput = getWorkflowInputData();
    const { urlSlug } = getStepResult(generateSlugStep);
    return {
      brandName: workflowInput.brandName,
      domain: workflowInput.domain,
      contentSources: workflowInput.contentSources,
      urlSlug,
    };
  })
  .then(createBrandStep)
  // Step 3: Analyze content
  .map(async ({ inputData, getStepResult, getWorkflowInputData }) => {
    const workflowInput = getWorkflowInputData();
    const { brandId } = getStepResult(createBrandStep);
    return {
      brandId,
      brandName: workflowInput.brandName,
      domain: workflowInput.domain,
      contentSources: workflowInput.contentSources,
    };
  })
  .then(analyzeContentStep)
  // Steps 4 & 5: Save personas and environments in parallel
  .parallel([
    // Save personas
    createStep({
      id: 'save-personas-parallel',
      inputSchema: z.object({
        brandId: z.string(),
        personas: z.array(z.object({
          label: z.string(),
          description: z.string(),
          tags: z.array(z.string()),
        })),
        environments: z.array(z.object({
          label: z.string(),
          description: z.string(),
          tags: z.array(z.string()),
        })),
      }),
      outputSchema: z.object({
        personaIds: z.array(z.string()),
      }),
      execute: savePersonasStep.execute,
    }),
    // Save environments
    createStep({
      id: 'save-environments-parallel',
      inputSchema: z.object({
        brandId: z.string(),
        personas: z.array(z.object({
          label: z.string(),
          description: z.string(),
          tags: z.array(z.string()),
        })),
        environments: z.array(z.object({
          label: z.string(),
          description: z.string(),
          tags: z.array(z.string()),
        })),
      }),
      outputSchema: z.object({
        environmentIds: z.array(z.string()),
      }),
      execute: saveEnvironmentsStep.execute,
    }),
  ])
  // Step 6: Combine results
  .map(async ({ inputData, getStepResult }) => {
    const analysisResult = getStepResult(analyzeContentStep);
    const savePersonasResult = getStepResult('save-personas-parallel');
    const saveEnvironmentsResult = getStepResult('save-environments-parallel');

    return {
      brandId: analysisResult.brandId,
      personaIds: savePersonasResult.personaIds,
      environmentIds: saveEnvironmentsResult.environmentIds,
      personas: analysisResult.personas,
      environments: analysisResult.environments,
    };
  })
  .then(combineResultsStep)
  .commit();
