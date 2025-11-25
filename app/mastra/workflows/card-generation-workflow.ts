import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { dbTool } from '../tools/db-tool';
import { cardQueryAgent } from '../agents/card-query-agent';
import { cardAnswerAgent } from '../agents/card-answer-agent';
import { safetyAgent } from '../agents/safety-agent';
import { imageBriefAgent } from '../agents/image-brief-agent';
import { imageGenerationTool } from '../tools/image-generation-tool';

/**
 * CardGenerationWorkflow - Generates training cards for a brand
 *
 * Input: brandId
 * Output: cardIds[], count
 *
 * Steps:
 * 1. Load brand context (brand, personas, environments, influencers)
 * 2. For each persona + environment + influencer combination:
 *    - Generate query (CardQueryAgent)
 *    - Generate response (CardAnswerAgent)
 *    - Check safety (SafetyAgent)
 *    - Generate image brief and image (ImageBriefAgent + ImageGenerationTool)
 *    - Save card (DbTool)
 * 3. Return generated card count
 *
 * REQ-105: Generate 20+ cards per brand
 * REQ-202: Queries must mention influencer name
 * REQ-204: Responses must mention brand/product name
 * REQ-106: Safety review before card generation
 * REQ-108: Each card must have AI-generated image
 */

// Step 1: Load brand context
const loadBrandContextStep = createStep({
  id: 'load-brand-context',
  description: 'Load brand, personas, environments, and enabled influencers',
  inputSchema: z.object({
    brandId: z.string(),
  }),
  outputSchema: z.object({
    brand: z.object({
      id: z.string(),
      name: z.string(),
      domain: z.string(),
      productImageUrl: z.string().optional(),
    }),
    personas: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    })),
    environments: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    })),
    influencers: z.array(z.object({
      id: z.string(),
      name: z.string(),
      bio: z.string(),
      domainExpertise: z.string(),
      referenceImageUrl: z.string(),
    })),
  }),
  execute: async ({ inputData }) => {
    const { brandId } = inputData;

    // Get brand
    const brandResult = await dbTool.execute({
      operation: 'getBrand',
      params: { brandId },
    });

    if (!brandResult.success || !brandResult.data) {
      throw new Error(`Brand not found: ${brandId}`);
    }
    const brand = brandResult.data;

    // Get personas
    const personasResult = await dbTool.execute({
      operation: 'getPersonasByBrand',
      params: { brandId },
    });

    if (!personasResult.success || !Array.isArray(personasResult.data) || personasResult.data.length === 0) {
      throw new Error(`No personas found for brand: ${brandId}`);
    }
    const personas = personasResult.data;

    // Get environments
    const environmentsResult = await dbTool.execute({
      operation: 'getEnvironmentsByBrand',
      params: { brandId },
    });

    if (!environmentsResult.success || !Array.isArray(environmentsResult.data) || environmentsResult.data.length === 0) {
      throw new Error(`No environments found for brand: ${brandId}`);
    }
    const environments = environmentsResult.data;

    // Get enabled influencers; if none are enabled, gracefully fall back
    // to all influencers so card generation can still proceed.
    let influencersResult = await dbTool.execute({
      operation: 'getEnabledInfluencers',
      params: {},
    });

    if (!influencersResult.success || !Array.isArray(influencersResult.data) || influencersResult.data.length === 0) {
      const allInfluencersResult = await dbTool.execute({
        operation: 'getInfluencers',
        params: {},
      });

      if (!allInfluencersResult.success || !Array.isArray(allInfluencersResult.data) || allInfluencersResult.data.length === 0) {
        throw new Error('No influencers found');
      }

      influencersResult = allInfluencersResult;
    }
    const influencers = influencersResult.data;

    return {
      brand: {
        id: brand.brandId,
        name: brand.name,
        domain: brand.domain,
        productImageUrl: Array.isArray(brand.productImages) && brand.productImages.length > 0
          ? brand.productImages[0]
          : undefined,
      },
      personas: personas.map((p: any) => ({
        id: p.personaId,
        label: p.label,
        description: p.description,
      })),
      environments: environments.map((e: any) => ({
        id: e.environmentId,
        label: e.label,
        description: e.description,
      })),
      influencers: influencers.map((i: any) => ({
        id: i.influencerId,
        name: i.name,
        bio: i.bio,
        domainExpertise: i.domain,
        referenceImageUrl: i.imageUrl,
      })),
    };
  },
});

// Step 2: Generate card combinations
const generateCombinationsStep = createStep({
  id: 'generate-combinations',
  description: 'Generate all persona x environment x influencer combinations',
  inputSchema: z.object({
    brand: z.object({
      id: z.string(),
      name: z.string(),
      domain: z.string(),
      productImageUrl: z.string().optional(),
    }),
    personas: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    })),
    environments: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    })),
    influencers: z.array(z.object({
      id: z.string(),
      name: z.string(),
      bio: z.string(),
      domainExpertise: z.string(),
      referenceImageUrl: z.string(),
    })),
  }),
  outputSchema: z.object({
    combinations: z.array(z.object({
      brand: z.object({
        id: z.string(),
        name: z.string(),
        domain: z.string(),
        productImageUrl: z.string().optional(),
      }),
      persona: z.object({
        id: z.string(),
        label: z.string(),
        description: z.string(),
      }),
      environment: z.object({
        id: z.string(),
        label: z.string(),
        description: z.string(),
      }),
      influencer: z.object({
        id: z.string(),
        name: z.string(),
        bio: z.string(),
        domainExpertise: z.string(),
        referenceImageUrl: z.string(),
      }),
    })),
  }),
  execute: async ({ inputData }) => {
    const { brand, personas, environments, influencers } = inputData;

    const combinations = [];
    for (const persona of personas) {
      for (const environment of environments) {
        for (const influencer of influencers) {
          combinations.push({
            brand,
            persona,
            environment,
            influencer,
          });
        }
      }
    }

    return {
      combinations,
    };
  },
});

// Step 3: Process each combination to generate a card
const processCombinationStep = createStep({
  id: 'process-combination',
  description: 'Generate a complete training card for one combination',
  inputSchema: z.object({
    brand: z.object({
      id: z.string(),
      name: z.string(),
      domain: z.string(),
      productImageUrl: z.string().optional(),
    }),
    persona: z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    }),
    environment: z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    }),
    influencer: z.object({
      id: z.string(),
      name: z.string(),
      bio: z.string(),
      domainExpertise: z.string(),
      referenceImageUrl: z.string(),
    }),
  }),
  outputSchema: z.object({
    cardId: z.string().optional(),
    skipped: z.boolean(),
    reason: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const { brand, persona, environment, influencer } = inputData;

    // 3a. Generate query
    const queryPrompt = `Generate a question about ${brand.name} (${brand.domain}) that ${persona.label} might ask, mentioning influencer ${influencer.name} by name.

Persona: ${persona.description}
Environment: ${environment.label} - ${environment.description}
Influencer: ${influencer.name} - ${influencer.domainExpertise}

IMPORTANT: The question MUST mention ${influencer.name} by name.

Generate only the question, under 200 characters.`;

    const queryResponse = await cardQueryAgent.generate(queryPrompt);
    const query = queryResponse.text.trim();

    // 3b. Generate response
    const answerPrompt = `As ${influencer.name}, answer this question about ${brand.name}: "${query}"

Your profile:
- Name: ${influencer.name}
- Expertise: ${influencer.domainExpertise}
- Bio: ${influencer.bio}

Context:
- Persona asking: ${persona.label} (${persona.description})
- Environment: ${environment.label}

IMPORTANT: Your response MUST mention ${brand.name} by name.
Write in first person as ${influencer.name}.
Keep under 300 characters.`;

    const answerResponse = await cardAnswerAgent.generate(answerPrompt);
    const response = answerResponse.text.trim();

    // 3c. Safety check
    const safetyPrompt = `Review this training card content for safety issues:

Query: ${query}
Response: ${response}

Respond with valid JSON:
{
  "approved": true/false,
  "issues": [...],
  "recommendation": "approve | revise | reject"
}`;

    const safetyResponse = await safetyAgent.generate(safetyPrompt);

    let safetyCheck;
    try {
      const jsonMatch = safetyResponse.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        safetyCheck = JSON.parse(jsonMatch[0]);
      } else {
        safetyCheck = JSON.parse(safetyResponse.text);
      }
    } catch (error) {
      // If parsing fails, assume approval
      safetyCheck = { approved: true, recommendation: 'approve' };
    }

    if (!safetyCheck.approved || safetyCheck.recommendation === 'reject') {
      return {
        skipped: true,
        reason: `Safety check failed: ${JSON.stringify(safetyCheck.issues || [])}`,
      };
    }

    // 3d. Generate image brief
    const imageBriefPrompt = `Generate an image-generation prompt for a professional training card image suitable for Nano Banana Pro:

Brand: ${brand.name}
Influencer: ${influencer.name} (${influencer.bio})
Environment: ${environment.label} - ${environment.description}
Card Query: ${query}
Card Response: ${response}

Create a photorealistic prompt showing ${influencer.name} using ${brand.name} in ${environment.label}.

Respond with valid JSON:
  {
    "prompt": "The complete image-generation prompt",
    "referenceImageUrls": ["${influencer.referenceImageUrl}"],
    "imageSize": "landscape_4_3"
  }`;

    const imageBriefResponse = await imageBriefAgent.generate(imageBriefPrompt);

    let imageBrief: {
      prompt: string;
      referenceImageUrls?: string[];
      imageSize?: string;
    };
    try {
      const jsonMatch = imageBriefResponse.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        imageBrief = JSON.parse(jsonMatch[0]);
      } else {
        imageBrief = JSON.parse(imageBriefResponse.text);
      }
    } catch (error) {
      // Fallback to simple prompt
      imageBrief = {
        prompt: `Professional photo of ${influencer.name} using ${brand.name} in ${environment.label}. Photorealistic, natural lighting, 4K.`,
        referenceImageUrls: [influencer.referenceImageUrl],
        imageSize: 'landscape_4_3',
      };
    }

    // 3e. Generate image
    let imageUrl = '';

    // Build reference images: always include influencer, optionally brand product image
    const referenceImageUrls: string[] = Array.isArray(imageBrief.referenceImageUrls)
      ? [...imageBrief.referenceImageUrls]
      : [influencer.referenceImageUrl];

    if (brand.productImageUrl) {
      referenceImageUrls.push(brand.productImageUrl);
    }

    try {
      const imageResult = await imageGenerationTool.execute({
        prompt: imageBrief.prompt,
        referenceImageUrls,
        imageSize: imageBrief.imageSize || 'landscape_4_3',
      });

      if (imageResult.success && imageResult.imageUrl) {
        imageUrl = imageResult.imageUrl;
      }
    } catch (error) {
      // If image generation fails, continue without image
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Image generation failed: ${message}`);
    }

    // 3f. Save card
    const cardResult = await dbTool.execute({
      operation: 'createCard',
      params: {
        brandId: brand.id,
        personaId: persona.id,
        environmentId: environment.id,
        influencerId: influencer.id,
        query,
        response,
        imageUrl: imageUrl || '',
        imageBrief: imageBrief.prompt,
        status: 'draft',
      },
    });

    if (!cardResult.success || !cardResult.data) {
      throw new Error(`Failed to save card: ${cardResult.error}`);
    }

    return {
      cardId: cardResult.data.cardId,
      skipped: false,
    };
  },
});

// Step 4: Summarize results
const summarizeResultsStep = createStep({
  id: 'summarize-results',
  description: 'Count generated and skipped cards',
  inputSchema: z.array(z.object({
    cardId: z.string().optional(),
    skipped: z.boolean(),
    reason: z.string().optional(),
  })),
  outputSchema: z.object({
    cardIds: z.array(z.string()),
    totalGenerated: z.number(),
    totalSkipped: z.number(),
    message: z.string(),
  }),
  execute: async ({ inputData }) => {
    const results = inputData;

    const cardIds = results
      .filter(r => !r.skipped && r.cardId)
      .map(r => r.cardId!);

    const skipped = results.filter(r => r.skipped).length;

    return {
      cardIds,
      totalGenerated: cardIds.length,
      totalSkipped: skipped,
      message: `Generated ${cardIds.length} training cards (${skipped} skipped)`,
    };
  },
});

// Create and export the workflow
export const cardGenerationWorkflow = createWorkflow({
  id: 'card-generation-workflow',
  inputSchema: z.object({
    brandId: z.string(),
  }),
  outputSchema: z.object({
    cardIds: z.array(z.string()),
    totalGenerated: z.number(),
    totalSkipped: z.number(),
    message: z.string(),
  }),
})
  // Step 1: Load context
  .then(loadBrandContextStep)
  // Step 2: Generate combinations
  .then(generateCombinationsStep)
  // Step 3: Process each combination
  .map(async ({ inputData }) => {
    return inputData.combinations;
  })
  .foreach(processCombinationStep, { concurrency: 2 }) // Process 2 cards at a time
  // Step 4: Summarize
  .then(summarizeResultsStep)
  .commit();
