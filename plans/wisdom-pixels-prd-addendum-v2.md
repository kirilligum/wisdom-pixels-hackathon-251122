# Wisdom Pixels PRD - Addendum v2.0 (Migration Update)

**Parent Document**: wisdom-pixels-mastra-flux2-react-plan.md
**Addendum Version**: 2.0
**Date**: 2025-11-23
**Status**: Active

## Purpose

This addendum clarifies aspects of the original PRD and documents the migration path from the current prototype implementation to the full agentic system.

---

## 1. Image Model Specification Clarification (Nano Banana Pro)

### Original PRD Statement (Line 76-77, 209)

```
Image generation via fal.ai:
  - Text-to-image model: "fal-ai/nano-banana-pro"
  - Image-to-image/edit model: "fal-ai/nano-banana-pro/edit"
  - Use prompt (+ optional image_urls[] for edit); parse images[].url outputs
```

### Clarification

**Model Identifiers**:
- Text-to-image: `fal-ai/nano-banana-pro`
- Image-to-image/edit: `fal-ai/nano-banana-pro/edit`

These are Nano Banana Pro-based models that support:
1. **Text prompts** for image generation
2. **Reference images** (`image_urls[]` on the edit endpoint) for style/composition guidance
3. **Influencer/product placement** via reference images

### Why These Models?

The updated PRD specifies Nano Banana Pro for specific reasons:

1. **Reference Image Support** (edit endpoint): Can take influencer headshots and product photos as inputs
2. **Photorealistic Output**: Well-suited for product placement and influencer scenes
3. **Consistency**: Using reference images creates consistent influencer appearance across cards
4. **Composition Control**: Aspect ratios and reference images provide better control over composition

### API Contract

```typescript
// Correct usage per PRD (edit endpoint with reference images)
await fal.subscribe("fal-ai/nano-banana-pro/edit", {
  input: {
    prompt: string,              // Image generation prompt
    image_urls: string[],        // 1-2 reference images (influencer, product)
    num_images?: number,         // Default: 1
    aspect_ratio?: string,       // e.g., "16:9", "4:3"
    output_format?: string,      // "png" | "jpeg" | "webp"
    resolution?: string,         // "1K" | "2K" | "4K"
  }
});

// Returns
{
  images: [{
    url: string,
    content_type: string,
    file_name: string,
    width?: number,
    height?: number
  }],
  description: string
}
```

### Common Mistake (Current Implementation)

```typescript
// ❌ INCORRECT - Using a different model without reference support
await fal.subscribe("fal-ai/other-model", {
  input: {
    prompt: string,
    aspect_ratio: string
  }
});
```

**Consequences**:
- Cannot use reference images
- Inconsistent influencer appearance
- Less control over composition
- Not meeting REQ-012/REQ-209 requirements

### Migration Action

Phase M2 will create `ImageGenerationTool` with correct Nano Banana Pro models:

```typescript
// app/mastra/tools/image-generation-tool.ts
export const imageGenerationTool = createTool({
  id: "image-generation",
  description: "Generate images using fal-ai/nano-banana-pro (text) and fal-ai/nano-banana-pro/edit (image edit)",
  inputSchema: z.object({
    prompt: z.string(),
    image_urls: z.array(z.string().url()).optional(),
    aspect_ratio: z.string().optional().default("16:9"),
    resolution: z.enum(["1K", "2K", "4K"]).optional().default("1K"),
  }),
  execute: async ({ context }) => {
    const { prompt, image_urls = [], aspect_ratio, resolution } = context;
    const input: any = { prompt, num_images: 1, aspect_ratio, resolution, output_format: "png" };
    const endpoint = image_urls.length ? "fal-ai/nano-banana-pro/edit" : "fal-ai/nano-banana-pro";
    if (image_urls.length) input.image_urls = image_urls;

    const result = await fal.subscribe(endpoint, { input });
    return { url: result.data.images[0].url };
  }
});
```

---

## 2. Phase Execution Status Update

### Original PRD Phase Schedule (Section 4.1)

| Phase | Name | Status (Original) | Status (Current) |
|-------|------|-------------------|------------------|
| P00 | Repo and environment setup | Not Started | ✅ Complete |
| P01 | Core data model and DB schema | Not Started | ❌ Not Implemented |
| P02 | Mastra foundation | Not Started | ⚠️ Partial (wrong structure) |
| P03 | ContentAnalysisAgent and onboarding | Not Started | ❌ Not Implemented |
| P04 | CardQueryAgent and CardAnswerAgent | Not Started | ❌ Not Implemented |
| P05 | SafetyAgent and ImageBriefAgent | Not Started | ❌ Not Implemented |
| P06 | ImageGenerationTool with Nano Banana Pro | Not Started | ⚠️ Wrong model (legacy prototype) |
| P07 | CardGenerationWorkflow | Not Started | ❌ Not Implemented |
| P08 | Backend REST API endpoints | Not Started | ❌ Not Implemented |
| P09 | React frontend core flows | Not Started | ✅ Complete (direct Mastra calls) |
| P10 | Telemetry, viewCount, publish UI | Not Started | ✅ Complete (localStorage) |
| P11 | End-to-end tests and demo hardening | Not Started | ⚠️ Partial (47 tests, wrong IDs) |

### Updated Phase Plan (Migration Phases M1-M8)

The execution plan document (`wisdom-pixels-execution-plan-v2.md`) defines new phases M1-M8 that bridge from current state to PRD compliance.

---

## 3. Current Implementation State (P0-Current)

### What Was Built (Nov 22-23, 2025)

**Achievements**:
1. ✅ Full React UI with all screens specified in PRD
2. ✅ Basic Mastra integration with one agent
3. ✅ fal.ai integration (but wrong model)
4. ✅ 47 Playwright E2E tests (but different test IDs than PRD)
5. ✅ Seed data for FlowForm brand
6. ✅ Telemetry (viewCount via localStorage)

**Gaps**:
1. ❌ No database persistence (using seed data only)
2. ❌ No specialized agents (1 generic vs. 5 specialized)
3. ❌ No workflow orchestration
4. ❌ No backend REST API (frontend calls Mastra directly)
5. ❌ Wrong image model (non-Nano Banana Pro vs. nano-banana-pro/edit)
6. ❌ Wrong tools (content generators vs. infrastructure)

### Technical Debt Items

| Item | Impact | Resolution Phase |
|------|--------|-----------------|
| Direct frontend-to-Mastra calls | Violates PRD architecture | M5: REST API layer |
| Wrong image model | Can't use reference images | M2: ImageGenerationTool |
| No database | Can't persist data | M1: Database foundation |
| 1 agent vs. 5 | Poor separation of concerns | M3: Specialized agents |
| No workflows | No orchestration | M4: Workflows |
| Test ID mismatch | RTM not satisfied | M7: Testing alignment |

---

## 4. Architecture Migration Strategy

### Strangler Fig Pattern

We adopt a **strangler fig** migration pattern:

```
Phase M1-M3: Build new backend (Mastra agents/workflows) alongside current system
Phase M4: Add API layer wrapping new backend
Phase M5: Migrate frontend to use API (keep old code as fallback)
Phase M6: Remove old direct Mastra calls
Phase M7-M8: Validate and document
```

### Why Not Big Bang Rewrite?

**Risks of rewriting everything**:
- Lose working UI
- Long period with no working demo
- Higher risk of regression
- Harder to debug issues

**Benefits of incremental**:
- Always have working demo
- Can test each piece independently
- Easy rollback if issues arise
- Deliver value continuously

---

## 5. Updated Requirements Interpretation

### REQ-012 Clarification

**Original**:
```
REQ-012 (func): CardGenerationWorkflow shall call ImageGenerationTool,
which invokes fal.subscribe("fal-ai/alpha-image-232/edit-image", ...)
with prompt and image_urls.
```

**Clarified Interpretation**:
- ImageGenerationTool is a **Mastra tool** (not direct frontend call)
- Must wrap fal.ai API in proper Mastra tool structure
- Must support `image_urls[]` parameter for reference images
- Must use alpha-image-232/edit-image model (not Schnell)
- Must be called by CardGenerationWorkflow (not directly by UI)

**Test Coverage**:
- TEST-501: Simple prompt returns valid URL
- TEST-502: Handles errors gracefully
- TEST-012 (in context): Full card generation includes image

### REQ-002 Clarification

**Original**:
```
REQ-002 (func): System shall use Mastra BrandOnboardingWorkflow
to fetch marketing content and extract personas, environments,
and influencer personas.
```

**Clarified Interpretation**:
- This is a **Workflow**, not a direct agent call
- Workflow orchestrates: ContentFetcherTool → ContentAnalysisAgent → DbTool
- Must persist results to database (not just return JSON)
- Must create WorkflowRun record for tracking
- Must handle failures and retries

---

## 6. Data Model Corrections

### Card Schema Correction

**Issue**: Current implementation has `environmentId` as required, but PRD specifies optional

**PRD Schema** (line 957-970):
```typescript
Card {
  environmentId?: string | null  // ✅ Optional
  status: "draft" | "ready" | "published"
  urlSlug: string
  viewCount: number
}
```

**Current Implementation** (src/types/index.ts):
```typescript
Card {
  environmentId: string  // ❌ Required
  // Missing: status field
  // Missing: viewCount in schema (only in localStorage)
}
```

**Resolution** (Phase M1):
```typescript
// app/mastra/db/schema.ts
export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  brandId: text("brand_id").notNull().references(() => brands.id),
  personaId: text("persona_id").notNull().references(() => personas.id),
  influencerId: text("influencer_id").notNull().references(() => influencers.id),
  environmentId: text("environment_id").references(() => environments.id), // Nullable
  query: text("query").notNull(),
  response: text("response").notNull(),
  imageUrl: text("image_url").notNull(),
  urlSlug: text("url_slug").notNull().unique(),
  status: text("status").notNull().default("draft"), // "draft" | "ready" | "published"
  viewCount: integer("view_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

---

## 7. Test Suite Alignment

### PRD Test IDs vs. Current Tests

| PRD Test | Description | Current Status | Action |
|----------|-------------|----------------|--------|
| TEST-001 | Brand creation and onboarding | ❌ Not created | Create in M7 |
| TEST-002 | Personas/environments extracted | ❌ Not created | Create in M7 |
| TEST-006 | Card generation workflow | ❌ Not created | Create in M7 |
| TEST-012 | viewCount increment | ✅ Exists (different purpose) | Rename/fix in M7 |
| TEST-101 | Usability: <3 minute flow | ❌ Not created | Create in M7 |
| TEST-102 | API response <500ms | ❌ Not created | Create in M7 |
| TEST-103 | Gallery render <2s | ❌ Not created | Create in M7 |
| TEST-104 | 95% workflow success | ❌ Not created | Create in M7 |
| TEST-201 | All REST endpoints | ❌ Not created | Create in M7 |
| TEST-301-308 | Data validation | ❌ Not created | Create in M7 |
| TEST-501-502 | Image tool tests (Nano Banana Pro) | ❌ Not created | Create in M7 |

### Current Test Files

```
tests/
├── TEST-001-brand-setup.spec.ts          # Misaligned with PRD
├── TEST-002-persona-creation.spec.ts     # Misaligned
├── TEST-003-environment-creation.spec.ts # Not in PRD
├── TEST-004-influencer-toggles.spec.ts   # Not in PRD
├── TEST-005-card-creation.spec.ts        # Misaligned
├── TEST-006-card-gallery.spec.ts         # Misaligned
├── TEST-007-card-filters.spec.ts         # Not in PRD
├── TEST-008-card-detail-view.spec.ts     # Partial coverage
├── TEST-009-card-editing.spec.ts         # Extra (good to have)
├── TEST-010-publish-workflow.spec.ts     # Misaligned
├── TEST-011-telemetry.spec.ts            # Misaligned
└── TEST-012-ai-content.spec.ts           # Wrong purpose
```

**Resolution**: Phase M7 will:
1. Keep current tests (rename with WP-### prefix for "Wisdom Pixels")
2. Add new tests matching PRD IDs (TEST-001, TEST-002, etc.)
3. Create RTM mapping document

---

## 8. Success Criteria Updates

### Phase M1-M8 Success Metrics

These supersede the original PRD's phase metrics for the migration:

**M1 Complete When**:
- ✅ All 6 tables created with migrations
- ✅ All repositories implement CRUD
- ✅ Seed data loads into database
- ✅ TEST-301: Foreign key constraints enforced

**M2 Complete When**:
- ✅ All 4 infrastructure tools created
- ✅ ImageGenerationTool uses alpha-image-232/edit-image
- ✅ TEST-501: Image generation returns URL
- ✅ TEST-502: Error handling works

**M3 Complete When**:
- ✅ All 5 specialized agents defined
- ✅ TEST-302: CardQueryAgent includes influencer name
- ✅ TEST-304: CardAnswerAgent includes product name
- ✅ TEST-306: SafetyAgent flags violations

**M4 Complete When**:
- ✅ All 3 workflows executable
- ✅ TEST-001: BrandOnboardingWorkflow extracts schema
- ✅ TEST-006: CardGenerationWorkflow creates cards
- ✅ WorkflowRun tracking works

**M5 Complete When**:
- ✅ All 8 REST endpoints implemented
- ✅ TEST-201: Endpoints respond correctly
- ✅ TEST-102: Card list API <500ms

**M6 Complete When**:
- ✅ Frontend uses API exclusively
- ✅ No direct @mastra/client-js usage in frontend
- ✅ TEST-101: Full flow <3 minutes
- ✅ TEST-103: Gallery renders <2 seconds

**M7 Complete When**:
- ✅ All PRD test IDs implemented
- ✅ >95% test pass rate
- ✅ RTM fully satisfied

**M8 Complete When**:
- ✅ Documentation updated
- ✅ Old code removed
- ✅ Demo script validated

---

## 9. Environment Variables Update

### Current .env.example

```bash
# OpenAI API Key (for AI content generation and image generation)
OPENAI_API_KEY=your_openai_api_key_here

# OR use Anthropic Claude instead
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# FAL API Key (for image generation)
# FAL_KEY=your_fal_key_here

# Mastra API URL (optional, defaults to http://localhost:4111)
# VITE_MASTRA_API_URL=http://localhost:4111
```

### Updated .env.example (After M1-M5)

```bash
# === LLM Provider (choose one) ===
OPENAI_API_KEY=your_openai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# === Image Generation ===
FAL_KEY=your_fal_key_here  # Required for Nano Banana Pro image generation

# === Database ===
DATABASE_URL=file:./data/wisdom-pixels.db  # LibSQL/SQLite file path

# === Backend API ===
API_PORT=4000
API_HOST=localhost
API_CORS_ORIGIN=http://localhost:5173  # Vite dev server

# === Mastra Engine ===
MASTRA_PORT=4111
MASTRA_HOST=localhost

# === Frontend (Vite) ===
VITE_API_URL=http://localhost:4000  # Backend REST API
```

---

## 10. Breaking Changes Log

### Changes from Current Implementation to Full System

**Phase M2**: ImageGenerationTool API
- ❌ Breaking: `fal-ai/flux/schnell` → `fal-ai/alpha-image-232/edit-image`
- ❌ Breaking: Remove `num_inference_steps` parameter
- ✅ Add: `image_urls[]` parameter support

**Phase M3**: Agent Structure
- ❌ Breaking: Remove generic `contentAgent`
- ✅ Add: 5 specialized agents
- ⚠️ Migration: Keep `contentAgent` as deprecated wrapper for Phase M5

**Phase M5**: REST API Introduction
- ❌ Breaking: Frontend must use API instead of direct Mastra
- ✅ Backward compat: Old Mastra client code remains until M6

**Phase M6**: Remove Direct Mastra Calls
- ❌ Breaking: Delete `src/lib/mastra.ts`
- ❌ Breaking: Remove `@mastra/client-js` from frontend dependencies

**Phase M7**: Test ID Changes
- ⚠️ Non-breaking: Rename current tests to WP-### prefix
- ✅ Add: New tests with PRD IDs (TEST-###)

---

## 11. Rollback Strategy

Each phase creates a git tag for easy rollback:

```bash
# Phase tagging
git tag -a m1-database -m "Phase M1: Database foundation complete"
git tag -a m2-tools -m "Phase M2: Infrastructure tools complete"
git tag -a m3-agents -m "Phase M3: Specialized agents complete"
git tag -a m4-workflows -m "Phase M4: Workflow orchestration complete"
git tag -a m5-rest-api -m "Phase M5: REST API layer complete"
git tag -a m6-frontend-migration -m "Phase M6: Frontend migrated to API"
git tag -a m7-testing -m "Phase M7: Test suite aligned with PRD"
git tag -a m8-documentation -m "Phase M8: Documentation complete"

# Rollback to phase
git checkout m3-agents  # Roll back to after Phase M3
```

---

## 12. Questions Resolved

### Q1: Why not start with REST API first?

**Answer**: REST API (Phase M5) depends on workflows (Phase M4), which depend on agents (Phase M3), which depend on tools (Phase M2), which depend on database (Phase M1). Bottom-up is more testable.

### Q2: Can we skip the database and use JSON files?

**Answer**: No. The PRD explicitly requires LibSQL/SQLite (REQ-003). Database is needed for:
- Foreign key constraints (REQ-301)
- Unique urlSlug enforcement (REQ-306)
- WorkflowRun tracking for observability
- Concurrent access during workflow execution

### Q3: Why 5 agents instead of 1 smart agent?

**Answer**: Separation of concerns per PRD architecture:
- **Modularity**: Each agent has clear responsibility
- **Testability**: Can test query generation separately from answer generation
- **Reusability**: SafetyAgent can validate any content, not just cards
- **Maintainability**: Prompts are easier to tune when focused
- **Observability**: Can track which agent succeeded/failed in workflows

### Q4: Can we keep using Flux Schnell?

**Answer**: No, must use alpha-image-232/edit-image because:
- REQ-012 explicitly specifies this model
- Schnell doesn't support `image_urls[]` for reference images
- Cannot achieve consistent influencer appearance without reference images
- TEST-501 requires testing alpha-image-232/edit-image specifically

---

## 13. Definitions and Clarifications

### "Agentic System"

An agentic system (per PRD) means:
1. **Multiple specialized agents** with focused responsibilities
2. **Workflow orchestration** coordinating agent interactions
3. **Tool-based actions** (agents don't directly call APIs, they use tools)
4. **State persistence** (workflow runs tracked in database)
5. **Decision-making** (agents choose when to call tools based on context)

This is different from a "single LLM call" or "chatbot" approach.

### "Infrastructure Tools"

Tools that provide **primitives** for agents to use:
- DbTool: Database access
- ContentFetcherTool: HTTP fetching
- ImageGenerationTool: Image generation
- UrlSlugTool: Slug generation

These are **not** content generators themselves; they are building blocks.

### "Content Generation Tools" (Old Approach)

The current implementation has:
- generatePersonaTool
- generateEnvironmentTool
- generateTrainingCardTool

These combine LLM generation + logic in one tool. This violates the PRD architecture where agents do the generation and tools provide infrastructure.

**Migration**: These tools will be **deleted** in Phase M2 and replaced by infrastructure tools + specialized agents.

---

## 14. Appendix: Nano Banana Pro Model Research

### fal.ai Model Availability Check

**Before starting Phase M2**, verify model availability:

```bash
# Test script
curl -X POST https://fal.run/fal-ai/alpha-image-232/edit-image \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "A professional athlete in a modern gym",
      "image_size": "landscape_4_3"
    }
  }'
```

**Expected Response**:
```json
{
  "images": [{
    "url": "https://...",
    "content_type": "image/jpeg",
    "width": 1024,
    "height": 768
  }],
  "seed": 12345
}
```

**If model unavailable**:
1. Check fal.ai documentation for updated model name
2. Update PRD and execution plan with correct model
3. Document reasoning for model change

---

## 15. Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-23 | Initial PRD created | PM Team |
| 2.0 | 2025-11-23 | Migration addendum added | Implementation Team |

---

**Addendum Status**: ✅ Ready for Phase M1
**Next Review**: After Phase M3 completion
**Contact**: See parent PRD for contacts
