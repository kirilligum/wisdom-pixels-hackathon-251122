# Wisdom Pixels: Execution Plan for Full Agentic System (v2)

**Document Version**: 2.0
**Created**: 2025-11-23
**Status**: Active - Implementation Phase
**Parent Document**: wisdom-pixels-mastra-flux2-react-plan.md

## Executive Summary

This document provides a step-by-step execution plan to migrate from the current prototype implementation to the full agentic system specified in the PRD. The current implementation has established foundational UI and basic Mastra integration, but requires substantial architectural changes to achieve the multi-agent, workflow-driven system described in the PRD.

---

## 1. Current State Assessment (Phase P0-Current)

### What Exists Now

**Frontend (React + Vite) ✅**
- ✅ Brand Dashboard with tab navigation
- ✅ Brand Setup form
- ✅ Card Gallery with filters
- ✅ Card Detail view with editing
- ✅ Publish workflow UI
- ✅ Telemetry (viewCount via localStorage)
- ✅ Image Generator Tab (fal.ai integration)
- ✅ AI Content Tab (Mastra integration)

**Mastra Backend (Partial) ⚠️**
- ✅ Basic Mastra instance configured
- ✅ One contentAgent with generic instructions
- ✅ Three content generation tools (generatePersonaTool, generateEnvironmentTool, generateTrainingCardTool)
- ✅ Client wrapper (src/lib/mastra.ts)
- ❌ No specialized agents (ContentAnalysis, CardQuery, CardAnswer, ImageBrief, Safety)
- ❌ No workflows (BrandOnboarding, CardGeneration, Publishing)
- ❌ No infrastructure tools (DbTool, ContentFetcherTool, ImageGenerationTool, UrlSlugTool)

**Data Layer ❌**
- ✅ TypeScript interfaces defined (src/types/index.ts)
- ✅ Seed data in JSON (src/data/seedData.ts)
- ❌ No database (LibSQL/SQLite)
- ❌ No repositories or DB access layer
- ❌ No WorkflowRun tracking

**Backend API Layer ❌**
- ❌ No REST API endpoints
- ⚠️ Frontend calls Mastra directly (not per PRD architecture)

**Image Generation ⚠️**
- ✅ fal.ai client integration
- ❌ Wrong model: using "fal-ai/flux/schnell" instead of "fal-ai/alpha-image-232/edit-image"
- ❌ No ImageGenerationTool wrapper for Mastra agents
- ❌ Missing image_urls input capability (for influencer/product references)

**Tests ⚠️**
- ✅ 47 Playwright E2E tests passing
- ❌ Test IDs don't match PRD test suite (TEST-001, TEST-002, etc.)
- ❌ Missing integration tests for agents/workflows

### Critical Gaps

1. **Architecture**: Direct frontend-to-Mastra calls vs. REST API layer
2. **Agents**: 1 generic agent vs. 5 specialized agents
3. **Workflows**: 0 workflows vs. 3 orchestrated workflows
4. **Tools**: 3 content generators vs. 4 infrastructure tools
5. **Database**: No persistence layer
6. **Image Model**: Wrong fal.ai model (Schnell vs. alpha-image-232/edit-image)

---

## 2. Migration Strategy

### Approach: Incremental Rebuild with Coexistence

We'll use a **strangler fig pattern** to gradually replace the current implementation:

1. **Phase M1-M3**: Build new Mastra backend alongside current system
2. **Phase M4**: Add REST API layer
3. **Phase M5**: Migrate frontend to use REST API
4. **Phase M6**: Remove old direct Mastra calls
5. **Phase M7**: Add database persistence
6. **Phase M8**: End-to-end validation

### Key Principles

- **No breaking changes until Phase M5**: Keep existing UI working
- **Test-driven**: Each phase has specific test criteria
- **Incremental**: Each phase delivers working functionality
- **Reversible**: Git tags at each phase for rollback

---

## 3. Detailed Phase Plan

### Phase M1: Database Foundation (REQ-003, REQ-301-307)

**Objective**: Implement LibSQL database with full schema

**Duration**: 2-3 days

**Dependencies**: None (parallel with current system)

#### Tasks

1. **Install Dependencies**
   ```bash
   npm install @mastra/libsql better-sqlite3 drizzle-orm
   npm install -D drizzle-kit
   ```

2. **Create Database Schema** (`app/mastra/db/schema.ts`)
   ```typescript
   // Tables: brands, personas, environments, influencers, cards, workflow_runs
   // Foreign keys, indexes, constraints per PRD section 7.1
   ```

3. **Create Migrations** (`app/mastra/db/migrations/`)
   ```bash
   npx drizzle-kit generate:sqlite
   npx drizzle-kit push:sqlite
   ```

4. **Create Repositories** (`app/mastra/db/repositories/`)
   - BrandRepository
   - PersonaRepository
   - EnvironmentRepository
   - InfluencerRepository
   - CardRepository
   - WorkflowRunRepository

5. **Seed Database**
   - Convert src/data/seedData.ts to SQL inserts
   - Add seed script: `npm run db:seed`

#### Exit Criteria

- ✅ All tables created with correct foreign keys
- ✅ Repositories implement CRUD operations
- ✅ TEST-301: Foreign key constraints enforced
- ✅ Seed data loads successfully
- ✅ Can query brands/personas/cards from DB

#### Files to Create

```
app/mastra/db/
├── schema.ts           # Drizzle schema definitions
├── client.ts           # Database client setup
├── migrations/         # SQL migration files
├── repositories/
│   ├── brand.repository.ts
│   ├── persona.repository.ts
│   ├── environment.repository.ts
│   ├── influencer.repository.ts
│   ├── card.repository.ts
│   └── workflow-run.repository.ts
└── seed.ts             # Seed script
```

---

### Phase M2: Infrastructure Tools (REQ-209, REQ-210)

**Objective**: Create the 4 infrastructure tools that agents will use

**Duration**: 2-3 days

**Dependencies**: Phase M1 (for DbTool)

#### Tasks

1. **DbTool** (`app/mastra/tools/db-tool.ts`)
   - Wraps all repository operations
   - Provides CRUD for all entities
   - Transaction support for multi-entity operations

   ```typescript
   export const dbTool = createTool({
     id: "db-tool",
     description: "Access and persist data to database",
     inputSchema: z.object({
       operation: z.enum(["create", "read", "update", "delete", "query"]),
       entity: z.enum(["brand", "persona", "environment", "influencer", "card", "workflowRun"]),
       data: z.any(),
       filters: z.any().optional(),
     }),
     execute: async ({ context }) => {
       // Delegate to appropriate repository
     }
   });
   ```

2. **ContentFetcherTool** (`app/mastra/tools/content-fetcher-tool.ts`)
   - Fetches content from URLs
   - HTML to text conversion
   - Rate limiting and retry logic

   ```typescript
   export const contentFetcherTool = createTool({
     id: "content-fetcher",
     description: "Fetch and parse content from URLs",
     inputSchema: z.object({
       urls: z.array(z.string().url()),
       format: z.enum(["text", "html", "markdown"]).default("text"),
     }),
     execute: async ({ context }) => {
       // Use node-fetch or axios
       // Parse with cheerio or similar
     }
   });
   ```

3. **ImageGenerationTool** (`app/mastra/tools/image-generation-tool.ts`)
   - ⚠️ **CRITICAL**: Use "fal-ai/alpha-image-232/edit-image" (not flux/schnell)
   - Support prompt + image_urls[]
   - Parse result.data.images[].url

   ```typescript
   export const imageGenerationTool = createTool({
     id: "image-generation",
     description: "Generate images using FLUX 2 alpha-image-232/edit-image",
     inputSchema: z.object({
       prompt: z.string().describe("Image generation prompt"),
       image_urls: z.array(z.string().url()).optional()
         .describe("Reference images (influencer/product)"),
       image_size: z.string().optional().default("landscape_4_3"),
       seed: z.number().optional(),
     }),
     outputSchema: z.object({
       url: z.string(),
       width: z.number(),
       height: z.number(),
       seed: z.number().optional(),
     }),
     execute: async ({ context }) => {
       const { fal } = await import("@fal-ai/client");
       fal.config({ credentials: process.env.FAL_KEY });

       const result = await fal.subscribe("fal-ai/alpha-image-232/edit-image", {
         input: {
           prompt: context.prompt,
           image_urls: context.image_urls || [],
           image_size: context.image_size,
           seed: context.seed,
         }
       });

       return {
         url: result.data.images[0].url,
         width: result.data.images[0].width,
         height: result.data.images[0].height,
         seed: result.data.seed,
       };
     }
   });
   ```

4. **UrlSlugTool** (`app/mastra/tools/url-slug-tool.ts`)
   - Generate URL-safe slugs
   - Ensure uniqueness per brand

   ```typescript
   export const urlSlugTool = createTool({
     id: "url-slug",
     description: "Generate unique URL slugs for cards",
     inputSchema: z.object({
       brandId: z.string(),
       text: z.string(),
     }),
     execute: async ({ context }) => {
       // Use slugify library
       // Check uniqueness via DbTool
       // Add counter if collision
     }
   });
   ```

#### Exit Criteria

- ✅ All 4 tools implement proper Zod schemas
- ✅ DbTool successfully performs CRUD via repositories
- ✅ ContentFetcherTool fetches from test URLs
- ✅ ImageGenerationTool generates image using alpha-image-232/edit-image
- ✅ UrlSlugTool generates unique slugs
- ✅ TEST-501: ImageGenerationTool returns valid image URL
- ✅ TEST-502: ImageGenerationTool handles errors gracefully

#### Files to Create

```
app/mastra/tools/
├── db-tool.ts
├── content-fetcher-tool.ts
├── image-generation-tool.ts
└── url-slug-tool.ts
```

**REMOVE** (old tools):
```
app/mastra/tools/content-tool.ts  # Delete - replaced by infrastructure tools
```

---

### Phase M3: Specialized Agents (REQ-008-011, REQ-210)

**Objective**: Create 5 specialized agents per PRD architecture

**Duration**: 3-4 days

**Dependencies**: Phase M2 (tools must exist)

#### Tasks

1. **ContentAnalysisAgent** (`app/mastra/agents/content-analysis-agent.ts`)

   **Purpose**: Extract personas, environments, and influencer personas from marketing content

   **Tools**: contentFetcherTool, dbTool

   **Instructions**:
   ```
   You analyze brand marketing content to extract structured data.

   From provided URLs or text, identify:
   1. Product name and description
   2. 3-5 customer personas with goals, pain points, demographics
   3. 3-5 use environments (gym, office, outdoor, etc.)
   4. 5 diverse influencer personas (age, role, background)

   Return structured JSON matching the Persona, Environment, and Influencer schemas.
   Ensure at least one influencer is in their 30s.
   All influencers must have synthetic: true.
   ```

2. **CardQueryAgent** (`app/mastra/agents/card-query-agent.ts`)

   **Purpose**: Generate realistic customer queries that mention influencers

   **Tools**: dbTool (to read persona/influencer data)

   **Instructions**:
   ```
   You generate realistic customer search queries for a fitness product.

   Given:
   - Persona (goals, pain points)
   - Influencer (name, role, age)
   - Product context

   Generate a natural question that:
   1. Mentions the influencer by name
   2. Relates to the persona's goals
   3. Sounds like real search engine query
   4. Is 10-25 words

   Example: "What does Alex Chen recommend for marathon training recovery?"
   ```

3. **CardAnswerAgent** (`app/mastra/agents/card-answer-agent.ts`)

   **Purpose**: Generate influencer-backed responses

   **Tools**: dbTool

   **Instructions**:
   ```
   You write influencer endorsement responses for fitness products.

   Given:
   - Query
   - Influencer (name, bio, expertise)
   - Product name and benefits
   - Environment context

   Generate a 2-3 sentence response that:
   1. Mentions the product name explicitly
   2. Uses first-person from influencer perspective
   3. References the specific environment
   4. Focuses on practical benefits
   5. Avoids medical/diagnostic claims

   Tone: Authentic, helpful, specific.
   ```

4. **SafetyAgent** (`app/mastra/agents/safety-agent.ts`)

   **Purpose**: Validate content for medical claims and required mentions

   **Tools**: None (pure validation)

   **Instructions**:
   ```
   You validate AI training card content for compliance.

   Check each card for:
   1. Query contains influencer name (case-insensitive)
   2. Response contains product name
   3. Response avoids medical/diagnostic claims
      - Banned phrases: "treats", "cures", "heals", "prevents disease", "medical condition"
   4. Response doesn't make specific health outcome promises

   Return: { safe: boolean, issues: string[], recommendations: string[] }

   Flag as unsafe if any critical violation found.
   ```

5. **ImageBriefAgent** (`app/mastra/agents/image-brief-agent.ts`)

   **Purpose**: Convert card metadata into image generation prompts

   **Tools**: dbTool (to read full context)

   **Instructions**:
   ```
   You create detailed image generation briefs for product placement photos.

   Given card context:
   - Persona (demographics, style)
   - Influencer (age, appearance, role)
   - Environment (type, setting, lighting)
   - Product (name, category, usage)

   Generate a 50-100 word image brief that:
   1. Describes the influencer's appearance and action
   2. Details the environment setting
   3. Shows product in use naturally
   4. Specifies lighting and composition
   5. Targets photorealistic quality

   Format: Single paragraph, concrete visual details.
   ```

#### Exit Criteria

- ✅ All 5 agents defined with appropriate tools
- ✅ Agent instructions match PRD specifications
- ✅ TEST-302: CardQueryAgent outputs include influencer name
- ✅ TEST-304: CardAnswerAgent outputs include product name
- ✅ TEST-306: SafetyAgent flags seeded medical claims
- ✅ TEST-401: ImageBriefAgent outputs 50-120 word briefs

#### Files to Create

```
app/mastra/agents/
├── content-analysis-agent.ts
├── card-query-agent.ts
├── card-answer-agent.ts
├── safety-agent.ts
└── image-brief-agent.ts
```

**UPDATE**:
```
app/mastra/agents/content-agent.ts  # Keep for backward compatibility, mark deprecated
```

---

### Phase M4: Workflow Orchestration (REQ-002, REQ-007-013)

**Objective**: Create 3 orchestrated workflows

**Duration**: 4-5 days

**Dependencies**: Phase M3 (agents must exist)

#### Tasks

1. **BrandOnboardingWorkflow** (`app/mastra/workflows/brand-onboarding.ts`)

   **Purpose**: Extract brand schema from marketing content

   **Steps**:
   ```typescript
   export const brandOnboardingWorkflow = new Workflow({
     name: "brand-onboarding",
     steps: [
       {
         id: "fetch-content",
         agent: contentAnalysisAgent,
         tool: contentFetcherTool,
         execute: async (context) => {
           const urls = context.input.contentSources;
           return await contentFetcherTool.execute({ urls });
         }
       },
       {
         id: "analyze-content",
         agent: contentAnalysisAgent,
         execute: async (context) => {
           const content = context.steps["fetch-content"].output;
           return await contentAnalysisAgent.generate({
             messages: [{
               role: "user",
               content: `Extract brand schema from: ${content}`
             }]
           });
         }
       },
       {
         id: "persist-brand",
         tool: dbTool,
         execute: async (context) => {
           const schema = context.steps["analyze-content"].output;
           // Save brand, personas, environments, influencers to DB
         }
       },
       {
         id: "complete",
         execute: async (context) => {
           return {
             brandId: context.steps["persist-brand"].output.brandId,
             status: "completed"
           };
         }
       }
     ]
   });
   ```

2. **CardGenerationWorkflow** (`app/mastra/workflows/card-generation.ts`)

   **Purpose**: Generate N cards for given persona/influencer combinations

   **Steps** (for each card):
   ```
   1. Generate query (CardQueryAgent)
   2. Generate answer (CardAnswerAgent)
   3. Validate content (SafetyAgent) → if fails, regenerate or skip
   4. Generate image brief (ImageBriefAgent)
   5. Generate image (ImageGenerationTool)
   6. Generate URL slug (UrlSlugTool)
   7. Persist card (DbTool)
   ```

   **Loop**: Repeat for N cards with different persona/influencer combos

3. **PublishingWorkflow** (`app/mastra/workflows/publishing.ts`)

   **Purpose**: Change card status and trigger any publishing actions

   **Steps**:
   ```
   1. Load card from DB
   2. Validate card is ready (has image, query, response)
   3. Update status to "published"
   4. (Future: trigger CDN upload, generate static page, etc.)
   ```

#### Workflow State Tracking

All workflows must:
- Create WorkflowRun record on start (status: "pending")
- Update status to "running" when executing
- Update status to "succeeded" or "failed" on completion
- Store payload and result in WorkflowRun
- Handle errors with retries and logging

#### Exit Criteria

- ✅ All 3 workflows defined and executable
- ✅ TEST-001: BrandOnboardingWorkflow extracts personas/environments
- ✅ TEST-002: At least 3 personas and 3 environments extracted
- ✅ TEST-006: CardGenerationWorkflow creates N cards
- ✅ TEST-303: Generated cards have non-empty imageUrl
- ✅ WorkflowRun records track all executions
- ✅ TEST-104: 95% workflow success rate in test runs

#### Files to Create

```
app/mastra/workflows/
├── brand-onboarding.workflow.ts
├── card-generation.workflow.ts
└── publishing.workflow.ts
```

**UPDATE**:
```
app/mastra/index.ts  # Register workflows with Mastra instance
```

---

### Phase M5: Backend REST API (REQ-201-208)

**Objective**: Create Express/Fastify API layer

**Duration**: 3-4 days

**Dependencies**: Phase M4 (workflows must exist)

#### Tasks

1. **API Server Setup** (`app/server/`)
   ```bash
   npm install express cors dotenv
   npm install -D @types/express @types/cors
   ```

2. **Create Endpoints**

   ```
   POST   /api/brands
   POST   /api/brands/:id/onboard
   GET    /api/brands/:id/schema
   POST   /api/brands/:id/cards/generate
   GET    /api/brands/:id/cards
   GET    /api/cards/:cardId
   PATCH  /api/cards/:cardId/status
   GET    /api/workflows/:workflowId
   ```

3. **Controller Structure** (`app/server/controllers/`)
   - BrandController
   - CardController
   - WorkflowController

4. **Integration with Mastra**
   ```typescript
   // Example: Start brand onboarding workflow
   app.post("/api/brands/:id/onboard", async (req, res) => {
     const workflowRun = await mastra.executeWorkflow("brand-onboarding", {
       brandId: req.params.id,
       contentSources: req.body.urls
     });

     res.json({ workflowId: workflowRun.id });
   });
   ```

5. **Error Handling**
   - Structured error responses: `{ error: { code, message, details } }`
   - Validation middleware (Zod)
   - Request logging

6. **Update Scripts**
   ```json
   {
     "scripts": {
       "dev:api": "tsx watch server/index.ts",
       "build:api": "tsc --project tsconfig.api.json"
     }
   }
   ```

#### Exit Criteria

- ✅ All 8 REST endpoints implemented
- ✅ TEST-201: All endpoints respond with correct shapes
- ✅ TEST-102: GET /api/brands/:id/cards responds <500ms
- ✅ Endpoints properly integrate with workflows
- ✅ Error responses follow structured format
- ✅ API runs on separate port (e.g., 4000)

#### Files to Create

```
app/server/
├── index.ts                 # Express app setup
├── routes/
│   ├── brands.ts
│   ├── cards.ts
│   └── workflows.ts
├── controllers/
│   ├── brand.controller.ts
│   ├── card.controller.ts
│   └── workflow.controller.ts
├── middleware/
│   ├── error-handler.ts
│   ├── validation.ts
│   └── logger.ts
└── types/
    └── api.types.ts

tsconfig.api.json            # Separate TS config for server
```

---

### Phase M6: Frontend API Integration (REQ-017-019)

**Objective**: Migrate frontend to use REST API instead of direct Mastra calls

**Duration**: 2-3 days

**Dependencies**: Phase M5 (API must be running)

#### Tasks

1. **Create API Client** (`app/src/lib/api-client.ts`)
   ```typescript
   class WisdomPixelsApiClient {
     constructor(private baseUrl: string) {}

     // Brand endpoints
     async createBrand(data: BrandInput): Promise<Brand>
     async onboardBrand(brandId: string, urls: string[]): Promise<WorkflowRun>
     async getBrandSchema(brandId: string): Promise<BrandSchema>

     // Card endpoints
     async generateCards(brandId: string, params: CardGenParams): Promise<WorkflowRun>
     async getCards(brandId: string, filters?: CardFilters): Promise<Card[]>
     async getCard(cardId: string): Promise<Card>
     async updateCardStatus(cardId: string, status: CardStatus): Promise<Card>

     // Workflow endpoints
     async getWorkflow(workflowId: string): Promise<WorkflowRun>
   }
   ```

2. **Update React Components**
   - Replace `mastraClient` calls with `apiClient` calls
   - Update error handling for REST responses
   - Add loading states for async operations
   - Handle workflow polling for long-running operations

3. **Environment Configuration**
   ```
   VITE_API_URL=http://localhost:4000
   ```

4. **Remove Direct Mastra Client**
   ```typescript
   // DELETE: app/src/lib/mastra.ts (no longer needed)
   ```

#### Exit Criteria

- ✅ All frontend components use REST API
- ✅ No direct @mastra/client-js usage in frontend
- ✅ TEST-101: User can complete full flow in <3 minutes
- ✅ TEST-103: Gallery renders 20 cards in <2 seconds
- ✅ Error handling works for API failures
- ✅ Loading states shown during workflows

#### Files to Update

```
app/src/lib/
├── api-client.ts           # NEW: REST API client
└── mastra.ts               # DELETE

app/src/pages/
├── BrandDashboard.tsx      # Update to use apiClient
├── BrandSetup.tsx          # Update to use apiClient
└── ...

app/src/components/
├── ContentGeneratorTab.tsx # Update to use apiClient
└── ImageGeneratorTab.tsx   # Keep as-is (direct fal.ai) or migrate to API
```

---

### Phase M7: Testing & Validation (REQ-101-108)

**Objective**: Ensure all PRD requirements met with test coverage

**Duration**: 2-3 days

**Dependencies**: Phase M6 (full system operational)

#### Tasks

1. **Align Test Suite with PRD**
   - Rename/create tests to match PRD test IDs
   - TEST-001: Brand creation and onboarding
   - TEST-002: Persona/environment extraction
   - TEST-006: Card generation workflow
   - TEST-012: viewCount increment
   - TEST-101-108: Non-functional requirements
   - TEST-201-210: API contracts
   - TEST-301-308: Data validation
   - TEST-401: Image brief quality
   - TEST-501-502: Image generation tool

2. **Integration Tests**
   ```
   tests/integration/
   ├── brand-onboarding.test.ts
   ├── card-generation.test.ts
   ├── workflow-state.test.ts
   └── api-endpoints.test.ts
   ```

3. **Performance Tests**
   - API response times (TEST-102, TEST-103)
   - Workflow completion rates (TEST-104)
   - Gallery rendering (TEST-103)

4. **E2E Validation**
   - Full brand onboarding → card generation → publishing flow
   - 20+ cards generated successfully
   - Images from correct FLUX model
   - All data persisted to database

#### Exit Criteria

- ✅ All PRD test cases (TEST-001 through TEST-502) implemented
- ✅ >95% workflow success rate
- ✅ Performance metrics met (API <500ms, gallery <2s)
- ✅ 20+ cards generated for FlowForm brand
- ✅ All images from alpha-image-232/edit-image model
- ✅ RTM (Requirements Traceability Matrix) fully satisfied

---

### Phase M8: Documentation & Cleanup

**Objective**: Document the new architecture and clean up old code

**Duration**: 1-2 days

**Dependencies**: Phase M7 (all tests passing)

#### Tasks

1. **Update README**
   - New architecture diagram
   - Setup instructions for DB + API + Mastra + Frontend
   - Environment variables documentation
   - Development workflow

2. **API Documentation**
   - OpenAPI/Swagger spec for REST API
   - Example requests/responses
   - Error codes reference

3. **Code Cleanup**
   - Remove deprecated code
   - Remove old content-tool.ts
   - Remove old ContentGeneratorTab if replaced
   - Update comments and TODOs

4. **Update PRD Execution Log**
   - Fill in Phase Status Table (section 10.1)
   - Document deviations from plan
   - Record lessons learned

#### Exit Criteria

- ✅ README reflects current architecture
- ✅ API documentation complete
- ✅ No deprecated code in codebase
- ✅ PRD Phase Status updated to "Done" for P01-P10

---

## 4. Architecture Changes Summary

### Before (Current)

```
┌─────────────┐
│   React     │
│   Frontend  │
└──────┬──────┘
       │ Direct calls
       ▼
┌─────────────┐        ┌──────────┐
│   Mastra    │───────▶│ fal.ai   │
│  (1 agent)  │        │ (Schnell)│
└─────────────┘        └──────────┘
       │
       ▼
   localStorage
```

### After (Target)

```
┌─────────────┐
│   React     │
│   Frontend  │
└──────┬──────┘
       │ REST API
       ▼
┌─────────────────────────────────────┐
│         Node.js API Server          │
│  (Express + Controllers)            │
└───────────┬─────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────┐
│              Mastra Engine                    │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │  Workflows                          │     │
│  │  • BrandOnboarding                  │     │
│  │  • CardGeneration                   │     │
│  │  • Publishing                       │     │
│  └────────┬────────────────────────────┘     │
│           │                                   │
│  ┌────────▼───────────────────────────┐      │
│  │  Agents (5)                        │      │
│  │  • ContentAnalysis                 │      │
│  │  • CardQuery                       │      │
│  │  • CardAnswer                      │      │
│  │  • ImageBrief                      │      │
│  │  • Safety                          │      │
│  └────────┬───────────────────────────┘      │
│           │                                   │
│  ┌────────▼───────────────────────────┐      │
│  │  Tools (4)                         │      │
│  │  • DbTool                          │      │
│  │  • ContentFetcher                  │      │
│  │  • ImageGeneration (FLUX alpha)    │      │
│  │  • UrlSlug                         │      │
│  └────────┬───────────────────────────┘      │
└───────────┼───────────────────────────────────┘
            │
            ▼
     ┌─────────────┐        ┌──────────────┐
     │  LibSQL DB  │        │   fal.ai     │
     │  (SQLite)   │        │ (alpha-232)  │
     └─────────────┘        └──────────────┘
```

---

## 5. Key Architectural Decisions

### Decision 1: Strangler Fig Pattern
**Rationale**: Minimize risk by building new system alongside old, then migrating

### Decision 2: LibSQL over PostgreSQL
**Rationale**: PRD specifies LibSQL/SQLite for v0; lightweight, embedded, perfect for demo

### Decision 3: Express over Fastify
**Rationale**: More mature ecosystem, better TypeScript support, team familiarity
(Can swap later if needed)

### Decision 4: Drizzle ORM
**Rationale**: Type-safe, SQLite-friendly, minimal overhead

### Decision 5: Keep Current UI
**Rationale**: The UI already works well; only update data fetching layer

---

## 6. Risk Management

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| FLUX model unavailable | Medium | High | Test alpha-image-232/edit-image availability first; fallback to Schnell if needed |
| Workflow complexity bugs | High | High | Extensive logging, workflow state persistence, easy rollback |
| Database migration issues | Medium | Medium | Use Drizzle migrations; test on copy of data |
| API performance | Low | Medium | Optimize DB queries, add caching, load test early |
| Agent prompt quality | High | Medium | Iterate prompts with test cases, add SafetyAgent validation |

---

## 7. Estimation & Timeline

| Phase | Duration | Dependencies | Confidence |
|-------|----------|--------------|------------|
| M1: Database | 2-3 days | None | 90% |
| M2: Tools | 2-3 days | M1 | 85% |
| M3: Agents | 3-4 days | M2 | 75% |
| M4: Workflows | 4-5 days | M3 | 70% |
| M5: REST API | 3-4 days | M4 | 85% |
| M6: Frontend Migration | 2-3 days | M5 | 80% |
| M7: Testing | 2-3 days | M6 | 90% |
| M8: Documentation | 1-2 days | M7 | 95% |
| **Total** | **19-27 days** | | **80%** |

**Realistic Timeline**: 4-5 weeks for solo developer, 2-3 weeks for pair

---

## 8. Success Metrics

### Technical Metrics (Must Achieve)

- ✅ All 5 specialized agents operational
- ✅ All 3 workflows execute successfully
- ✅ All 4 infrastructure tools working
- ✅ Database persists all entities with correct foreign keys
- ✅ REST API responds within SLA (<500ms for card lists)
- ✅ 95%+ workflow success rate
- ✅ Images generated using alpha-image-232/edit-image

### Functional Metrics (Must Achieve)

- ✅ Brand onboarding extracts 3+ personas, 3+ environments, 5 influencers
- ✅ Card generation produces 20+ valid cards
- ✅ All cards have non-empty imageUrl from FLUX
- ✅ SafetyAgent flags seeded violations
- ✅ Queries mention influencers, responses mention product

### User Experience Metrics (Should Achieve)

- ✅ Demo user completes full flow in <3 minutes
- ✅ Gallery loads 20 cards in <2 seconds
- ✅ UI remains responsive during long-running workflows
- ✅ Error messages are clear and actionable

---

## 9. Phase Status Tracking

| Phase | Status | Started | Completed | Owner | Notes |
|-------|--------|---------|-----------|-------|-------|
| M1: Database | Not Started | - | - | - | Ready to begin |
| M2: Tools | Not Started | - | - | - | Depends on M1 |
| M3: Agents | Not Started | - | - | - | Depends on M2 |
| M4: Workflows | Not Started | - | - | - | Depends on M3 |
| M5: REST API | Not Started | - | - | - | Depends on M4 |
| M6: Frontend Migration | Not Started | - | - | - | Depends on M5 |
| M7: Testing | Not Started | - | - | - | Depends on M6 |
| M8: Documentation | Not Started | - | - | - | Depends on M7 |

---

## 10. Next Steps

### Immediate Actions (Start Phase M1)

1. **Verify fal.ai Model Availability**
   ```bash
   # Test alpha-image-232/edit-image
   npm run test:fal-model
   ```

2. **Install Database Dependencies**
   ```bash
   npm install @mastra/libsql better-sqlite3 drizzle-orm drizzle-kit
   ```

3. **Create Database Schema File**
   - Start with `app/mastra/db/schema.ts`
   - Define all 6 tables from PRD section 7.1

4. **Run Initial Migration**
   ```bash
   npx drizzle-kit generate:sqlite
   npx drizzle-kit push:sqlite
   ```

5. **Create First Repository**
   - Start with BrandRepository
   - Implement basic CRUD

### Questions to Resolve Before Starting

1. ✅ Confirmed: Using alpha-image-232/edit-image for FLUX
2. ❓ Do we have FAL_KEY and LLM API keys configured?
3. ❓ Preferred LLM provider: OpenAI or Anthropic?
4. ❓ Database file location: `app/.data/wisdom-pixels.db`?
5. ❓ API server port: 4000?

---

## 11. Appendix: File Structure After Migration

```
app/
├── mastra/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── client.ts
│   │   ├── migrations/
│   │   ├── repositories/
│   │   └── seed.ts
│   ├── agents/
│   │   ├── content-analysis-agent.ts
│   │   ├── card-query-agent.ts
│   │   ├── card-answer-agent.ts
│   │   ├── image-brief-agent.ts
│   │   └── safety-agent.ts
│   ├── workflows/
│   │   ├── brand-onboarding.workflow.ts
│   │   ├── card-generation.workflow.ts
│   │   └── publishing.workflow.ts
│   ├── tools/
│   │   ├── db-tool.ts
│   │   ├── content-fetcher-tool.ts
│   │   ├── image-generation-tool.ts
│   │   └── url-slug-tool.ts
│   └── index.ts
├── server/
│   ├── index.ts
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── types/
├── src/
│   ├── lib/
│   │   └── api-client.ts  (NEW)
│   ├── pages/
│   ├── components/
│   └── ...
└── tests/
    ├── integration/
    ├── e2e/
    └── unit/
```

---

## 12. References

- **Parent PRD**: `/plans/wisdom-pixels-mastra-flux2-react-plan.md`
- **fal.ai Docs**: https://fal.ai/models/fal-ai/alpha-image-232/edit-image
- **Mastra Docs**: https://mastra.ai/docs
- **Drizzle ORM**: https://orm.drizzle.team/
- **Current Implementation**: `/app/src/`, `/app/mastra/`

---

**Document Status**: ✅ Ready for Implementation
**Next Review**: After Phase M1 completion
**Last Updated**: 2025-11-23
