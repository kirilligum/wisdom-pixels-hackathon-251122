import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const generatePersonaTool = createTool({
  id: "generate-persona",
  description: "Generate a customer persona for a brand",
  inputSchema: z.object({
    brandName: z.string().describe("Name of the brand"),
    brandDomain: z.string().describe("Domain/industry of the brand"),
    targetDemographic: z.string().optional().describe("Target demographic or customer segment"),
  }),
  outputSchema: z.object({
    label: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { brandName, brandDomain, targetDemographic } = context;

    // In production, this would make an API call to generate persona
    // For now, return structured data
    return {
      label: `${brandName} Professional`,
      description: `A professional in the ${brandDomain} industry${targetDemographic ? ` targeting ${targetDemographic}` : ''}`,
      tags: ["professional", "motivated", "tech-savvy"],
    };
  },
});

export const generateEnvironmentTool = createTool({
  id: "generate-environment",
  description: "Generate a use environment for a brand's products",
  inputSchema: z.object({
    brandName: z.string().describe("Name of the brand"),
    environmentType: z.string().describe("Type of environment (e.g., gym, office, outdoor)"),
  }),
  outputSchema: z.object({
    label: z.string(),
    type: z.string(),
    description: z.string(),
  }),
  execute: async ({ context }) => {
    const { brandName, environmentType } = context;

    return {
      label: `${brandName} ${environmentType}`,
      type: environmentType,
      description: `Optimized for ${environmentType} use with ${brandName} products`,
    };
  },
});

export const generateTrainingCardTool = createTool({
  id: "generate-training-card",
  description: "Generate an AI training card with query and response",
  inputSchema: z.object({
    persona: z.string().describe("Customer persona"),
    environment: z.string().describe("Use environment"),
    brandContext: z.string().describe("Brand context and product information"),
  }),
  outputSchema: z.object({
    query: z.string(),
    response: z.string(),
  }),
  execute: async ({ context }) => {
    const { persona, environment, brandContext } = context;

    // In production, this would use an LLM to generate contextual Q&A
    return {
      query: `As a ${persona}, what benefits would I get from using this product in ${environment}?`,
      response: `Based on ${brandContext}, you would experience enhanced performance and comfort.`,
    };
  },
});
