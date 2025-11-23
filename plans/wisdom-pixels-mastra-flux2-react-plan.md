=== document: plans/wisdom-pixels-mastra-flux2-react-plan.md ===

1. Title and metadata

Project name: Wisdom Pixels – Mastra + FLUX 2 + React Implementation
Version: 0.2-draft
Owners: Kirill (Product/Founder), Principal RE-PM (this doc), Core Eng Team
Date: 2025-11-23
Contact: [to-fill]
Document ID: WP-MASTRA-FLUX2-PLAN-002

Summary:
This document defines a standards-aligned product and system plan to implement the Wisdom Pixels backend with Mastra (agents, workflows, tools), FLUX 2 via fal.ai (alpha-image-232/edit-image) for image generation, and a React SPA frontend. The scope covers a v0 implementation that can be executed during/soon after a hackathon, while providing a clear path toward a production-ready, agentic, iterative system. It follows ISO/IEC/IEEE 29148 for requirements, 29119-3 for test documentation, and 12207 for software life cycle processes, with explicit phases suitable for human or LLM-led development.

2. PRD (Stakeholder and system needs)

2.1 Problem

Brands need to shape how AI assistants talk about their products. Today, they manually create landing pages and influencer content, but they do not systematically generate structured, multi-modal examples that LLMs can use as training data. They also lack tooling that connects product understanding, influencer narratives, and photorealistic product placement imagery.

2.2 Users and value

Primary user
Brand marketer / growth lead / agency strategist responsible for performance marketing, SEO/AEO, and influencer marketing.

Future secondary user
Influencer/creator, licensing their likeness and publishing AI-generated endorsements.

Value for brands
• Turn existing marketing pages into a set of Wisdom Pixels cards (query, influencer-backed answer, photorealistic image).
• Ensure queries explicitly mention influencers (paid endorsements) and responses remain on-brand and non-deceptive.
• Provide visually consistent synthetic influencers across multiple environments.
• Export these cards as both human-facing landing pages (unique URLs) and machine-facing training instances.

2.3 Business goals

```
• Deliver a working Mastra-based backend plus React frontend that can:
  - Ingest a brand (FlowForm Motion Suit as hero product).
  - Generate at least 20 cards via an agentic pipeline (LLMs + FLUX 2).
  - Display and manage these cards in a usable UI.
• Make the architecture agentic and workflow-driven so it can be extended to real brands and multiple products.
• Ensure the integration with fal.ai FLUX 2 is robust and encapsulated (single ImageGenerationTool), ready for model swaps.
```

2.4 Success metrics

```
Product/demonstration metrics
  • At least 1 brand (FlowForm) fully onboarded end-to-end via BrandOnboardingWorkflow.
  • 20+ cards generated via CardGenerationWorkflow, with non-empty image_url fields from FLUX 2.
  • Demo users understand “Wisdom Pixels card = query + influencer answer + image + URL” in under 90 seconds.

Technical metrics
  • 95%+ of card generation workflow runs complete without error in test/staging.
  • FLUX 2 integration returns an image URL within 30 seconds for 95% of calls (queue-based, not necessarily synchronous).
  • React gallery of 20 cards loads in under 2 seconds on a typical laptop and stable connection.
```

2.5 Scope

```
In scope
  • React SPA (Vite-based) frontend:
    - Brand dashboard, setup, review, card generation, gallery, detail, publish views.
  • Node.js + TypeScript backend:
    - HTTP API that delegates to Mastra workflows and DB.
  • Mastra:
    - Agents: ContentAnalysis, CardQuery, CardAnswer, ImageBrief, Safety.
    - Workflows: BrandOnboarding, CardGeneration, Publishing.
    - Tools: ContentFetcher, DbTool, ImageGenerationTool (FLUX 2 via fal.ai), UrlSlugTool.
  • Data store:
    - v0: LibSQL or SQLite; optional JSON seed.
    - Schemas for brands, personas, environments, influencers, cards, workflow runs.
  • FLUX 2 via fal.ai:
    - Model identifier: "fal-ai/alpha-image-232/edit-image".
    - Use prompt + image_urls inputs; parse images[].url outputs.

Out of scope (for this iteration)
  • Real-time LLM or FLUX calls from the frontend (all via backend).
  • Real influencer licensing and legal workflows.
  • Multi-brand production tenancy and auth.
  • Formal RAG over brand documents (planned later).
  • Mobile-native apps; only web SPA.
```

2.6 Dependencies

```
• Mastra library and runtime.
• fal.ai account, FAL_KEY environment variable set in backend runtime.
• LLM provider(s) supported by Mastra (e.g., OpenAI, Gemini) for agents.
• React + Vite toolchain.
• LibSQL/SQLite or similar for persistent storage; Node connection driver.
• Git repository and CI for linting, testing.
```

2.7 Risks

```
• fal.ai rate limits or latency causing slow card generation.
• Poor image quality or prompt mismatch from FLUX 2.
• Mastra misconfiguration causing workflow failures.
• Scope creep into full-blown production platform during implementation.
• Demo fragility if workflows are invoked live under unstable network.
```

2.8 Assumptions (high level)

```
• FlowForm is fictional; no real medical device regulations apply, but content should still avoid medical claims.
• All influencers for now are synthetic; no real PII or likeness.
• The team can configure Mastra and fal.ai credentials in a secure backend-only environment.
• LLM and FLUX 2 costs for test data generation are acceptable for development.
```

2.9 Non-goals

```
• No full A/B experimentation or analytics dashboards.
• No SEO/structured data beyond basic card URLs.
• No multi-lingual support in this iteration.
• No headless CMS integration yet.
```

3. SRS (System requirements)

3.1 Functional requirements (REQ-###, type: func)

Table: Functional requirements

| ID      | Type | Description                                                                                                                                              | Priority |
| ------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-001 | func | System shall allow creating a Brand with name, domain, and content URLs via the React frontend and backend API.                                          | Must     |
| REQ-002 | func | System shall use Mastra BrandOnboardingWorkflow to fetch marketing content and extract personas, environments, and influencer personas.                  | Must     |
| REQ-003 | func | System shall persist Brand, Persona, Environment, and Influencer entities in a LibSQL/SQLite DB.                                                         | Must     |
| REQ-004 | func | System shall expose a GET /api/brands/:id/schema endpoint returning personas, environments, and influencers for review.                                  | Must     |
| REQ-005 | func | System shall represent at least 5 synthetic Influencer profiles per brand, including one in 30s and others with diverse ages/backgrounds.                | Must     |
| REQ-006 | func | System shall allow a user to select persona(s), influencer(s), and desired card count in the React UI.                                                   | Must     |
| REQ-007 | func | System shall start a Mastra CardGenerationWorkflow when POST /api/brands/:id/cards/generate is called.                                                   | Must     |
| REQ-008 | func | CardGenerationWorkflow shall call CardQueryAgent to generate realistic customer queries that mention the influencer.                                     | Must     |
| REQ-009 | func | CardGenerationWorkflow shall call CardAnswerAgent to generate influencer-backed responses referencing the product and scene.                             | Must     |
| REQ-010 | func | CardGenerationWorkflow shall call SafetyAgent to flag medical claims or missing influencer/product mentions and drop or re-prompt problematic cards.     | Should   |
| REQ-011 | func | CardGenerationWorkflow shall call ImageBriefAgent to generate image briefs from card metadata.                                                           | Must     |
| REQ-012 | func | CardGenerationWorkflow shall call ImageGenerationTool, which invokes fal.subscribe("fal-ai/alpha-image-232/edit-image", ...) with prompt and image_urls. | Must     |
| REQ-013 | func | System shall persist generated cards and FLUX 2 image URLs in Card records.                                                                              | Must     |
| REQ-014 | func | System shall expose GET /api/brands/:id/cards to list cards filtered by status/persona/influencer.                                                       | Must     |
| REQ-015 | func | System shall expose GET /api/cards/:cardId to return full card details.                                                                                  | Must     |
| REQ-016 | func | System shall support PATCH /api/cards/:cardId/status to change card status (draft/ready/published).                                                      | Should   |
| REQ-017 | func | React app shall render a Card Gallery view with thumbnails, influencer badges, and filters.                                                              | Must     |
| REQ-018 | func | React app shall render a Card Detail view with full image, query, response, influencer, persona, environment, and unique URL slug.                       | Must     |
| REQ-019 | func | React app shall allow local editing of query and response fields in Card Detail view (non-persisted for v0).                                             | Should   |
| REQ-020 | func | System shall track a simple viewCount per card (incremented on card detail view) in-memory or DB.                                                        | Should   |

3.2 Non-functional requirements (NFR, PERF, etc.)

| ID      | Type | Description                                                                                                       | Priority |
| ------- | ---- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-101 | nfr  | Usability: A new user should be able to create a brand, generate cards, and view gallery in under 3 minutes.      | Must     |
| REQ-102 | perf | Performance: GET /api/brands/:id/cards for 20 cards should respond in under 500 ms in test environment.           | Must     |
| REQ-103 | perf | Performance: React gallery rendering 20 cards should complete in under 2 seconds on a modern laptop.              | Must     |
| REQ-104 | nfr  | Reliability: 95% of CardGenerationWorkflow runs for 20 cards should finish without error in staging.              | Must     |
| REQ-105 | nfr  | Security: FAL_KEY and LLM API keys shall be stored server-side only and never exposed to the browser.             | Must     |
| REQ-106 | nfr  | Maintainability: Mastra agents/workflows and tools shall be defined in separate modules with clear interfaces.    | Must     |
| REQ-107 | perf | FLUX 2 image generation tool must complete a single request (from submit to result) within 60 seconds on average. | Should   |
| REQ-108 | nfr  | Observability: System shall log workflow starts/ends and image generation errors with correlation IDs.            | Should   |

3.3 Interfaces / APIs (type: int)

| ID      | Type | Description                                                                                                                                                               |
| ------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-201 | int  | REST API: POST /api/brands accepts { name, domain, urls[] } and returns { brandId }.                                                                                      |
| REQ-202 | int  | REST API: POST /api/brands/:id/onboard triggers BrandOnboardingWorkflow and returns { workflowId }.                                                                       |
| REQ-203 | int  | REST API: GET /api/brands/:id/schema returns { brand, personas[], environments[], influencers[] }.                                                                        |
| REQ-204 | int  | REST API: POST /api/brands/:id/cards/generate triggers CardGenerationWorkflow and returns { workflowId }.                                                                 |
| REQ-205 | int  | REST API: GET /api/workflows/:workflowId returns { status, progress, result? }.                                                                                           |
| REQ-206 | int  | REST API: GET /api/brands/:id/cards supports query params status, personaId, influencerId; returns array of CardSummary.                                                  |
| REQ-207 | int  | REST API: GET /api/cards/:cardId returns full Card object.                                                                                                                |
| REQ-208 | int  | REST API: PATCH /api/cards/:cardId/status accepts { status } and returns updated Card.                                                                                    |
| REQ-209 | int  | ImageGenerationTool shall call fal.subscribe("fal-ai/alpha-image-232/edit-image", { input: { prompt, image_urls, image_size?, ... }}) and parse result.data.images[].url. |
| REQ-210 | int  | Mastra agents shall communicate via Mastra’s agent/workflow APIs and accept/emit JSON objects matching the defined schemas.                                               |

3.4 Data requirements (type: data)

| ID      | Type | Description                                                                                                                    |
| ------- | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| REQ-301 | data | Each Persona, Environment, Influencer, and Card must reference a valid Brand via brandId.                                      |
| REQ-302 | data | Each Card must reference valid personaId, influencerId, and optional environmentId.                                            |
| REQ-303 | data | Card.query must contain the Influencer.name (case-insensitive substring).                                                      |
| REQ-304 | data | Card.response must contain product_name at least once.                                                                         |
| REQ-305 | data | Card.imageUrl must be a non-empty string pointing to a reachable URL returned by FLUX 2 or object storage.                     |
| REQ-306 | data | Card.urlSlug must be unique per brand.                                                                                         |
| REQ-307 | data | Influencer.synthetic must be true for all influencers in v0.                                                                   |
| REQ-308 | data | LLM-generated content should not contain explicit medical/diagnostic claims; any flagged by SafetyAgent must not be published. |

3.5 Error and telemetry expectations

```
• All REST endpoints should respond with structured error objects: { error: { code, message, details? } }.
• Mastra workflows must record status (pending, running, succeeded, failed) and any error messages in WorkflowRun.
• FLUX 2 integration errors must log the model name, input prompt hash, and requestId where available.
• Telemetry:
  - Card viewCount increment on card detail GET (best-effort).
  - Simple logs for important events: brand onboarded, cards generated, card published.
```

3.6 Acceptance criteria (mapping to TEST-###)

```
• Each functional requirement REQ-001..020 maps to at least one TEST-### (see section 6).
• Non-functional REQs 101..108 map to performance/usability/robustness tests (TEST-101..108).
• Interface and data REQs 201..210, 301..308 map to contract/data tests (TEST-201..210, TEST-301..308).
```

3.7 System architecture diagram

````
Mermaid diagram

```mermaid
graph TD
  U[User (Brand Marketer)] --> BFF[React SPA (Wisdom Pixels Web Client)]

  BFF -->|HTTP| API[Node.js REST API]
  API -->|Start/Query| MWF[Mastra Workflows Engine]
  API -->|SQL| DB[(LibSQL / SQLite)]
  API -->|HTTP| CDN[Image Storage/CDN]

  subgraph Mastra
    MWF --> A1[ContentAnalysisAgent]
    MWF --> A2[CardQueryAgent]
    MWF --> A3[CardAnswerAgent]
    MWF --> A4[ImageBriefAgent]
    MWF --> A5[SafetyAgent]
    MWF --> T1[ContentFetcherTool]
    MWF --> T2[DbTool]
    MWF --> T3[ImageGenerationTool (FLUX 2)]
    MWF --> T4[UrlSlugTool]
  end

  T3 -->|fal.subscribe| FAL[fal.ai FLUX 2 (alpha-image-232/edit-image)]
  FAL --> CDN
```

C4-style ASCII representation

Context level
  [User (Brand Marketer)] --uses--> [Wisdom Pixels Web Client (React SPA)]
  [Wisdom Pixels Web Client] --calls REST--> [Wisdom Pixels Backend API (Node + Mastra)]
  [Wisdom Pixels Backend API] --reads/writes--> [DB (LibSQL/SQLite)]
  [Wisdom Pixels Backend API] --reads--> [CDN / Object Storage]
  [Mastra Workflows Engine] --calls--> [LLM Provider(s)]
  [ImageGenerationTool] --calls--> [fal.ai FLUX 2 API]

Container level
  Container: React SPA
    Components: BrandDashboardPage, BrandSetupPage, PersonaInfluencerReviewPage, CardGenerationPage, CardGalleryPage, CardDetailPage, PublishPage.

  Container: Node Backend API
    Modules:
      - Express/Fastify controllers (/brands, /cards, /workflows).
      - Mastra integration module (startWorkflow, queryWorkflow).
      - DB access module (BrandRepository, CardRepository, etc.).

  Container: Mastra Engine
    Agents: ContentAnalysisAgent, CardQueryAgent, CardAnswerAgent, ImageBriefAgent, SafetyAgent.
    Workflows: BrandOnboardingWorkflow, CardGenerationWorkflow, PublishingWorkflow.
    Tools: ContentFetcherTool, DbTool, ImageGenerationTool, UrlSlugTool.

  Container: DB
    Tables: brands, personas, environments, influencers, cards, workflow_runs.

  Container: fal.ai FLUX 2
    Model: "fal-ai/alpha-image-232/edit-image"
    Input: { prompt, image_urls[], image_size?, output_format?, seed?, ...}
    Output: { images: [{ url, content_type, file_name, file_size, width, height }], seed }
````

4. Detailed iterative implementation and test plan

4.0 Approach and environments

```
• Development process:
  - Verification-first, TDD-inspired: define tests for each phase before or alongside implementation.
  - Iterative: Red -> Green -> Refactor -> Measure.
  - Agentic: treat Mastra agents/workflows as first-class modules, each with clear input/output contracts.

• Environments:
  - Dev: local Node + Vite dev server + local DB (LibSQL/SQLite).
  - Staging: single deployed instance (e.g., Fly.io/Render/Heroku) with fal.ai keys configured.

• Roles:
  - PM: requirements ownership, acceptance.
  - Backend engineer: Node + Mastra + DB + FLUX 2 integration.
  - Frontend engineer: React SPA screens and API integration.
  - QA/Dev: tests, dry runs, image QA.

• Suspension/Resumption criteria:
  - Suspend a phase if core tests fail repeatedly or external dependency (fal.ai, LLM provider) is unavailable.
  - Resume once root cause identified or dependency restored; revert to last GREEN commit (Git) if necessary.

• Risk register

  | Risk ID | Risk                                       | Trigger                                                | Mitigation                                                                 |
  |---------|--------------------------------------------|--------------------------------------------------------|----------------------------------------------------------------------------|
  | R-01    | fal.ai latency/timeout                     | ImageGenerationTool frequently times out               | Add retries with backoff; use queue API; limit batch size per workflow.   |
  | R-02    | Mastra misconfiguration                    | Workflows fail to start or hang                        | Add small unit tests for each workflow; log workflow status transitions.  |
  | R-03    | Unexpected LLM content (medical claims)    | SafetyAgent flags many cards or misses violations      | Tighten prompts; add deterministic regex checks for banned phrases.       |
  | R-04    | API key leakage                            | FAL_KEY or LLM keys appear in client bundle or logs    | Keep keys only in server env; scan bundles; mask logs.                    |
  | R-05    | Demo UX confusion                          | Test users do not understand the “card” concept quickly| Simplify flows; improve copy; show card grid early in demo.               |
```

4.1 Master phase schedule (WBS summary)

| Phase ID | Name                                     | Primary goal                                                     | Dependencies |
| -------- | ---------------------------------------- | ---------------------------------------------------------------- | ------------ |
| P00      | Repo and environment setup               | Baseline Node + React + DB project scaffold, CI smoke tests      | None         |
| P01      | Core data model and DB schema            | Implement DB schema and repositories for Brand-related entities  | P00          |
| P02      | Mastra foundation                        | Install Mastra, define agent/workflow scaffolding                | P01          |
| P03      | ContentAnalysisAgent and onboarding flow | Implement ContentAnalysisAgent and BrandOnboardingWorkflow       | P02          |
| P04      | CardQueryAgent and CardAnswerAgent       | Implement query/answer agents with prompts and tests             | P02          |
| P05      | SafetyAgent and ImageBriefAgent          | Implement safety checks and image brief generation               | P04          |
| P06      | ImageGenerationTool with FLUX 2          | Integrate fal.ai flux2 API and wrap in Mastra tool               | P05          |
| P07      | CardGenerationWorkflow and persistence   | Compose agents/tools into complete card generation workflow      | P06          |
| P08      | Backend REST API endpoints               | Expose brand, schema, card, and workflow APIs                    | P07          |
| P09      | React frontend core flows                | Implement brand setup, review, generation, gallery, detail views | P08          |
| P10      | Telemetry, viewCount, and publish UI     | Implement view counting, status updates, and publish screen      | P09          |
| P11      | End-to-end tests and demo hardening      | Run evals, fix issues, finalize demo script                      | P10          |

4.2 Detailed phase specifications

Phase P00 – Repo and environment setup

```
A. Scope and objectives (Impacted REQ)
  • Initialize monorepo or two repos (backend, frontend).
  • Backend: Node + TypeScript + test runner (Jest/Vitest).
  • Frontend: React + Vite + TypeScript.
  • Add basic CI (lint + unit test).
  • Requirements: REQ-105, REQ-106 (partial), REQ-105 implied.

B. Per-phase test plan
  • Test items:
    - TEST-105: npm test passes and dev servers start without error.
  • Approach:
    - Run npm run lint, npm test, npm run dev (manual check).
  • Pass/fail:
    - Pass: All commands succeed; no critical console errors.
    - Fail: Any start/test fails.

C. Exit gate rules
  • Green: All tooling in place; CI passing.
  • Yellow: Only minor lint warnings; logged for later.
  • Red: Cannot run dev or tests reliably.

D. Phase metrics

  | Metric                     | Value | Rationale                            |
  |----------------------------|-------|--------------------------------------|
  | Confidence %               | 95    | Standard boilerplate                 |
  | Long-term robustness %     | 85    | Solid starting point                 |
  | Internal interactions      | 2     | Frontend + backend                   |
  | External interactions      | 0     | None yet                             |
  | Complexity %               | 15    | Low                                  |
  | Feature creep %            | 10    | Easy to keep scope small             |
  | Technical debt %           | 15    | Minimal                              |
  | YAGNI %                    | 90    | Only essentials                      |
  | MoSCoW category            | Must  | Foundation                           |
  | Local vs Non-local changes | Local | Tooling only                         |
  | Architectural changes count| 1     | Initial skeleton                     |
```

Phase P01 – Core data model and DB schema

```
A. Scope and objectives (Impacted REQ)
  • Implement TypeScript models and migrations for Brand, Persona, Environment, Influencer, Card, WorkflowRun.
  • Implement repositories (DbTool backing) for CRUD operations.
  • Requirements: REQ-003, REQ-301..307.

B. Per-phase test plan
  • Test items:
    - TEST-301: All foreign key constraints hold.
    - TEST-304: Card.urlSlug uniqueness per brand.
    - TEST-305: Influencer.synthetic enforced as true in seed data.
  • Approach:
    - DB unit tests (using in-memory or test DB).
  • Pass/fail:
    - Pass: Schema creation and basic CRUD tests succeed.
    - Fail: FK or uniqueness violations.

C. Exit gate rules
  • Green: Schema stable; repositories usable by Mastra tools.
  • Yellow: Text fields may need later refinement.
  • Red: Inconsistent or missing relations.

D. Phase metrics

  | Metric                     | Value | Rationale                                   |
  |----------------------------|-------|---------------------------------------------|
  | Confidence %               | 85    | Well-known stack                            |
  | Long-term robustness %     | 90    | Clean schema supports future growth         |
  | Internal interactions      | 3     | Entities, DB client, tests                  |
  | External interactions      | 1     | DB engine                                   |
  | Complexity %               | 35    | Migrations + relations                      |
  | Feature creep %            | 20    | Possibly adding extra fields                |
  | Technical debt %           | 25    | Some shortcuts allowed                      |
  | YAGNI %                    | 75    | Avoid premature tables                      |
  | MoSCoW category            | Must  | Data foundation                             |
  | Local vs Non-local changes | Non-local | Affects all consumers                    |
  | Architectural changes count| 1     | DB design                                   |
```

Phase P02 – Mastra foundation

```
A. Scope and objectives (Impacted REQ)
  • Install and configure Mastra.
  • Define base Agent and Workflow abstractions.
  • Implement DbTool and ContentFetcherTool with no-op or basic implementations.
  • Requirements: REQ-106, REQ-210, REQ-201..205 (partial).

B. Per-phase test plan
  • Test items:
    - TEST-201: Simple mock workflow run returns a result.
    - TEST-210: Agents can be invoked with dummy payloads.
  • Approach:
    - Unit tests calling Mastra workflow execution.
  • Pass/fail:
    - Pass: Example workflow completes and returns expected JSON.
    - Fail: Mastra misconfigured.

C. Exit gate rules
  • Green: Mastra engine ready for real agents/workflows.
  • Yellow: Minor config issues documented.
  • Red: Cannot execute a trivial workflow.

D. Phase metrics

  | Metric                     | Value | Rationale                                |
  |----------------------------|-------|------------------------------------------|
  | Confidence %               | 80    | Newish library but documented            |
  | Long-term robustness %     | 85    | Clean separation from API                |
  | Internal interactions      | 4     | Tools, agents, workflows, DB             |
  | External interactions      | 1     | Mastra framework                         |
  | Complexity %               | 40    | Concepts + integration                   |
  | Feature creep %            | 20    | Avoid extra agents early                 |
  | Technical debt %           | 30    | Quick stubs okay                         |
  | YAGNI %                    | 80    | Only base structures                     |
  | MoSCoW category            | Must  | Backbone of agentic system               |
  | Local vs Non-local changes | Non-local | All workflows depend                  |
  | Architectural changes count| 1     | Introduce agentic layer                  |
```

Phase P03 – ContentAnalysisAgent and onboarding flow

```
A. Scope and objectives (Impacted REQ)
  • Implement ContentAnalysisAgent with prompts from SRS.
  • Implement BrandOnboardingWorkflow:
    - ContentFetcherTool fetches URLs.
    - Agent extracts product_name, personas, environments, influencer_personas, value_props.
    - DbTool persists Brand schema.
  • Implement API POST /api/brands and POST /api/brands/:id/onboard.
  • Requirements: REQ-001, REQ-002, REQ-201, REQ-202, REQ-203, REQ-301..303.

B. Per-phase test plan
  • Test items:
    - TEST-001: Creating a brand and starting onboarding works.
    - TEST-002: At least 3 personas and 3 environments extracted for FlowForm mock content.
  • Approach:
    - Use a fixed FlowForm landing page text in tests.
  • Pass/fail:
    - Pass: Schema persisted and retrievable via GET /api/brands/:id/schema.
    - Fail: Agent outputs invalid JSON or empty results.

C. Exit gate rules
  • Green: FlowForm brand onboarded end-to-end from URLs.
  • Yellow: Some text fields require manual editing but structure correct.
  • Red: Extraction fails or DB invalid.

D. Phase metrics

  | Metric                     | Value | Rationale                                |
  |----------------------------|-------|------------------------------------------|
  | Confidence %               | 75    | LLM extraction can be noisy              |
  | Long-term robustness %     | 70    | May refine prompts later                 |
  | Internal interactions      | 5     | Agent, tools, workflow, DB, API          |
  | External interactions      | 2     | LLM provider, external URLs              |
  | Complexity %               | 50    | Multi-step pipeline                      |
  | Feature creep %            | 25    | Potential to add more schema fields      |
  | Technical debt %           | 35    | Accept some extraction quirks            |
  | YAGNI %                    | 70    | Avoid complex RAG now                    |
  | MoSCoW category            | Must  | Foundation for later steps               |
  | Local vs Non-local changes | Non-local | Impacts cards later                  |
  | Architectural changes count| 1     | Adds first real workflow                 |
```

Phase P04 – CardQueryAgent and CardAnswerAgent

```
A. Scope and objectives (Impacted REQ)
  • Implement CardQueryAgent and CardAnswerAgent with prompt templates.
  • Ensure queries mention influencer and are persona/environment-specific.
  • Return structured JSON for use by CardGenerationWorkflow.
  • Requirements: REQ-008, REQ-009, REQ-303, REQ-304.

B. Per-phase test plan
  • Test items:
    - TEST-302: CardQueryAgent outputs queries containing influencer name.
    - TEST-304: CardAnswerAgent outputs responses containing product_name.
  • Approach:
    - Unit tests with fixed inputs and snapshot or structural checks.
  • Pass/fail:
    - Pass: For FlowForm, at least 3 distinct queries and answers generated correctly per persona/influencer.
    - Fail: Queries do not mention influencer or answers do not mention product.

C. Exit gate rules
  • Green: Query/answer pair quality acceptable and structured.
  • Yellow: Some manual trimming could be needed later.
  • Red: Agent outputs invalid JSON or systematically low-quality content.

D. Phase metrics

  | Metric                     | Value | Rationale                              |
  |----------------------------|-------|----------------------------------------|
  | Confidence %               | 80    | Prompts under full control             |
  | Long-term robustness %     | 75    | Text quality may be tuned              |
  | Internal interactions      | 3     | Agents, tests, data types              |
  | External interactions      | 1     | LLM provider                           |
  | Complexity %               | 40    | Prompt design, structural validation   |
  | Feature creep %            | 25    | Extra query families possible          |
  | Technical debt %           | 30    | Future re-prompting refinements        |
  | YAGNI %                    | 75    | Avoid complex style controls           |
  | MoSCoW category            | Must  | Core to card generation                |
  | Local vs Non-local changes | Non-local | Used by workflow                    |
  | Architectural changes count| 0     | Built on Mastra base                   |
```

Phase P05 – SafetyAgent and ImageBriefAgent

```
A. Scope and objectives (Impacted REQ)
  • Implement SafetyAgent with prompt to detect medical claims, missing influencer/product mentions.
  • Implement ImageBriefAgent to convert card metadata into concise image_brief strings.
  • Requirements: REQ-010, REQ-011, REQ-308.

B. Per-phase test plan
  • Test items:
    - TEST-306: SafetyAgent flags sample responses with explicit medical wording.
    - TEST-401 (new): ImageBriefAgent outputs non-empty brief under 120 words.
  • Approach:
    - Synthetic test cases for safety; check JSON structure.
  • Pass/fail:
    - Pass: Safety catches seeded violations; image briefs describe persona/influencer/environment coherently.
    - Fail: Safety misses obvious violations or briefs are unusably vague.

C. Exit gate rules
  • Green: Safety and image briefs reliable enough for demo.
  • Yellow: Some manual oversight still recommended.
  • Red: Frequent false negatives for safety.

D. Phase metrics

  | Metric                     | Value | Rationale                               |
  |----------------------------|-------|-----------------------------------------|
  | Confidence %               | 70    | Safety prompts tricky                   |
  | Long-term robustness %     | 70    | Likely iterative tuning                 |
  | Internal interactions      | 3     | Two agents + tests                      |
  | External interactions      | 1     | LLM provider                            |
  | Complexity %               | 50    | Semantic checks and imagery semantics   |
  | Feature creep %            | 30    | Could grow into policy engine           |
  | Technical debt %           | 35    | Accept some false positives             |
  | YAGNI %                    | 70    | Avoid elaborate rule systems now        |
  | MoSCoW category            | Should| Good but can be minimal for demo        |
  | Local vs Non-local changes | Non-local | Used in workflows                    |
  | Architectural changes count| 0     | Uses existing infra                     |
```

Phase P06 – ImageGenerationTool with FLUX 2

```
A. Scope and objectives (Impacted REQ)
  • Implement ImageGenerationTool using @fal-ai/client and the alpha-image-232/edit-image model.
  • Support image_urls (0–2 for influencer/product refs) and prompt; parse result.data.images[0].url.
  • Requirements: REQ-012, REQ-209, REQ-305.

B. Per-phase test plan
  • Test items:
    - TEST-501: Simple prompt with placeholder image_urls returns a valid images[0].url.
    - TEST-502: Tool handles fal.ai error/timeout and logs appropriately.
  • Approach:
    - Integration tests (guarded by environment flag); can be skipped in CI’s cheap tier.
  • Pass/fail:
    - Pass: At least one successful generation in dev; graceful handling of failures.
    - Fail: Tool crashes or silently drops errors.

C. Exit gate rules
  • Green: Reliable wrapper around fal.ai; returns imageUrl strings.
  • Yellow: Some intermittent failures but recoverable; documented.
  • Red: Cannot reliably get images.

D. Phase metrics

  | Metric                     | Value | Rationale                                  |
  |----------------------------|-------|--------------------------------------------|
  | Confidence %               | 75    | API known but network can vary             |
  | Long-term robustness %     | 80    | Encapsulated in one tool                   |
  | Internal interactions      | 3     | Tool, config, tests                        |
  | External interactions      | 1     | fal.ai FLUX 2                              |
  | Complexity %               | 45    | Async queue, schema, error handling        |
  | Feature creep %            | 20    | Resist multi-model routing now             |
  | Technical debt %           | 30    | Some config shortcuts OK                   |
  | YAGNI %                    | 80    | Only required options used                 |
  | MoSCoW category            | Must  | Visual core of cards                       |
  | Local vs Non-local changes | Non-local | Used by workflows                      |
  | Architectural changes count| 1     | Adds external provider integration         |
```

Phase P07 – CardGenerationWorkflow and persistence

```
A. Scope and objectives (Impacted REQ)
  • Compose CardQueryAgent, CardAnswerAgent, SafetyAgent, ImageBriefAgent, and ImageGenerationTool into a CardGenerationWorkflow.
  • Persist generated cards and image URLs via DbTool; generate urlSlugs via UrlSlugTool.
  • Requirements: REQ-007, REQ-008..013, REQ-301..306.

B. Per-phase test plan
  • Test items:
    - TEST-006: Workflow generates at least N=5 cards for FlowForm with valid references.
    - TEST-303: All generated cards have non-empty imageUrl.
  • Approach:
    - Use a small test run (e.g., 3 cards) with real LLM + FLUX 2 in dev.
  • Pass/fail:
    - Pass: End-to-end for FlowForm yields structurally valid cards.
    - Fail: Workflow fails, or invalid card references.

C. Exit gate rules
  • Green: CardGenerationWorkflow can generate 20 cards in a single run for FlowForm in staging.
  • Yellow: Sometimes fails due to external issues; documented with retry strategy.
  • Red: Regular failures or invalid saved cards.

D. Phase metrics

  | Metric                     | Value | Rationale                                   |
  |----------------------------|-------|---------------------------------------------|
  | Confidence %               | 70    | Multiple external dependencies              |
  | Long-term robustness %     | 75    | Workflow can be tuned                       |
  | Internal interactions      | 7     | Agents, tools, DB, workflow states          |
  | External interactions      | 2     | LLM, FLUX 2                                 |
  | Complexity %               | 60    | Multi-step pipeline                         |
  | Feature creep %            | 30    | Many tempting branches                      |
  | Technical debt %           | 40    | Some edge cases deferred                    |
  | YAGNI %                    | 65    | Keep scope minimal, no advanced branching   |
  | MoSCoW category            | Must  | Core functionality                          |
  | Local vs Non-local changes | Non-local | Affects API and UI                      |
  | Architectural changes count| 1     | Adds main orchestrated flow                 |
```

Phase P08 – Backend REST API endpoints

```
A. Scope and objectives (Impacted REQ)
  • Implement /api/brands, /api/brands/:id/onboard, /api/brands/:id/schema.
  • Implement /api/brands/:id/cards/generate, /api/brands/:id/cards, /api/cards/:cardId, /api/cards/:cardId/status, /api/workflows/:workflowId.
  • Requirements: REQ-201..208, REQ-102.

B. Per-phase test plan
  • Test items:
    - TEST-201: All endpoints respond with correct status codes and shapes.
    - TEST-102: /api/brands/:id/cards returns within 500 ms with seeded data.
  • Approach:
    - API contract tests (supertest) and perf sampling.
  • Pass/fail:
    - Pass: All endpoints reachable and structurally correct.
    - Fail: Timeouts or missing fields.

C. Exit gate rules
  • Green: Backend fully supports frontend flows.
  • Yellow: Minor response shape adjustments possible.
  • Red: Critical API missing or broken.

D. Phase metrics

  | Metric                     | Value | Rationale                                  |
  |----------------------------|-------|--------------------------------------------|
  | Confidence %               | 80    | Standard REST patterns                     |
  | Long-term robustness %     | 80    | Clear separation API/Mastra                |
  | Internal interactions      | 4     | Controllers, services, DB, Mastra          |
  | External interactions      | 0     | All internal                               |
  | Complexity %               | 45    | Mapping workflows to endpoints             |
  | Feature creep %            | 20    | Possible extra endpoints                    |
  | Technical debt %           | 30    | Some temporary response models             |
  | YAGNI %                    | 75    | Avoid unused methods                       |
  | MoSCoW category            | Must  | Exposed interface                          |
  | Local vs Non-local changes | Non-local | Affects client                          |
  | Architectural changes count| 0     | Within existing design                     |
```

Phase P09 – React frontend core flows

```
A. Scope and objectives (Impacted REQ)
  • Implement BrandDashboardPage, BrandSetupPage, PersonaInfluencerReviewPage, CardGenerationPage, CardGalleryPage, CardDetailPage.
  • Wire to backend APIs.
  • Requirements: REQ-001, REQ-004, REQ-006, REQ-017, REQ-018, REQ-101, REQ-103.

B. Per-phase test plan
  • Test items:
    - TEST-101: Trial user can perform brand setup → generate cards → view gallery in <3 minutes.
    - TEST-006: Gallery displays 20 cards retrieved from backend.
  • Approach:
    - Manual UX testing, plus component tests for key views.
  • Pass/fail:
    - Pass: End-to-end flow usable and comprehensible.
    - Fail: Navigation dead-ends or confusion.

C. Exit gate rules
  • Green: Full path in UI works with seeded/generated data.
  • Yellow: Cosmetic issues acceptable.
  • Red: User cannot reach core steps reliably.

D. Phase metrics

  | Metric                     | Value | Rationale                                  |
  |----------------------------|-------|--------------------------------------------|
  | Confidence %               | 80    | Straightforward React patterns             |
  | Long-term robustness %     | 75    | Likely to iterate on UI                    |
  | Internal interactions      | 5     | Components, router, hooks, API client      |
  | External interactions      | 1     | Backend API                                |
  | Complexity %               | 55    | Many screens, flows                        |
  | Feature creep %            | 35    | UX enhancement temptation                  |
  | Technical debt %           | 35    | Some shortcuts allowed                     |
  | YAGNI %                    | 70    | Avoid extra views                          |
  | MoSCoW category            | Must  | Demo-critical                              |
  | Local vs Non-local changes | Non-local | UI/UX across app                        |
  | Architectural changes count| 0     | Within planned SPA                         |
```

Phase P10 – Telemetry, viewCount, and publish UI

```
A. Scope and objectives (Impacted REQ)
  • Implement viewCount increment on card detail load.
  • Implement PublishPage and status changes (draft/ready/published).
  • Surface simple metrics (published cards count) in dashboard.
  • Requirements: REQ-016, REQ-020, REQ-108.

B. Per-phase test plan
  • Test items:
    - TEST-012: viewCount increments when opening card detail twice.
    - TEST-111: cards can be marked published and filtered by status.
  • Approach:
    - Manual tests and small unit tests on status update logic.
  • Pass/fail:
    - Pass: Telemetry works at least in best-effort mode; publish state persisted.
    - Fail: Status logic confusing or broken.

C. Exit gate rules
  • Green: Publish and basic telemetry behave predictably.
  • Yellow: Some edge cases unhandled but unlikely in demo.
  • Red: Major inconsistencies in state.

D. Phase metrics

  | Metric                     | Value | Rationale                              |
  |----------------------------|-------|----------------------------------------|
  | Confidence %               | 75    | Straightforward but cross-cutting      |
  | Long-term robustness %     | 70    | Likely reworked in full product        |
  | Internal interactions      | 4     | API, DB, UI, state                     |
  | External interactions      | 0     | None                                   |
  | Complexity %               | 40    | State transitions                      |
  | Feature creep %            | 25    | Might add stats panels                 |
  | Technical debt %           | 35    | Acceptable                             |
  | YAGNI %                    | 75    | Limit telemetry to minimal             |
  | MoSCoW category            | Should| Helpful but not core generation        |
  | Local vs Non-local changes | Non-local | Impacts API and UI                 |
  | Architectural changes count| 0     | No new containers                      |
```

Phase P11 – End-to-end tests and demo hardening

```
A. Scope and objectives (Impacted REQ)
  • Run end-to-end tests across brand onboarding, card generation, gallery, and detail flows.
  • Execute evaluation scenarios from section 5.
  • Fix critical bugs; tag demo-ready release.
  • Requirements: All, especially REQ-101..108.

B. Per-phase test plan
  • Test items:
    - TEST-DEV-E2E (compound eval): full brand → cards → gallery → detail.
    - TEST-102, TEST-103: performance and robustness checks.
  • Approach:
    - Scripted manual and optional Cypress/Playwright tests.
  • Pass/fail:
    - Pass: >2 full dry runs without critical failures.
    - Fail: Frequent workflow or UI failures.

C. Exit gate rules
  • Green: All critical tests pass, demo script validated.
  • Yellow: Minor known issues documented and manageable.
  • Red: Showstopper bugs unresolved.

D. Phase metrics

  | Metric                     | Value | Rationale                                  |
  |----------------------------|-------|--------------------------------------------|
  | Confidence %               | 70    | Integration always reveals surprises       |
  | Long-term robustness %     | 75    | Good basis for future iterations           |
  | Internal interactions      | 7     | Full stack                                 |
  | External interactions      | 2     | LLM + FLUX 2                               |
  | Complexity %               | 60    | E2E + debugging                            |
  | Feature creep %            | 30    | Resist tweaks close to demo                |
  | Technical debt %           | 40    | Some accepted pre-demo                     |
  | YAGNI %                    | 70    | No new features at this stage              |
  | MoSCoW category            | Must  | Gate to public demo                        |
  | Local vs Non-local changes | Non-local | May touch all layers                   |
  | Architectural changes count| 0     | Only refinements                           |
```

5. Evaluations (combined YAML)

evaluations:

- id: dev-e2e-demo
  dataset: "flowform-seed-brand"
  task: "Run full brand onboarding -> generate 20 cards -> view gallery -> open 3 card details"
  metrics:
- name: success_rate
  threshold: 1.0
- name: duration_seconds
  threshold: 300
  seed: 1
  runtime_budget_seconds: 1200

```
- id: llm-content-quality
  dataset: "sample-persona-influencer-combos"
  task: "Qualitative rating of query/answer pairs by 3 reviewers"
  metrics:
    - name: avg_relevance_score
      threshold: 0.8
    - name: medical_claims_incidents
      threshold: 0
  seed: 2
  runtime_budget_seconds: 3600

- id: flux2-image-quality
  dataset: "10 representative image_briefs"
  task: "Generate images via FLUX 2 and rate quality"
  metrics:
    - name: usable_image_ratio
      threshold: 0.8
    - name: obvious_artifacts_count
      threshold: 1
  seed: 3
  runtime_budget_seconds: 3600

- id: perf-api-gallery
  dataset: "20-card-db"
  task: "Measure /api/brands/:id/cards response time and gallery render time"
  metrics:
    - name: api_latency_ms
      threshold: 500
    - name: gallery_render_seconds
      threshold: 2.0
  seed: 4
  runtime_budget_seconds: 600

- id: adversarial-safety
  dataset: "seeded-medical-claims-responses"
  task: "Check SafetyAgent detection of prohibited claims"
  metrics:
    - name: detection_recall
      threshold: 0.9
    - name: false_negative_count
      threshold: 0
  seed: 5
  runtime_budget_seconds: 600
```

6. Tests overview

Table: Tests and mappings

| TEST ID  | Type        | Description                                              | Verifies REQ                   |
| -------- | ----------- | -------------------------------------------------------- | ------------------------------ |
| TEST-001 | acceptance  | Brand creation and onboarding trigger works              | REQ-001, REQ-002               |
| TEST-002 | functional  | Personas and environments extracted for FlowForm         | REQ-002, REQ-203, REQ-301..303 |
| TEST-006 | acceptance  | CardGenerationWorkflow creates at least N cards          | REQ-007..013, REQ-301..306     |
| TEST-012 | functional  | Card viewCount increments on detail view                 | REQ-020                        |
| TEST-101 | usability   | New user completes main flow in <3 minutes               | REQ-101                        |
| TEST-102 | performance | /api/brands/:id/cards responds <500 ms                   | REQ-102                        |
| TEST-103 | performance | Gallery of 20 cards renders <2 seconds                   | REQ-103                        |
| TEST-104 | robustness  | 95% of workflows succeed in staging                      | REQ-104                        |
| TEST-105 | structural  | Dev environment and tests run successfully               | REQ-105                        |
| TEST-106 | structural  | Agents, tools, workflows in separate modules             | REQ-106                        |
| TEST-108 | observab.   | Logs show workflow starts/ends and image errors with IDs | REQ-108                        |
| TEST-201 | contract    | All REST endpoints respond with correct shapes           | REQ-201..208                   |
| TEST-210 | contract    | Mastra agent/workflow payloads conform to JSON schemas   | REQ-210                        |
| TEST-301 | data-check  | DB foreign keys valid (Brand relations)                  | REQ-301                        |
| TEST-302 | data-check  | Card queries include influencer name                     | REQ-303                        |
| TEST-303 | data-check  | Cards have non-empty imageUrl                            | REQ-305                        |
| TEST-304 | data-check  | Card responses include product_name                      | REQ-304                        |
| TEST-305 | data-check  | Influencers synthetic and diverse                        | REQ-005, REQ-307               |
| TEST-306 | data-check  | SafetyAgent flags seeded medical claims                  | REQ-010, REQ-308               |
| TEST-401 | data-check  | ImageBriefAgent outputs concise, non-empty briefs        | REQ-011                        |
| TEST-501 | integration | FLUX 2 tool returns image URL for simple request         | REQ-012, REQ-209               |
| TEST-502 | integration | FLUX 2 tool handles errors gracefully                    | REQ-104, REQ-209               |
| TEST-111 | acceptance  | Publish status updates and filters work                  | REQ-016                        |

7. Data contract (minimal)

7.1 Schema snapshot

```
Brand
  id: string (UUID)
  name: string
  domain: string
  contentSources: string[]
  createdAt: Date
  updatedAt: Date

Persona
  id: string
  brandId: string
  label: string
  description: string
  goals: string[]
  painPoints: string[]
  tags: string[]

Environment
  id: string
  brandId: string
  label: string
  description: string
  type: "apartment" | "nature" | "clinic" | "gym" | "park" | "other"
  tags: string[]

Influencer
  id: string
  brandId: string
  name: string
  ageRange: string
  role: string
  bioShort: string
  tags: string[]
  imageUrl: string
  isDefault: boolean
  enabled: boolean
  synthetic: boolean

Card
  id: string
  brandId: string
  personaId: string
  influencerId: string
  environmentId?: string | null
  query: string
  response: string
  imageUrl: string
  urlSlug: string
  status: "draft" | "ready" | "published"
  viewCount: number
  createdAt: Date
  updatedAt: Date

WorkflowRun
  id: string
  type: "onboarding" | "card_generation" | "publishing"
  brandId: string
  payload: unknown
  result: unknown
  status: "pending" | "running" | "succeeded" | "failed"
  error?: string
  createdAt: Date
  updatedAt: Date
```

7.2 Invariants

```
• All foreign keys (brandId, personaId, influencerId, environmentId) must reference existing rows.
• Card.query must contain Influencer.name (case-insensitive).
• Card.response must contain product_name (string stored within workflow context).
• Card.imageUrl must be non-empty and start with "http" or "https".
• Card.urlSlug must be unique per Brand.id.
• Influencer.synthetic must be true in v0.
• WorkflowRun.status must reflect the actual lifecycle; error present only if status = "failed".
```

8. Reproducibility

• Version control:

- Git, trunk-based or feature-branch workflow.
- Tag for demo: v0.1-demo-mastra-flux2.

• Environment:

- Node.js LTS (e.g., 20.x).
- DB: LibSQL/SQLite (file or memory) for dev; same schema for staging.
- OS: macOS/Linux/Windows; containers optional.

• Seeds:

- Seed data for FlowForm brand, including a fixed marketing text file.
- Optional fixed seeds for LLM and FLUX 2 calls when supported by providers.

• Build and run:

- Backend:
- npm install
- npm run test
- npm run dev:server
- Frontend:
- npm install
- npm run dev:client

• Containerization:

- Optional Dockerfile for backend with Node base image, environment variables for DB and FAL_KEY.

9. RTM (Requirements Traceability Matrix)

| REQ ID  | TEST IDs           | Phase IDs     |
| ------- | ------------------ | ------------- |
| REQ-001 | TEST-001           | P03, P09      |
| REQ-002 | TEST-001, TEST-002 | P03           |
| REQ-003 | TEST-301           | P01           |
| REQ-004 | TEST-002           | P03           |
| REQ-005 | TEST-305           | P01, P03      |
| REQ-006 | TEST-101           | P09           |
| REQ-007 | TEST-006           | P07           |
| REQ-008 | TEST-302           | P04, P07      |
| REQ-009 | TEST-304           | P04, P07      |
| REQ-010 | TEST-306           | P05, P07      |
| REQ-011 | TEST-401           | P05, P07      |
| REQ-012 | TEST-501, TEST-502 | P06, P07      |
| REQ-013 | TEST-006, TEST-303 | P07           |
| REQ-014 | TEST-201, TEST-102 | P08           |
| REQ-015 | TEST-201           | P08           |
| REQ-016 | TEST-111           | P10           |
| REQ-017 | TEST-006, TEST-103 | P09           |
| REQ-018 | TEST-101           | P09           |
| REQ-019 | TEST-101           | P09           |
| REQ-020 | TEST-012           | P10           |
| REQ-101 | TEST-101           | P09, P11      |
| REQ-102 | TEST-102           | P08, P11      |
| REQ-103 | TEST-103           | P09, P11      |
| REQ-104 | TEST-104           | P07, P11      |
| REQ-105 | TEST-105           | P00           |
| REQ-106 | TEST-106           | P02           |
| REQ-107 | TEST-501           | P06           |
| REQ-108 | TEST-108           | P10, P11      |
| REQ-201 | TEST-201           | P08           |
| REQ-202 | TEST-201           | P03, P08      |
| REQ-203 | TEST-002, TEST-201 | P03, P08      |
| REQ-204 | TEST-201           | P08           |
| REQ-205 | TEST-201           | P08           |
| REQ-206 | TEST-201, TEST-102 | P08, P11      |
| REQ-207 | TEST-201           | P08           |
| REQ-208 | TEST-201           | P08           |
| REQ-209 | TEST-501, TEST-502 | P06           |
| REQ-210 | TEST-210           | P02, P03, P07 |
| REQ-301 | TEST-301           | P01           |
| REQ-302 | TEST-301           | P01           |
| REQ-303 | TEST-302           | P04, P07      |
| REQ-304 | TEST-304           | P04, P07      |
| REQ-305 | TEST-303, TEST-501 | P06, P07      |
| REQ-306 | TEST-304           | P01, P07      |
| REQ-307 | TEST-305           | P01           |
| REQ-308 | TEST-306           | P05, P07      |

10. Execution log (living document template)

10.1 Phase status table template

| Phase ID | Status  | Last updated | Owner |
| -------- | ------- | ------------ | ----- |
| P00      | Pending |              |       |
| P01      | Pending |              |       |
| P02      | Pending |              |       |
| P03      | Pending |              |       |
| P04      | Pending |              |       |
| P05      | Pending |              |       |
| P06      | Pending |              |       |
| P07      | Pending |              |       |
| P08      | Pending |              |       |
| P09      | Pending |              |       |
| P10      | Pending |              |       |
| P11      | Pending |              |       |

10.2 Per-phase execution notes (repeat for each Pxx)

```
Phase: Pxx
Status: Pending / InProgress / Done
Start date:
End date:
Completed steps:
  • ...
Tests run and results:
  • TEST-xxx: pass/fail, notes
Issues encountered:
  • Problem:
  • Root cause:
  • Resolution:
Failed attempts / alternative trials:
  • Attempt:
  • Outcome:
Lessons learned:
  • ...
Design/architecture choices made:
  • ...
Deviations from plan:
  • Description:
  • Reason:
Next actions:
  • ...
```

10.3 Overall project retrospection (after completion)

```
• What worked well:
  - ...
• What should change in next iteration:
  - ...
• Impact on architecture and requirements:
  - ...
```

11. Assumptions (consolidated)

• fal.ai FLUX 2 model "alpha-image-232/edit-image" remains available and stable.
• LLM provider used by Mastra agents can handle the prompt volumes required.
• Costs of LLM and FLUX 2 calls during dev and staging are acceptable.
• Synthetic data for FlowForm is sufficient to evaluate UX and architecture.
• No personally identifiable information or real influencer likeness is used in the v0 system.
• Demo environment has reliable network connectivity to fal.ai and LLM provider endpoints.

12. Consistency check

• All REQ-### identifiers referenced in TEST-### are defined in SRS.
• All TEST-### are linked to at least one REQ-### in the Tests Overview and RTM.
• Every Phase P00–P11 in the WBS has a detailed specification with scope, test plan, exit rules, and metrics.
• Phase granularity satisfies constraints: each phase focuses on a specific layer or requirement subset (no multi-layer giant phases).
• Evaluation metrics are aligned with non-functional requirements (performance, robustness, content quality).
• Architecture diagrams match the described data contract and external integration (Mastra, fal.ai FLUX 2, React SPA, DB).
• The plan supports a verification-first, agentic, iterative implementation that can be executed by human or LLM agents while preserving state safety via version control.

===
