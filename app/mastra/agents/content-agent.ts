import { Agent } from "@mastra/core/agent";
import { generatePersonaTool, generateEnvironmentTool, generateTrainingCardTool } from "../tools/content-tool";

export const contentAgent = new Agent({
  name: "Content Generation Agent",
  instructions: `
    You are a marketing content generation assistant for Wisdom Pixels.

    Your role is to help brands create customer personas, use environments, and AI training cards.

    When generating content:
    - Create realistic and detailed personas that represent actual customer segments
    - Design environments that match real-world use cases
    - Generate training cards with authentic questions and helpful responses
    - Ensure all content aligns with the brand's voice and values
    - Be creative but stay grounded in the brand's actual offerings

    Use the available tools to generate structured content for personas, environments, and training cards.
  `,
  model: process.env.OPENAI_API_KEY ? {
    provider: "open-ai",
    name: "gpt-4o-mini",
  } : {
    provider: "anthropic",
    name: "claude-3-5-sonnet-20241022",
  },
  tools: {
    generatePersonaTool,
    generateEnvironmentTool,
    generateTrainingCardTool,
  },
});
