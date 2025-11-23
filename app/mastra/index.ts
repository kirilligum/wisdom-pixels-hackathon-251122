import { Mastra } from "@mastra/core/mastra";
import { contentAgent } from "./agents/content-agent";

// Phase M3: Specialized Agents
import { contentAnalysisAgent } from "./agents/content-analysis-agent";
import { cardQueryAgent } from "./agents/card-query-agent";
import { cardAnswerAgent } from "./agents/card-answer-agent";
import { safetyAgent } from "./agents/safety-agent";
import { imageBriefAgent } from "./agents/image-brief-agent";

// Phase M2: Infrastructure Tools
import { dbTool } from "./tools/db-tool";
import { contentFetcherTool } from "./tools/content-fetcher-tool";
import { imageGenerationTool } from "./tools/image-generation-tool";
import { urlSlugTool } from "./tools/url-slug-tool";

// Phase M4: Workflows
import { brandOnboardingWorkflow } from "./workflows/brand-onboarding-workflow";
import { cardGenerationWorkflow } from "./workflows/card-generation-workflow";
import { publishingWorkflow } from "./workflows/publishing-workflow";

export const mastra = new Mastra({
  agents: {
    // Legacy agent (for backwards compatibility with E2E tests)
    contentAgent,

    // Phase M3: Specialized multi-agent system
    contentAnalysisAgent,
    cardQueryAgent,
    cardAnswerAgent,
    safetyAgent,
    imageBriefAgent,
  },
  tools: {
    // Phase M2: Infrastructure tools
    'db': dbTool,
    'content-fetcher': contentFetcherTool,
    'image-generation': imageGenerationTool,
    'url-slug': urlSlugTool,
  },
  workflows: {
    // Phase M4: Orchestrated workflows
    brandOnboardingWorkflow,
    cardGenerationWorkflow,
    publishingWorkflow,
  },
  server: {
    port: 4111,
    host: "localhost",
  },
});
