=== document: plans/wisdom-pixels-mastra-flux2-react-plan-v2.md ===

1. Title and metadata

Project name: Wisdom Pixels – Mastra + Nano Banana Pro + React Implementation (v0)
Version: 0.3-draft
Owners: Kirill (Product/Founder), Principal RE-PM, Core Eng Team
Date: 2025-11-24
Contact: [to-fill]
Document ID: WP-MASTRA-FLUX2-PLAN-003

Summary:
This document defines a standards-aligned product and system plan for implementing Wisdom Pixels with a Mastra-based backend, fal.ai Nano Banana Pro (fal-ai/nano-banana-pro and fal-ai/nano-banana-pro/edit) for photorealistic image generation, and a React SPA frontend. It converts prior architectural discussions into a single, implementation-ready plan suitable for human- or LLM-led development, including clearly defined agents, full prompt catalog, agentic workflows, tests, and iterative phases, following ISO/IEC/IEEE 29148, 29119-3, and 12207 principles.

2. PRD (Stakeholder/system needs)

2.1 Problem

```
Brands increasingly care about how AI assistants describe their products, but current workflows stop at landing pages and ad creatives. They do not generate structured, multi-modal training examples (query, answer, image) that can align AI assistants with brand narratives and influencer endorsements. Creating this content manually is slow, inconsistent, and difficult to scale across personas, influencers, and environments.
```

2.2 Users and value

```
Primary user
  • Brand marketer, growth lead, or agency strategist responsible for performance marketing, SEO/AEO, and influencer campaigns.

Secondary (future) user
  • Influencer/creator who licenses their likeness to the brand and co-owns content.

Value for users
  • Automatically transform marketing content into “Wisdom Cards”: realistic customer queries, influencer-backed answers, and photorealistic images of the product in context.
  • Enforce constraints: queries mention the influencer; answers mention the product; no medical claims; environments and personas match the brand.
  • Provide a high-quality, multi-modal dataset suitable for AI search, recommendation systems, and instruction-style fine-tuning.
```

2.3 Example product: FlowForm Motion Suit (10-sensor suit)

```
Product concept
  • FlowForm Motion Suit is a smart, body-hugging training suit for “desk-body athletes” (people who work at a computer but care about movement quality).
  • The suit combines lightweight compression fabric with ten low-profile motion sensor pods and a companion app that delivers form and alignment feedback.

Hardware and sensor layout
  • One-piece or two-piece compression outfit (top and leggings), black or dark charcoal, with subtle seams.
  • Ten sensor pods integrated into the fabric:
    - 2 on upper arms (outside, above elbows)
    - 2 on forearms (outer forearms, nearer wrists)
    - 2 on thighs (outer mid-thigh)
    - 2 on shins (outer shins, above ankles)
    - 1 on upper chest (centerline, below collarbone)
    - 1 in a slim headband
  • Pods track orientation and acceleration, enabling reconstruction of joint angles, symmetry, and smoothness of motion. In visuals, they appear as small, matte, slightly raised disks or ovals.

Companion app and feedback
  • Wireless connection to phone, tablet, or TV.
  • Provides simplified body outline and metrics instead of dense dashboards.
  • Focus on:
    - Alignment cues (hips level, knees over ankles).
    - Symmetry between left/right side.
    - Controlled transitions in and out of poses.
  • Feedback is phrased as calm coaching cues similar to a yoga teacher: “soften knees,” “tilt pelvis slightly forward,” “root through both feet evenly.”

Target users and usage scenarios
  • Yoga practitioners practicing at home.
  • Remote workers doing short mobility/strength routines.
  • Beginner runners wanting to bring yoga-like awareness into their stride.
  • Mid-career professionals unlearning “bad movement habits” from years of sitting.

  Example scenes:
    - Morning yoga in a compact city apartment with sunlight and a plant by the window.
    - Flow-based warm-up on a mountain deck with waterfall in the background.
    - Light strength session in a simple home gym corner.
    - Easy jog in a park trail, suit worn under a light top.
    - Doctor/physical therapist in clinic clothing demonstrating posture and small corrective exercises.

Positioning
  • “The coach and yoga teacher inside your clothes,” not a medical device. It helps you learn better movement habits via feedback, without diagnosing or treating injuries.
```

2.4 Business goals

```
  • Ship a working v0 that can:
  - Ingest FlowForm’s marketing content.
  - Extract personas, environments, and influencer personas.
  - Generate at least 20 Wisdom Cards via an agentic Mastra workflow and fal.ai Nano Banana Pro models.
  - Display and manage these cards in a React UI.
• Use this v0 as a demo for hackathons and as a foundation for a production system.
• Ensure the system is agentic and modular, so additional brands, influencers, and content types can be added later.
```

2.5 Success metrics

```
Product/demonstration
  • 1 brand (FlowForm) fully onboarded.
  • 20+ cards generated with valid queries, answers, and image URLs.
  • Demo viewers can explain “what Wisdom Pixels does” after a 1–3 minute walkthrough.

Technical
  • 95%+ workflow success rate for generating 20 cards in staging.
  • Nano Banana Pro generation completes within 60s per image (average) in dev/staging.
  • Gallery of 20 cards loads in under 2 seconds on a typical laptop.
```

2.6 Scope

```
In scope
  • React SPA frontend:
    - Brand dashboard, setup, review, generation, gallery, detail, publish.
  • Node.js + TypeScript backend:
    - REST API for brands, cards, workflows.
    - Mastra-powered agents, workflows, tools.
  • Mastra agents:
    - ContentAnalysisAgent, CardQueryAgent, CardAnswerAgent, ImageBriefAgent, SafetyAgent.
  • Mastra workflows:
    - BrandOnboardingWorkflow, CardGenerationWorkflow, PublishingWorkflow.
  • Tools:
    - ContentFetcherTool, DbTool, ImageGenerationTool (fal.ai Nano Banana Pro), UrlSlugTool.
  • Data store:
    - LibSQL/SQLite for v0; same schema portable to Postgres later.

Out of scope
  • Real influencer licensing, payments, or legal workflows.
  • Full production multi-tenant auth/permissions.
  • RAG over large brand knowledge bases (planned later).
  • Video or 3D generation; only still images.
```

2.7 Dependencies

```
• Mastra libraries and runtime.
• LLM provider(s) for agents (e.g., OpenAI, Gemini) via Mastra.
• fal.ai account and FAL_KEY for Nano Banana Pro (fal-ai/nano-banana-pro and fal-ai/nano-banana-pro/edit) API access.
• LibSQL/SQLite DB.
• React + Vite tooling.
• Git and CI.
```

2.8 Risks

```
• fal.ai delays or failures causing slow/failed card generation.
• Poor or inconsistent images from Nano Banana Pro prompts.
• LLM agents producing unsafe or off-brand content despite SafetyAgent.
• Overbuilding infrastructure vs. hackathon timeline.
• Demo environment network instability.
```

2.9 Assumptions (high level)

```
• FlowForm is fictional; we still avoid medical claims to set a high bar.
• All influencers are synthetic; no PII or real likeness is used.
• Mastra APIs remain stable.
• LLM and image generation costs are acceptable for v0.
```

3. SRS (System requirements)

3.1 Functional requirements (REQ-###, type: func)

| ID      | Type | Description                                                                                                                                    | Priority |
| ------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-001 | func | System shall allow creating a Brand with name, domain, and content URLs via the React frontend and backend API.                                | Must     |
| REQ-002 | func | System shall use Mastra BrandOnboardingWorkflow to fetch marketing content and extract personas, environments, and influencer personas.        | Must     |
| REQ-003 | func | System shall persist Brand, Persona, Environment, and Influencer entities in a LibSQL/SQLite DB.                                               | Must     |
| REQ-004 | func | System shall expose GET /api/brands/:id/schema returning brand, personas, environments, and influencers for review.                            | Must     |
| REQ-005 | func | System shall represent at least 5 synthetic Influencer profiles per brand, including one in 30s and others with diverse ages/backgrounds.      | Must     |
| REQ-006 | func | System shall allow a user to select persona(s), influencer(s), and desired card count in the React UI.                                         | Must     |
| REQ-007 | func | System shall start a Mastra CardGenerationWorkflow when POST /api/brands/:id/cards/generate is called.                                         | Must     |
| REQ-008 | func | CardGenerationWorkflow shall call CardQueryAgent to generate realistic customer queries that mention the influencer by name.                   | Must     |
| REQ-009 | func | CardGenerationWorkflow shall call CardAnswerAgent to generate influencer-backed responses referencing the product and scene.                   | Must     |
| REQ-010 | func | CardGenerationWorkflow shall call SafetyAgent to flag medical claims or missing influencer/product mentions, and drop or re-prompt such cards. | Should   |
| REQ-011 | func | CardGenerationWorkflow shall call ImageBriefAgent to generate concise image briefs from card metadata.                                         | Must     |
| REQ-012 | func | CardGenerationWorkflow shall call ImageGenerationTool, which invokes fal.ai alpha-image-232/edit-image, and store returned image URLs.         | Must     |
| REQ-013 | func | System shall persist generated cards, including query, response, personaId, influencerId, environmentId, and imageUrl.                         | Must     |
| REQ-014 | func | System shall expose GET /api/brands/:id/cards to list cards, filterable by status, persona, and influencer.                                    | Must     |
| REQ-015 | func | System shall expose GET /api/cards/:cardId to return full card details.                                                                        | Must     |
| REQ-016 | func | System shall support PATCH /api/cards/:cardId/status to change card status (draft/ready/published).                                            | Should   |
| REQ-017 | func | React app shall render a Card Gallery view with thumbnails, influencer badges, and filters.                                                    | Must     |
| REQ-018 | func | React app shall render a Card Detail view with full image, query, response, influencer, persona, environment, and a unique URL slug.           | Must     |
| REQ-019 | func | React app shall allow local (non-persisted) editing of query and response fields in Card Detail view for v0.                                   | Should   |
| REQ-020 | func | System shall track a simple viewCount per card (incremented on card detail view) in-memory or in DB.                                           | Should   |

3.2 Non-functional requirements (nfr/perf)

| ID      | Type | Description                                                                                                      | Priority |
| ------- | ---- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-101 | nfr  | Usability: a new user should be able to onboard FlowForm, generate cards, and view gallery in under 3 minutes.   | Must     |
| REQ-102 | perf | GET /api/brands/:id/cards for 20 cards shall respond in under 500 ms in test/staging.                            | Must     |
| REQ-103 | perf | React gallery rendering 20 cards shall complete in under 2 seconds on a modern laptop.                           | Must     |
| REQ-104 | nfr  | Reliability: 95% of CardGenerationWorkflow runs for 20 cards shall finish without error in staging.              | Must     |
| REQ-105 | nfr  | Security: FAL_KEY and LLM API keys shall be server-side only and never exposed to the browser.                   | Must     |
| REQ-106 | nfr  | Maintainability: Mastra agents, workflows, and tools shall be defined in separate modules with clear interfaces. | Must     |
| REQ-107 | perf | Nano Banana Pro image generation tool shall complete a single request within 60s on average in test/staging.      | Should   |
| REQ-108 | nfr  | Observability: system shall log workflow starts/ends and image-generation errors with correlation IDs.           | Should   |

3.3 Interfaces / APIs (int)

| ID      | Type | Description                                                                                                                                                                 |
| ------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-201 | int  | POST /api/brands accepts { name, domain, urls[] } and returns { brandId }.                                                                                                  |
| REQ-202 | int  | POST /api/brands/:id/onboard triggers BrandOnboardingWorkflow and returns { workflowId }.                                                                                   |
| REQ-203 | int  | GET /api/brands/:id/schema returns { brand, personas[], environments[], influencers[] }.                                                                                    |
| REQ-204 | int  | POST /api/brands/:id/cards/generate triggers CardGenerationWorkflow and returns { workflowId }.                                                                             |
| REQ-205 | int  | GET /api/workflows/:workflowId returns { status, progress, result? }.                                                                                                       |
| REQ-206 | int  | GET /api/brands/:id/cards supports query params status, personaId, influencerId; returns CardSummary[].                                                                     |
| REQ-207 | int  | GET /api/cards/:cardId returns full Card object.                                                                                                                            |
| REQ-208 | int  | PATCH /api/cards/:cardId/status accepts { status } and returns updated Card.                                                                                                |
| REQ-209 | int  | ImageGenerationTool shall call fal.subscribe with fal-ai/nano-banana-pro (text-to-image) and fal-ai/nano-banana-pro/edit (image-to-image) using { input: { prompt, num_images, aspect_ratio, output_format, image_urls? }} and parse result.data.images[0].url. |
| REQ-210 | int  | Mastra agents and workflows shall use JSON schemas defined in the Data Contract to exchange data.                                                                           |

3.4 Data requirements (data)

| ID      | Type | Description                                                                                                                                     |
| ------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-301 | data | Persona, Environment, Influencer, and Card rows must reference an existing Brand via brandId.                                                   |
| REQ-302 | data | Each Card must reference valid personaId, influencerId, and optional environmentId.                                                             |
| REQ-303 | data | Card.query must contain Influencer.name (case-insensitive substring).                                                                           |
| REQ-304 | data | Card.response must mention product_name at least once.                                                                                          |
| REQ-305 | data | Card.imageUrl must be a non-empty string containing a reachable URL returned by Nano Banana Pro or object storage.                               |
| REQ-306 | data | Card.urlSlug must be unique per brand.                                                                                                          |
| REQ-307 | data | Influencer.synthetic must be true for all influencers in v0.                                                                                    |
| REQ-308 | data | LLM-generated content must not contain explicit medical, diagnostic, curative, or injury-prevention claims; such content must not be published. |

3.5 Error and telemetry expectations

```
• All REST endpoints return standardized error payloads: { error: { code, message, details? } }.
• WorkflowRun table tracks status transitions and errors.
• All calls to ImageGenerationTool log:
  - model name, prompt hash, workflowId, cardId, and any fal.ai error codes.
• Card viewCount increments on card detail GET; failures to update should not break the UI.
```

3.6 Acceptance criteria (mapped to TEST-###)

```
• Each functional REQ is mapped to at least one TEST (section 6).
• Non-functional REQs are covered by perf, usability, and robustness tests.
• A full end-to-end test (dev-e2e-demo) verifies the main flow.
```

3.7 System architecture diagram

````
Mermaid

```mermaid
graph TD
  U[Brand Marketer] --> FE[React SPA (Wisdom Pixels)]

  FE -->|HTTP JSON| API[Node.js REST API]
  API -->|start/query| MWF[Mastra Workflows Engine]
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
    MWF --> T3[ImageGenerationTool (Nano Banana Pro)]
    MWF --> T4[UrlSlugTool]
  end

  T3 -->|fal.subscribe| FAL[fal.ai nano-banana-pro / nano-banana-pro/edit]
  FAL --> CDN
```

C4 ASCII

Context level
  [Brand Marketer] --uses--> [React SPA]
  [React SPA] --calls REST--> [Node API]
  [Node API] --invokes--> [Mastra Engine]
  [Node API] --reads/writes--> [LibSQL/SQLite DB]
  [Mastra Engine] --calls--> [LLM Provider]
  [ImageGenerationTool] --calls--> [fal.ai Nano Banana Pro]
  [React SPA] --loads images--> [CDN / object storage]

Container level
  Container: React SPA
    • Pages: BrandDashboard, BrandSetup, PersonaInfluencerReview, CardGeneration, CardGallery, CardDetail, Publish.

  Container: Node API
    • Modules:
      - BrandController, CardController, WorkflowController
      - MastraAdapter (startWorkflow, getWorkflowStatus)
      - Repositories (BrandRepo, PersonaRepo, EnvRepo, InfluencerRepo, CardRepo)

  Container: Mastra Engine
    • Agents: ContentAnalysisAgent, CardQueryAgent, CardAnswerAgent, ImageBriefAgent, SafetyAgent.
    • Workflows: BrandOnboardingWorkflow, CardGenerationWorkflow, PublishingWorkflow.
    • Tools: ContentFetcherTool, DbTool, ImageGenerationTool, UrlSlugTool.

  Container: DB
    • Tables: brands, personas, environments, influencers, cards, workflow_runs.

  Container: fal.ai
    • Models: nano-banana-pro (text-to-image), nano-banana-pro/edit (image-to-image)
    • Input: prompt (+ optional image_urls[] for edit)
    • Output: images[] with URLs.
````

3.8 Prompt catalog and agentic workflow design

```
3.8.1 Design rationale for agent decomposition

  • ContentAnalysisAgent:
    - Responsibility: turn raw marketing text into structured schema (personas, environments, influencer personas, value props).
    - Reasoning: decouples messy HTML scraping from structured data; centralizes “how we understand a product.”

  • CardQueryAgent:
    - Responsibility: generate realistic user queries mentioning influencers.
    - Reasoning: query-space and answer-space are different; splitting queries from answers allows better control and coverage.

  • CardAnswerAgent:
    - Responsibility: produce influencer-backed, product-referencing answers aligned with persona/environment.
    - Reasoning: copywriting and tone control are separate from query generation; improves safety and clarity.

  • ImageBriefAgent:
    - Responsibility: convert card metadata into concise visual specifications for Nano Banana Pro.
    - Reasoning: uses a structured Subject + Action + Style + Context framework and keeps visual prompts separated from answer prose.

  • SafetyAgent:
    - Responsibility: enforce content invariants (no medical claims, influencer/product mention).
    - Reasoning: centralized policy enforcement; easier to iterate on rules without touching other agents.

3.8.2 ContentAnalysisAgent prompts

  System prompt (CONTENT_ANALYSIS_SYSTEM):

  "You are a senior product marketing analyst working for Wisdom Pixels, a system that turns brand content into AI training cards.

  Input:
  - Raw marketing content for a single product.

  Task:
  - Extract structured information in this exact JSON schema:

  {
    "product_name": string,
    "brand_name": string,
    "product_summary": string,
    "personas": [
      {
        "id": string,
        "label": string,
        "description": string,
        "goals": string[],
        "pain_points": string[],
        "tags": string[]
      }
    ],
    "environments": [
      {
        "id": string,
        "label": string,
        "description": string,
        "type": "apartment" | "nature" | "clinic" | "gym" | "park" | "other",
        "tags": string[]
      }
    ],
    "influencer_personas": [
      {
        "id": string,
        "label": string,
        "age_range": string,
        "role": string,
        "bio_short": string,
        "tags": string[]
      }
    ],
    "value_props": [
      {
        "id": string,
        "feature": string,
        "benefit": string,
        "proof_or_reason": string
      }
    ]
  }

  Guidelines:
  - Use concise but concrete language.
  - Prefer 3–5 personas and 3–5 environments.
  - For influencer_personas, invent profiles consistent with the content (e.g. yoga PT, mobility coach, remote creative).
  - Do NOT add medical or diagnostic claims. Focus on form feedback, awareness, comfort, and convenience.
  - Output only a valid JSON object, no markdown or commentary."

  User prompt (CONTENT_ANALYSIS_USER):

  "Analyze the following marketing content and produce the JSON object as specified in the system instructions.

  Content:
  {{marketing_text}}"

3.8.3 CardQueryAgent prompts

  System prompt (CARD_QUERY_SYSTEM):

  "You are an answer-engine optimization (AEO) specialist for Wisdom Pixels.

  Task:
  - Generate realistic user queries that an ideal customer would ask an assistant like ChatGPT.
  - Each query must:
    - Sound like a real human question.
    - Explicitly mention the influencer’s name.
    - Reflect the persona’s goals and pain points.
    - Fit the specified environment and product.

  Input:
  - product_name, brand_name, product_summary
  - persona (JSON)
  - environment (JSON)
  - influencer (JSON)
  - desired_query_count

  Output:
  - JSON:
  {
    "queries": [
      {
        "id": string,
        "text": string
      }
    ]
  }

  Query patterns to include:
  - 'What does [InfluencerName] use for X?'
  - 'Is [ProductName] worth it according to [InfluencerName]?'
  - 'How does [InfluencerName] handle [specific situation] with [ProductName]?'
  - Comparisons vs common alternatives (phone video, mirror) without naming competitors unless explicitly provided.

  Constraints:
  - No medical or diagnostic claims.
  - Each query under 30 words."

  User prompt (CARD_QUERY_USER):

  "Generate {{desired_query_count}} realistic user queries.

  product_name: {{product_name}}
  brand_name: {{brand_name}}
  product_summary: {{product_summary}}

  persona:
  {{persona_json}}

  environment:
  {{environment_json}}

  influencer:
  {{influencer_json}}"

3.8.4 CardAnswerAgent prompts

  System prompt (CARD_ANSWER_SYSTEM):

  "You are an expert copywriter for Wisdom Pixels. You write helpful, honest answers that reference influencers and products correctly.

  Task:
  - For each query, write a single-paragraph answer that:
    - Mentions the influencer by name and role.
    - Mentions the product by name.
    - Describes how the influencer uses the product in a concrete scene matching the environment.
    - Connects to the persona’s goals and pain points.
    - Does not make medical or diagnostic claims (no 'treats', 'cures', 'prevents injury').

  Output:
  - JSON:
  {
    "cards": [
      {
        "query_id": string,
        "query": string,
        "response": string
      }
    ]
  }

  Style:
  - Friendly and practical, not shouty or salesy.
  - 3–6 sentences per response.
  - Include enough visual detail (location, pose, time of day, key objects) so an image model can visualize the scene."

  User prompt (CARD_ANSWER_USER):

  "Generate answer paragraphs for the following queries.

  product_name: {{product_name}}
  brand_name: {{brand_name}}
  product_summary:
  {{product_summary}}

  persona:
  {{persona_json}}

  environment:
  {{environment_json}}

  influencer:
  {{influencer_json}}

  queries:
  {{queries_json_array}}"

3.8.5 ImageBriefAgent prompts (image-generation style)

  System prompt (IMAGE_BRIEF_SYSTEM):

  "You are an art director for Wisdom Pixels. You convert card metadata into concise prompts for a photorealistic image generator (Nano Banana Pro).

  Use a structured prompt framework: Subject + Action + Style + Context, with optional visual/technical layers.

  Task:
  - Produce a single 'image_brief' string describing:
    - Subject: who the influencer is (age range, general look) and what they are wearing (FlowForm-like motion suit with 10 subtle sensor pods).
    - Action: what they are doing (e.g., yoga pose, light strength movement, easy run, clinic demonstration).
    - Style: photorealistic product photography.
    - Context: environment details, lighting, mood.
    - Optional: focal length and aperture for realism.

  Constraints:
  - Under 120 words.
  - No mention of camera brands or lens brands.
  - No on-image text or UI overlays.
  - Emphasize clear visibility of the suit and sensor pods.
  - Positive phrasing; describe what should be visible, not what to exclude.

  Output:
  - JSON: { "image_brief": string }"

  User prompt (IMAGE_BRIEF_USER):

  "Create an image brief for this Wisdom Pixels card.

  product_name: {{product_name}}
  product_summary:
  {{product_summary}}

  persona:
  {{persona_json}}

  environment:
  {{environment_json}}

  influencer:
  {{influencer_json}}

  card:
  {{card_json}}"

3.8.6 SafetyAgent prompts

  System prompt (SAFETY_SYSTEM):

  "You are a safety and quality checker for Wisdom Pixels.

  Task:
  - Inspect each card (query + response) and flag:
    - medical_claims: true if the response includes any medical, diagnostic, curative, or injury-prevention claims.
    - missing_influencer: true if the influencer’s name does not appear in the query or response.
    - missing_product: true if the product’s name does not appear in the response.
    - other_issues: brief notes if anything feels misleading, exaggerated, or unsafe.

  Output:
  - JSON:
  {
    "results": [
      {
        "card_id": string,
        "medical_claims": boolean,
        "missing_influencer": boolean,
        "missing_product": boolean,
        "other_issues": string
      }
    ]
  }

  Be conservative: it is better to flag possible problems than to miss them."

  User prompt (SAFETY_USER):

  "Check the following cards for safety and completeness.

  product_name: {{product_name}}
  influencer_name: {{influencer_name}}

  cards:
  {{cards_json_array}}"

3.8.7 Image prompt templates for ImageGenerationTool (Nano Banana Pro)

  Text-only prompt (no reference images):

  "Smart black motion-tracking suit with ten subtle sensor pods on both arms, both legs, chest and a slim headband, {{subject_description}} {{action_description}}, ultra-realistic product photography, {{environment_description}}, {{lighting_description}}, crisp details on the suit and sensor pods, calm focused mood, 35mm lens, f/4, natural color grading"

  Where:
    • subject_description: e.g., “worn by a mid-30s yoga practitioner with an athletic build”.
    • action_description: e.g., “holding a strong warrior II pose”.
    • environment_description: e.g., “small sunlit apartment living room with a yoga mat and a plant by a large window”.
    • lighting_description: e.g., “soft natural morning light”.

  Text + reference images prompt (with influencer and product refs):

  "Smart black motion-tracking suit with ten subtle sensor pods on both arms, both legs, chest and a slim headband, {{subject_description}} {{action_description}}, ultra-realistic product photography, {{environment_description}}, {{lighting_description}}, crisp details on the suit and sensor pods, calm focused mood, 35mm lens, f/4, natural color grading, the person and suit should closely match the provided reference images"

  The ImageGenerationTool will:
    • Build image_brief via ImageBriefAgent.
    • Derive subject_description, action_description, environment_description, lighting_description from image_brief.
    • If influencerRef/productRef images are available, include them in image_urls[] passed to fal.ai.

  Split-scene variant (apartment + mountains):

  "Photorealistic split-image composition for a smart motion suit ad. Left side: {{subject_description}} in a compact city apartment, wearing the motion-tracking suit, performing a yoga pose on a mat by a large window with plants, soft morning light. Right side: the same person in the same suit on a wooden deck in the mountains, performing a similar yoga pose near a gentle waterfall and lush green forest, natural daylight. Ultra-realistic product photography, crisp details on suit and sensor pods, balanced clean composition."

  Implementation note:
    • The ImageGenerationTool is responsible for selecting which template variant to use based on environment.type and card metadata.
```

4. Detailed iterative implementation and test plan (12207 + 29119-3)

4.0 Approach, environments, roles, risk

```
• Approach:
  - Verification-first: define tests and evals for each requirement.
  - TDD loop: Red → Green → Refactor → Measure.
  - Agentic: treat each Mastra agent and workflow as an independent unit with contracts and tests.
  - State safety: use Git; revert to last GREEN commit when necessary.
  - Test lifecycle:
    - Before starting any phase Pxx: run the phase’s primary tests on the current baseline (where applicable) and record results in the execution log to establish a pre-change baseline.
    - After completing implementation work in Pxx: rerun the same tests plus any newly added ones; only mark the phase Done if all binding tests and thresholds pass.

• Environments:
  - Dev: local Node + Vite, SQLite file DB, dev keys for LLM and FLUX.
  - Staging: single deployed instance with proper secrets.

• Roles:
  - PM: maintains PRD/SRS, signs off acceptance tests.
  - Backend engineer: Node, Mastra, DB, FLUX integration.
  - Frontend engineer: React SPA, API integration.
  - QA/dev: tests, manual evals, image QA.

• Suspension/resumption:
  - Suspend a phase if core tests fail repeatedly or external dependencies (LLM, fal.ai) are unavailable > N hours.
  - Resume after root cause analysis and either fix or revert to last GREEN commit.

• Risk register

  | Risk ID | Risk                                       | Trigger                                            | Mitigation                                                                |
  |---------|--------------------------------------------|----------------------------------------------------|---------------------------------------------------------------------------|
  | R-01    | FLUX 2 latency/timeouts                    | ImageGenerationTool calls exceed 60s or fail often | Retry/backoff, queue images, pre-generate demo images, fallback placeholder |
  | R-02    | Mastra misconfiguration                    | Workflows fail to start or hang                    | Small test workflows, logs, unit tests for each workflow                  |
  | R-03    | Unsafe/medical content slips past Safety   | Safety misses seeded violations                    | Tighten prompts, add regex rules, add human spot-check for demo           |
  | R-04    | API key leakage                            | Keys in client bundle or logs                      | Keep in server env only, config scanning, log scrubbing                   |
  | R-05    | Demo UX confusing                          | Test users don’t grok “card” concept quickly       | Simplify copy, ensure gallery is central, rehearse demo script            |
```

4.1 Master phase schedule (WBS summary)

| Phase ID | Name                                       | Primary goal                                               | Dependencies |
| -------- | ------------------------------------------ | ---------------------------------------------------------- | ------------ |
| P00      | Repo and environment setup                 | Baseline Node + React + DB scaffold, CI smoke tests        | None         |
| P01      | Core data model and DB schema              | Implement DB schema and repositories                       | P00          |
| P02      | Mastra foundation                          | Install Mastra, define base agents/tools/workflows         | P01          |
| P03      | ContentAnalysisAgent and onboarding flow   | Implement content analysis and BrandOnboardingWorkflow     | P02          |
| P04      | CardQueryAgent and CardAnswerAgent         | Implement query/answer agents and tests                    | P02          |
| P05      | SafetyAgent and ImageBriefAgent            | Implement safety and image brief agents                    | P04          |
| P06      | ImageGenerationTool with FLUX 2            | Integrate fal.ai (alpha-image-232/edit-image)              | P05          |
| P07      | CardGenerationWorkflow and persistence     | Compose full card generation workflow and save cards       | P06          |
| P08      | Backend REST API endpoints                 | Expose brand, schema, card, and workflow APIs              | P07          |
| P09      | React frontend core flows                  | Implement brand setup, review, generation, gallery, detail | P08          |
| P10      | Telemetry, viewCount, and backend metrics  | Implement backend telemetry and view counts                | P09          |
| P11      | Publish UI and status management           | Implement publish screen and status filtering in UI        | P10          |
| P12      | End-to-end tests and demo hardening        | Run evals, fix issues, finalize demo                       | P11          |

4.2 Detailed phase specifications

Phase P00 – Repo and environment setup

```
A. Scope and objectives (Impacted REQ-###)
  • Initialize backend and frontend projects.
  • Configure TypeScript, linting, tests, and minimal CI.
  • Requirements: REQ-105, REQ-106 (partial).

B. Per-phase test plan
  • Test items:
    - TEST-105: npm test, npm run lint, npm run dev succeed.
  • Approach:
    - Manual and CI runs.
  • Pass/fail:
    - Pass: All commands succeed; no critical errors.
    - Fail: Any command fails.

C. Exit gate rules
  • Green: Dev tools and CI pipeline ready.
  • Yellow: Minor lint warnings only.
  • Red: Project cannot build or run.

D. Phase metrics

  | Metric                     | Value | Rationale                            |
  |----------------------------|-------|--------------------------------------|
  | Confidence %               | 95    | Standard tooling                     |
  | Long-term robustness %     | 85    | Typical Node/React setup             |
  | Internal interactions      | 2     | Frontend + backend                   |
  | External interactions      | 0     | None yet                             |
  | Complexity %               | 15    | Low                                  |
  | Feature creep %            | 10    | Easy to constrain                    |
  | Technical debt %           | 15    | Minimal                              |
  | YAGNI %                    | 90    | Only essentials                      |
  | MoSCoW category            | Must  | Foundation                           |
  | Local vs Non-local changes | Local | Tooling only                         |
  | Architectural changes count| 1     | Initial skeleton                     |
```

Phase P01 – Core data model and DB schema

```
A. Scope and objectives (Impacted REQ-###)
  • Implement tables and models for Brand, Persona, Environment, Influencer, Card, WorkflowRun.
  • Implement repository functions (DbTool backing).
  • Requirements: REQ-003, REQ-301..307.

B. Per-phase test plan
  • Test items:
    - TEST-301: FK constraints and schema migration tests.
    - TEST-304: urlSlug uniqueness enforced.
    - TEST-305: Influencer.synthetic true in seed data.
  • Approach:
    - DB unit tests with a test DB.
  • Pass/fail:
    - Pass: All schema and repository tests pass.
    - Fail: FKs or uniqueness violated.

C. Exit gate rules
  • Green: Schema stable; migrations applied.
  • Yellow: Some text fields may evolve, but structure good.
  • Red: Inconsistent or failing migrations.

D. Phase metrics

  | Metric                     | Value | Rationale                                   |
  |----------------------------|-------|---------------------------------------------|
  | Confidence %               | 85    | Standard schema work                        |
  | Long-term robustness %     | 90    | Good model for future iteration             |
  | Internal interactions      | 3     | Entities, ORM/driver, tests                 |
  | External interactions      | 1     | DB engine                                   |
  | Complexity %               | 35    | Relationships + migrations                  |
  | Feature creep %            | 20    | Tempting to add extra fields                |
  | Technical debt %           | 25    | Some quick decisions                        |
  | YAGNI %                    | 75    | Avoid extra tables now                      |
  | MoSCoW category            | Must  | Data foundation                             |
  | Local vs Non-local changes | Non-local | Affects all layers                       |
  | Architectural changes count| 1     | DB model introduction                       |
```

Phase P02 – Mastra foundation

```
A. Scope and objectives (Impacted REQ-###)
  • Install Mastra and configure base project.
  • Implement basic agents and tools scaffolds (no heavy logic yet).
  • Implement a test workflow that echoes input.
  • Requirements: REQ-106, REQ-210.

B. Per-phase test plan
  • Test items:
    - TEST-210: Simple Mastra workflow runs and returns JSON.
  • Approach:
    - Unit test calling Mastra with dummy agent.
  • Pass/fail:
    - Pass: Example workflow returns expected data.
    - Fail: Mastra fails to run.

C. Exit gate rules
  • Green: Mastra ready for real agents.
  • Yellow: Minor configuration caveats documented.
  • Red: Cannot run any workflow.

D. Phase metrics

  | Metric                     | Value | Rationale                                 |
  |----------------------------|-------|-------------------------------------------|
  | Confidence %               | 80    | Well-documented library                   |
  | Long-term robustness %     | 85    | Clean separation from API                 |
  | Internal interactions      | 4     | Agents, tools, workflows, tests           |
  | External interactions      | 1     | Mastra runtime                            |
  | Complexity %               | 40    | New abstractions                          |
  | Feature creep %            | 20    | Avoid adding too many agents at once      |
  | Technical debt %           | 30    | Some scaffolding shortcuts                |
  | YAGNI %                    | 80    | Only necessary pieces                     |
  | MoSCoW category            | Must  | Backbone                                  |
  | Local vs Non-local changes | Non-local | All workflows depend                    |
  | Architectural changes count| 1     | Introduce agentic engine                  |
```

Phase P03 – ContentAnalysisAgent and onboarding flow

```
A. Scope and objectives (Impacted REQ-###)
  • Implement ContentAnalysisAgent using CONTENT_ANALYSIS_SYSTEM/USER prompts.
  • Implement ContentFetcherTool (HTTP + HTML→text).
  • Implement BrandOnboardingWorkflow:
    - fetch_content → analyze_content → map influencers → persist schema.
  • Expose POST /api/brands and POST /api/brands/:id/onboard, GET /api/brands/:id/schema.
  • Requirements: REQ-001, REQ-002, REQ-201..203, REQ-301..303, REQ-005.

B. Per-phase test plan
  • Test items:
    - TEST-001: Brand creation and onboarding start works.
    - TEST-002: ContentAnalysisAgent returns at least 3 personas and 3 environments.
  • Approach:
    - Use FlowForm sample text, run workflow, inspect DB and API.
  • Pass/fail:
    - Pass: Schema saved and retrievable via /schema.
    - Fail: Agent returns invalid JSON or empty schema.

C. Exit gate rules
  • Green: FlowForm brand onboarded end-to-end successfully.
  • Yellow: Some text fields rough but structurally correct.
  • Red: Onboarding fails or schema invalid.

D. Phase metrics

  | Metric                     | Value | Rationale                                   |
  |----------------------------|-------|---------------------------------------------|
  | Confidence %               | 75    | LLM extraction can vary                     |
  | Long-term robustness %     | 70    | Prompts may need tuning                     |
  | Internal interactions      | 5     | Agent, tools, workflow, repo, API           |
  | External interactions      | 2     | LLM provider, external URLs                 |
  | Complexity %               | 50    | Multi-step pipeline                         |
  | Feature creep %            | 25    | Extra schema fields tempting                 |
  | Technical debt %           | 35    | Accept some heuristic mapping               |
  | YAGNI %                    | 70    | Avoid RAG/complex ingestion for now         |
  | MoSCoW category            | Must  | Base understanding of product               |
  | Local vs Non-local changes | Non-local | Impacts all downstream card generation |
  | Architectural changes count| 1     | Adds real workflow                          |
```

Phase P04 – CardQueryAgent and CardAnswerAgent

```
A. Scope and objectives (Impacted REQ-###)
  • Implement CardQueryAgent with CARD_QUERY_SYSTEM/USER.
  • Implement CardAnswerAgent with CARD_ANSWER_SYSTEM/USER.
  • Add unit tests validating influencer and product mentions.
  • Requirements: REQ-008, REQ-009, REQ-303, REQ-304.

B. Per-phase test plan
  • Test items:
    - TEST-302: CardQueryAgent outputs queries containing influencer name.
    - TEST-304: CardAnswerAgent outputs responses containing product_name.
  • Approach:
    - Use fixed persona/environment/influencer context; verify strings.
  • Pass/fail:
    - Pass: >90% of generated queries/answers meet invariants.
    - Fail: Frequent violations.

C. Exit gate rules
  • Green: Query/answer quality acceptable and constraints satisfied.
  • Yellow: Some manual editing might be needed later.
  • Red: Systematic omission of influencer or product.

D. Phase metrics

  | Metric                     | Value | Rationale                                  |
  |----------------------------|-------|--------------------------------------------|
  | Confidence %               | 80    | Prompts under control                      |
  | Long-term robustness %     | 75    | Style may be tuned later                   |
  | Internal interactions      | 3     | Agents + tests + types                     |
  | External interactions      | 1     | LLM provider                               |
  | Complexity %               | 40    | Prompting + structure                      |
  | Feature creep %            | 25    | Could add more query families              |
  | Technical debt %           | 30    | Early versions acceptable                  |
  | YAGNI %                    | 75    | Avoid advanced tone controls               |
  | MoSCoW category            | Must  | Core card logic                            |
  | Local vs Non-local changes | Non-local | Used in workflow                        |
  | Architectural changes count| 0     | Builds on Mastra                           |
```

Phase P05 – SafetyAgent and ImageBriefAgent

```
A. Scope and objectives (Impacted REQ-###)
  • Implement SafetyAgent with SAFETY_SYSTEM/USER.
  • Implement ImageBriefAgent with IMAGE_BRIEF_SYSTEM/USER.
  • Requirements: REQ-010, REQ-011, REQ-308.

B. Per-phase test plan
  • Test items:
    - TEST-306: SafetyAgent flags sample medical-claim responses.
    - TEST-401: ImageBriefAgent outputs non-empty, <120-word briefs.
  • Approach:
    - Seed test cards with known violations; evaluate.
  • Pass/fail:
    - Pass: Safety catches seeded issues; briefs are coherent and follow Subject + Action + Style + Context.
    - Fail: Frequent misses or unusable briefs.

C. Exit gate rules
  • Green: Safety and briefs good enough for demo.
  • Yellow: Some human review still recommended.
  • Red: Safety misses obvious problems.

D. Phase metrics

  | Metric                     | Value | Rationale                                   |
  |----------------------------|-------|---------------------------------------------|
  | Confidence %               | 70    | Safety prompts can be finicky               |
  | Long-term robustness %     | 70    | Will likely iterate later                   |
  | Internal interactions      | 3     | Agents + tests                              |
  | External interactions      | 1     | LLM provider                                |
  | Complexity %               | 50    | Semantic policy checks                      |
  | Feature creep %            | 30    | Tempting to add complex rules               |
  | Technical debt %           | 35    | Some edge cases deferred                    |
  | YAGNI %                    | 70    | Avoid full policy engine now                |
  | MoSCoW category            | Should| Important but can be minimal for v0         |
  | Local vs Non-local changes | Non-local | Used throughout workflows               |
  | Architectural changes count| 0     | Adds logic only                             |
```

Phase P06 – ImageGenerationTool with FLUX 2

```
A. Scope and objectives (Impacted REQ-###)
  • Implement ImageGenerationTool using @fal-ai/client and model "fal-ai/alpha-image-232/edit-image".
  • Use FLUX2_PROMPT_TEXT_ONLY and FLUX2_PROMPT_WITH_REFS templates.
  • Implement error handling and logging.
  • Requirements: REQ-012, REQ-209, REQ-305, REQ-107.

B. Per-phase test plan
  • Test items:
    - TEST-501: Simple call returns images[0].url.
    - TEST-502: Errors logged and returned as structured errors.
  • Approach:
    - Integration tests run only when FAL_KEY present.
  • Pass/fail:
    - Pass: At least one successful generation and robust error path.
    - Fail: Crashes or empty outputs.

C. Exit gate rules
  • Green: Tool reliable enough to plug into workflow.
  • Yellow: Rare intermittent failures tolerable with retries.
  • Red: Systematic failures or missing URLs.

D. Phase metrics

  | Metric                     | Value | Rationale                                   |
  |----------------------------|-------|---------------------------------------------|
  | Confidence %               | 75    | External dependency                         |
  | Long-term robustness %     | 80    | Encapsulated integration                    |
  | Internal interactions      | 3     | Tool, config, tests                         |
  | External interactions      | 1     | fal.ai API                                  |
  | Complexity %               | 45    | Async + error paths                         |
  | Feature creep %            | 20    | Avoid multi-provider router now             |
  | Technical debt %           | 30    | Some config shortcuts acceptable            |
  | YAGNI %                    | 80    | Only essentials implemented                 |
  | MoSCoW category            | Must  | Core visual generation                      |
  | Local vs Non-local changes | Non-local | Affects workflows and data               |
  | Architectural changes count| 1     | Adds external model                         |
```

Phase P07 – CardGenerationWorkflow and persistence

```
A. Scope and objectives (Impacted REQ-###)
  • Implement CardGenerationWorkflow:
    - load_brand_schema
    - select_targets
    - CardQueryAgent → CardAnswerAgent → SafetyAgent → ImageBriefAgent → ImageGenerationTool → DbTool.upsertCards → UrlSlugTool.
  • Ensure 20 cards for FlowForm can be generated.
  • Requirements: REQ-007..013, REQ-301..306, REQ-104.

B. Per-phase test plan
  • Test items:
    - TEST-006: Workflow generates at least N=5 cards in dev.
    - TEST-303: All cards have non-empty imageUrl.
    - TEST-104: Staging success rate ≥95% (sample runs).
  • Approach:
    - Run workflow multiple times; validate DB content.
  • Pass/fail:
    - Pass: FlowForm 20-card generation succeeds with valid records.
    - Fail: Frequent workflow failures or invalid data.

C. Exit gate rules
  • Green: CardGenerationWorkflow stable for demo.
  • Yellow: Occasional transient failures manageable; documented.
  • Red: Frequent failures.

D. Phase metrics

  | Metric                     | Value | Rationale                                  |
  |----------------------------|-------|--------------------------------------------|
  | Confidence %               | 70    | Many moving parts                          |
  | Long-term robustness %     | 75    | Workflow can be tuned                      |
  | Internal interactions      | 7     | Agents, tools, DB, workflow                |
  | External interactions      | 2     | LLM, FLUX 2                                |
  | Complexity %               | 60    | Multi-step orchestration                   |
  | Feature creep %            | 30    | Temptation to add branches                 |
  | Technical debt %           | 40    | Some edge cases deferred                   |
  | YAGNI %                    | 65    | Keep workflow linear                       |
  | MoSCoW category            | Must  | Central functionality                      |
  | Local vs Non-local changes | Non-local | Impacts API and UI                      |
  | Architectural changes count| 1     | Full orchestration introduced              |
```

Phase P08 – Backend REST API endpoints

```
A. Scope and objectives (Impacted REQ-###)
  • Implement /api/brands, /api/brands/:id/onboard, /api/brands/:id/schema.
  • Implement /api/brands/:id/cards/generate, /api/brands/:id/cards, /api/cards/:cardId, /api/cards/:cardId/status, /api/workflows/:workflowId.
  • Requirements: REQ-201..208, REQ-102.

B. Per-phase test plan
  • Test items:
    - TEST-201: All endpoints return correct shapes and status codes.
    - TEST-102: /api/brands/:id/cards responds <500 ms with 20 cards.
  • Approach:
    - Contract tests with supertest, perf checks.
  • Pass/fail:
    - Pass: All endpoints pass tests; latency acceptable.
    - Fail: 4xx/5xx or slow responses.

C. Exit gate rules
  • Green: API fully supports frontend flows.
  • Yellow: Minor shape tweaks allowed.
  • Red: Critical endpoints broken.

D. Phase metrics

  | Metric                     | Value | Rationale                                  |
  |----------------------------|-------|--------------------------------------------|
  | Confidence %               | 80    | REST patterns well-known                   |
  | Long-term robustness %     | 80    | Clear separation API/workflows             |
  | Internal interactions      | 4     | Controllers, services, DB, Mastra          |
  | External interactions      | 0     | None beyond internal                       |
  | Complexity %               | 45    | Routing + mapping                          |
  | Feature creep %            | 20    | Avoid extra endpoints                      |
  | Technical debt %           | 30    | Some quick mapping logic                   |
  | YAGNI %                    | 75    | Only required API                          |
  | MoSCoW category            | Must  | Interface to frontend                      |
  | Local vs Non-local changes | Non-local | Client-facing                           |
  | Architectural changes count| 0     | Uses existing containers                   |
```

Phase P09 – React frontend core flows

```
A. Scope and objectives (Impacted REQ-###)
  • Implement key pages and routing:
    - BrandDashboard, BrandSetup, PersonaInfluencerReview, CardGeneration, CardGallery, CardDetail.
  • Integrate with backend APIs.
  • Requirements: REQ-001, REQ-004, REQ-006, REQ-017, REQ-018, REQ-101, REQ-103.

B. Per-phase test plan
  • Test items:
    - TEST-101: Trial user completes brand setup → generate cards → view gallery in <3 minutes.
    - TEST-006: Gallery shows 20 cards with correct images and queries.
    - TEST-103: Gallery renders <2 seconds.
  • Approach:
    - Manual UX tests; component tests for key views.
  • Pass/fail:
    - Pass: E2E UI flow functional and understandable.
    - Fail: Critical path broken.

C. Exit gate rules
  • Green: Full path from setup to card detail works.
  • Yellow: Cosmetic issues acceptable.
  • Red: Users blocked.

D. Phase metrics

  | Metric                     | Value | Rationale                                  |
  |----------------------------|-------|--------------------------------------------|
  | Confidence %               | 80    | Standard React patterns                    |
  | Long-term robustness %     | 75    | UI will evolve                             |
  | Internal interactions      | 5     | Components, router, API client, state      |
  | External interactions      | 1     | Backend API                                |
  | Complexity %               | 55    | Multi-screen UX                            |
  | Feature creep %            | 35    | Temptation to over-polish                  |
  | Technical debt %           | 35    | Some shortcuts allowed                     |
  | YAGNI %                    | 70    | Keep UI minimal                            |
  | MoSCoW category            | Must  | Demo-critical                              |
  | Local vs Non-local changes | Non-local | Affects entire UX                       |
  | Architectural changes count| 0     | Within SPA structure                       |
```

Phase P10 – Telemetry, viewCount, and backend metrics

```
A. Scope and objectives (Impacted REQ-###)
  • Implement viewCount increment on card detail, persisted in DB or in-memory counter on server.
  • Implement backend support for simple metrics (e.g., total cards, published count) exposed via API or logs.
  • Ensure telemetry logs workflow and image-generation errors with correlation IDs.
  • Requirements: REQ-020, REQ-108.

B. Per-phase test plan
  • Test items:
    - TEST-012: viewCount increments on repeated detail views.
    - TEST-108: logs include workflow and image error entries.
  • Approach:
    - Manual tests, log inspection.
  • Pass/fail:
    - Pass: Telemetry and publish flows behave predictably.
    - Fail: Inconsistent state or missing logs.

C. Exit gate rules
  • Green: Telemetry and publish usable and stable.
  • Yellow: Minor UX roughness allowed.
  • Red: State transitions confusing.

D. Phase metrics

  | Metric                     | Value | Rationale                                  |
  |----------------------------|-------|--------------------------------------------|
  | Confidence %               | 75    | Straightforward backend and logging logic   |
  | Long-term robustness %     | 70    | Likely refactor later                       |
  | Internal interactions      | 3     | API, DB, logs                               |
  | External interactions      | 0     | None                                       |
  | Complexity %               | 40    | State transitions and counters              |
  | Feature creep %            | 25    | Might add dashboards                        |
  | Technical debt %           | 35    | Some accepted shortcuts                      |
  | YAGNI %                    | 75    | Keep telemetry simple                        |
  | MoSCoW category            | Should| Value-add but not core generation            |
  | Local vs Non-local changes | Non-local | Affects DB and API                       |
  | Architectural changes count| 0     | No new containers                           |
```

Phase P12 – Publish UI and status management

```
A. Scope and objectives (Impacted REQ-###)
  • Implement Publish page and status transitions in the React app.
  • Ensure filters by status behave correctly in UI.
  • Requirements: REQ-016, REQ-017, REQ-018, REQ-101.

B. Per-phase test plan
  • Test items:
    - TEST-111: publish/unpublish flows work and filtering by status behaves.
    - TEST-101: user can complete main flow including publish interactions.
  • Approach:
    - Manual UX tests plus component tests for Publish and Gallery filters.
  • Pass/fail:
    - Pass: Users can publish/unpublish cards and see consistent state.
    - Fail: Status or filters behave inconsistently.

C. Exit gate rules
  • Green: Publish UX stable and understandable.
  • Yellow: Minor visual issues acceptable.
  • Red: Users cannot confidently interpret card status.

D. Phase metrics

  | Metric                     | Value | Rationale                                   |
  |----------------------------|-------|---------------------------------------------|
  | Confidence %               | 75    | UI logic is straightforward                  |
  | Long-term robustness %     | 70    | Likely to iterate copy/visuals               |
  | Internal interactions      | 4     | Components, router, state, API client        |
  | External interactions      | 1     | Backend API                                  |
  | Complexity %               | 45    | Stateful filtering and status changes        |
  | Feature creep %            | 30    | Temptation to add advanced dashboards        |
  | Technical debt %           | 30    | Some shortcuts allowed                       |
  | YAGNI %                    | 70    | Avoid non-essential analytics in v0          |
  | MoSCoW category            | Should| Helpful but not core generation              |
  | Local vs Non-local changes | Non-local | Affects UI and perceived workflows       |
  | Architectural changes count| 0     | Within SPA structure                         |
```

Phase P11 – End-to-end tests and demo hardening

```
A. Scope and objectives (Impacted REQ-###)
  • Run full e2e demo path multiple times.
  • Execute evals from section 5.
  • Fix blocking issues, tag demo-ready release.
  • Requirements: All, especially REQ-101..108.

B. Per-phase test plan
  • Test items:
    - dev-e2e-demo evaluation: full brand → cards → gallery → detail.
    - TEST-102, TEST-103, TEST-104.
  • Approach:
    - Manual runs plus optional Cypress/Playwright scripts.
  • Pass/fail:
    - Pass: ≥2 full successful dry-runs without critical problems.
    - Fail: Frequent workflow or UI failures.

C. Exit gate rules
  • Green: All critical tests pass; demo script stable.
  • Yellow: Minor known issues documented.
  • Red: Showstopper bugs remain.

D. Phase metrics

  | Metric                     | Value | Rationale                                   |
  |----------------------------|-------|---------------------------------------------|
  | Confidence %               | 70    | Integration often reveals surprises          |
  | Long-term robustness %     | 75    | Good base for future versions                |
  | Internal interactions      | 7     | Entire stack                                |
  | External interactions      | 2     | LLM, FLUX 2                                 |
  | Complexity %               | 60    | Full system behavior                        |
  | Feature creep %            | 30    | Resist “just one more tweak”                |
  | Technical debt %           | 40    | Some debt accepted pre-demo                 |
  | YAGNI %                    | 70    | No new features this late                   |
  | MoSCoW category            | Must  | Gate to demo                                |
  | Local vs Non-local changes | Non-local | Might touch all layers                    |
  | Architectural changes count| 0     | Only refinements                            |
```

5. Evaluations (combined YAML)

evaluations:

- id: dev-e2e-demo
  dataset: "flowform-seed-brand"
  task: "Run full onboarding -> generate 20 cards -> view gallery -> open 3 card details"
  metrics:
    - name: success_rate
      threshold: 1.0
    - name: duration_seconds
      threshold: 300
  seed: 1
  runtime_budget_seconds: 1200

- id: llm-content-quality
  dataset: "sample-persona-influencer-combos"
  task: "Human rating of query/answer pairs"
  metrics:
    - name: avg_relevance_score
      threshold: 0.8
    - name: medical_claims_incidents
      threshold: 0
  seed: 2
  runtime_budget_seconds: 3600

- id: flux2-image-quality
  dataset: "10 representative image_briefs"
  task: "Generate images via FLUX 2 and review quality"
  metrics:
    - name: usable_image_ratio
      threshold: 0.8
    - name: obvious_artifacts_count
      threshold: 1
  seed: 3
  runtime_budget_seconds: 3600

- id: perf-api-gallery
  dataset: "20-card-db"
  task: "Measure /api/brands/:id/cards and gallery render time"
  metrics:
    - name: api_latency_ms
      threshold: 500
    - name: gallery_render_seconds
      threshold: 2.0
  seed: 4
  runtime_budget_seconds: 600

- id: adversarial-safety
  dataset: "seeded-medical-claims-responses"
  task: "Evaluate SafetyAgent detection"
  metrics:
    - name: detection_recall
      threshold: 0.9
    - name: false_negative_count
      threshold: 0
  seed: 5
  runtime_budget_seconds: 600

6. Tests overview

| TEST ID  | Type        | Description                                       | Verifies REQ                   |
| -------- | ----------- | ------------------------------------------------- | ------------------------------ |
| TEST-001 | acceptance  | Brand creation and onboarding trigger works       | REQ-001, REQ-002               |
| TEST-002 | functional  | Personas/environments extracted for FlowForm      | REQ-002, REQ-203, REQ-301..303 |
| TEST-006 | acceptance  | CardGenerationWorkflow generates N cards          | REQ-007..013, REQ-301..306     |
| TEST-012 | functional  | Card viewCount increments on detail view          | REQ-020                        |
| TEST-101 | usability   | New user completes main flow in <3 minutes        | REQ-101                        |
| TEST-102 | performance | /api/brands/:id/cards responds <500 ms            | REQ-102                        |
| TEST-103 | performance | Gallery renders 20 cards in <2 seconds            | REQ-103                        |
| TEST-104 | robustness  | 95% workflow success rate in staging              | REQ-104                        |
| TEST-105 | structural  | Dev environment and tests run successfully        | REQ-105                        |
| TEST-106 | structural  | Agents/tools/workflows separated by modules       | REQ-106                        |
| TEST-108 | observab.   | Logs show workflow starts/ends and image errors   | REQ-108                        |
| TEST-201 | contract    | All REST endpoints return correct shapes          | REQ-201..208                   |
| TEST-210 | contract    | Mastra payloads conform to JSON schemas           | REQ-210                        |
| TEST-301 | data-check  | DB FKs valid for Brand relations                  | REQ-301, REQ-302               |
| TEST-302 | data-check  | Card queries include influencer name              | REQ-303                        |
| TEST-303 | data-check  | Cards have non-empty imageUrl                     | REQ-305                        |
| TEST-304 | data-check  | Card responses include product_name               | REQ-304                        |
| TEST-305 | data-check  | Influencers synthetic and diverse                 | REQ-005, REQ-307               |
| TEST-306 | data-check  | SafetyAgent flags seeded medical claims           | REQ-010, REQ-308               |
| TEST-401 | data-check  | ImageBriefAgent outputs concise, valid briefs     | REQ-011                        |
| TEST-501 | integration | FLUX 2 tool returns image URL for simple requests | REQ-012, REQ-209               |
| TEST-502 | integration | FLUX 2 tool handles errors gracefully             | REQ-104, REQ-209               |
| TEST-111 | acceptance  | Publish status updates and filtering work         | REQ-016                        |

7. Data contract (minimal)

7.1 Schema snapshot

```
Brand
  id: string
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
• brandId in Persona, Environment, Influencer, Card, WorkflowRun must reference a valid Brand.
• personaId, influencerId, environmentId (if present) in Card must reference valid entities.
• Card.query must contain Influencer.name as substring (case-insensitive).
• Card.response must contain product_name.
• Card.imageUrl must be non-empty http/https URL.
• Card.urlSlug must be unique per Brand.
• Influencer.synthetic must be true for v0.
• WorkflowRun.status transitions must follow: pending → running → (succeeded | failed).
• SafetyAgent must be run before publishing cards in PublishingWorkflow.
```

8. Reproducibility

• Version control:

- Git repo, feature branches per phase or feature.
- Tag demo-ready release as v0.1-demo-mastra-flux2.

• Environment:

- Node.js LTS (≈20.x).
- LibSQL/SQLite for dev/staging.
- Same schema for future Postgres migration.

• Hardware and OS (recommended baseline):

- CPU: 4+ vCPUs (e.g., modern x86_64 laptop or cloud VM).
- RAM: 8–16 GB.
- OS: Linux (Ubuntu 22.04 LTS) or equivalent container base image.
- Container tag: node:20-bullseye (or similar LTS image) for backend services.

• Seeds:

- FlowForm seed brand with fixed marketing text file.
- Optional seeds for LLM provider if supported.

• Commands:

- Backend:
- npm install
- npm run test
- npm run dev:server
- Frontend:
- npm install
- npm run dev:client

• Optional container:

- Dockerfile for backend with Node base and environment variables for DB URL, FAL_KEY, LLM keys.

9. RTM (Requirements Traceability Matrix)

| REQ ID  | TEST IDs           | Phase IDs        |
| ------- | ------------------ | ---------------- |
| REQ-001 | TEST-001           | P03, P09         |
| REQ-002 | TEST-001, TEST-002 | P03              |
| REQ-003 | TEST-301           | P01              |
| REQ-004 | TEST-002, TEST-201 | P03, P08         |
| REQ-005 | TEST-305           | P01, P03         |
| REQ-006 | TEST-101           | P09              |
| REQ-007 | TEST-006           | P07              |
| REQ-008 | TEST-302, TEST-006 | P04, P07         |
| REQ-009 | TEST-304, TEST-006 | P04, P07         |
| REQ-010 | TEST-306           | P05, P07         |
| REQ-011 | TEST-401           | P05, P07         |
| REQ-012 | TEST-501, TEST-502 | P06, P07         |
| REQ-013 | TEST-006, TEST-303 | P07              |
| REQ-014 | TEST-201, TEST-102 | P08              |
| REQ-015 | TEST-201           | P08              |
| REQ-016 | TEST-111           | P12              |
| REQ-017 | TEST-006, TEST-103 | P09              |
| REQ-018 | TEST-101           | P09, P12         |
| REQ-019 | TEST-101           | P09, P12         |
| REQ-020 | TEST-012           | P10              |
| REQ-101 | TEST-101           | P09, P12         |
| REQ-102 | TEST-102           | P08, P11         |
| REQ-103 | TEST-103           | P09, P12         |
| REQ-104 | TEST-104           | P07, P12         |
| REQ-105 | TEST-105           | P00              |
| REQ-106 | TEST-106           | P02              |
| REQ-107 | TEST-501           | P06              |
| REQ-108 | TEST-108           | P10, P11         |
| REQ-201 | TEST-201           | P08              |
| REQ-202 | TEST-201           | P03, P08         |
| REQ-203 | TEST-002, TEST-201 | P03, P08         |
| REQ-204 | TEST-201           | P08              |
| REQ-205 | TEST-201           | P08              |
| REQ-206 | TEST-201, TEST-102 | P08, P11         |
| REQ-207 | TEST-201           | P08              |
| REQ-208 | TEST-201           | P08              |
| REQ-209 | TEST-501, TEST-502 | P06              |
| REQ-210 | TEST-210           | P02, P03, P07    |
| REQ-301 | TEST-301           | P01              |
| REQ-302 | TEST-301           | P01              |
| REQ-303 | TEST-302           | P04, P07         |
| REQ-304 | TEST-304           | P04, P07         |
| REQ-305 | TEST-303, TEST-501 | P06, P07         |
| REQ-306 | TEST-304           | P01, P07         |
| REQ-307 | TEST-305           | P01              |
| REQ-308 | TEST-306           | P05, P07         |

10. Execution log (living document template)

10.1 Phase status table

| Phase ID | Status     | Last updated   | Owner  |
| -------- | ---------- | -------------- | ------ |
| P00      | Done       | 2025-11-24     | Eng    |
| P01      | Done       | 2025-11-24     | Eng    |
| P02      | Done       | 2025-11-24     | Eng    |
| P03      | Done       | 2025-11-24     | Eng    |
| P04      | Done       | 2025-11-24     | Eng    |
| P05      | Done       | 2025-11-24     | Eng    |
| P06      | Done       | 2025-11-24     | Eng    |
| P07      | Done       | 2025-11-24     | Eng    |
| P08      | Done       | 2025-11-24     | Eng    |
| P09      | Done       | 2025-11-24     | Eng    |
| P10      | InProgress | 2025-11-24     | Eng    |
| P11      | InProgress | 2025-11-24     | Eng    |
| P12      | InProgress | 2025-11-24     | Eng    |

10.2 Per-phase execution notes (template)

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
  • Outcome and why abandoned:

Lessons learned:
  • ...

Design/architecture choices made:
  • ...

Deviations from plan:
  • What changed:
  • Why it changed:

Next actions:
  • ...
```

10.3 Overall retrospective (after P11)

```
• What worked well:
  - ...
• What should change next iteration:
  - ...
• Impact on architecture and requirements:
  - ...
```

11. Assumptions (consolidated)

• FlowForm Motion Suit remains a fictional, non-medical product; we still avoid medical claims to be safe.
• All data used in v0 demo is synthetic; no real PII or influencer likenesses.
• LLM and FLUX 2 providers remain accessible and stable during development and demo.
• Team has basic familiarity with React, Node, Mastra, and REST APIs.
• Single brand (FlowForm) is sufficient to demonstrate the concept and architecture.

12. Consistency check

• All REQ-### referenced in TEST-### are defined in SRS.
• All TEST-### appear in both the Tests Overview and RTM.
• Every phase P00–P11 has:

- Scope/objectives
- Per-phase test plan
- Exit gate rules
- Metrics table
  • Phases are atomic and non-overlapping across architecture layers (no giant combined “backend+frontend+DB” phases).
  • Agent definitions, prompts, and workflows are fully specified in this single document; there is no external prompt dependency.
  • ImageGenerationTool design and prompts follow the FLUX Subject + Action + Style + Context framework.
  • Constraints about query/answer content, synthetic influencers, and no medical claims are enforced via data requirements and SafetyAgent.
  • The plan supports a verification-first, agentic, iterative implementation that can be executed by humans or LLM-based agents while maintaining state safety via version control.
