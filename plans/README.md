# Wisdom Pixels Planning Documents

## Overview

This directory contains all planning, requirements, and execution documents for the Wisdom Pixels project - an AI-powered platform for generating branded training cards with influencer endorsements and photorealistic images.

## Document Hierarchy

```
📋 PRD (Requirements)
   └── wisdom-pixels-mastra-flux2-react-plan.md
       │
       ├── 📝 Addendum (Clarifications)
       │   └── wisdom-pixels-prd-addendum-v2.md
       │
       └── 🗺️ Execution Plan (Implementation)
           └── wisdom-pixels-execution-plan-v2.md
```

## Quick Navigation

### 1. **Primary Requirements Document** (READ FIRST)
**File**: `wisdom-pixels-mastra-flux2-react-plan.md`

**Purpose**: Comprehensive product and system requirements document

**Contents**:
- Business goals and success metrics
- 54 functional and non-functional requirements (REQ-001 to REQ-308)
- System architecture with Mastra agents, workflows, and tools
- 11 implementation phases (P00-P11)
- 24 test specifications (TEST-001 to TEST-502)
- Data schemas and contracts
- Requirements Traceability Matrix (RTM)

**When to read**: Before starting any implementation

---

### 2. **PRD Clarifications & Corrections** (READ SECOND)
**File**: `wisdom-pixels-prd-addendum-v2.md`

**Purpose**: Clarifies ambiguities in original PRD and documents migration strategy

**Contents**:
- ✅ FLUX model specification (alpha-image-232/edit-image vs. Schnell)
- ✅ Current implementation assessment (what exists now)
- ✅ Architecture migration strategy (strangler fig pattern)
- ✅ Data model corrections (Card schema, etc.)
- ✅ Test suite alignment plan
- ✅ Breaking changes log
- ✅ Environment variables updates

**When to read**: After reading PRD, before implementation

---

### 3. **Step-by-Step Implementation Guide** (READ THIRD)
**File**: `wisdom-pixels-execution-plan-v2.md`

**Purpose**: Detailed phase-by-phase implementation plan to build the full agentic system

**Contents**:
- Current state assessment (Phase P0-Current)
- 8 migration phases (M1-M8) with detailed tasks
- **Phase M1**: Database foundation (LibSQL/SQLite)
- **Phase M2**: Infrastructure tools (DbTool, ContentFetcherTool, ImageGenerationTool, UrlSlugTool)
- **Phase M3**: 5 specialized agents (ContentAnalysis, CardQuery, CardAnswer, ImageBrief, Safety)
- **Phase M4**: 3 workflows (BrandOnboarding, CardGeneration, Publishing)
- **Phase M5**: REST API layer (Express + controllers)
- **Phase M6**: Frontend migration (React → REST API)
- **Phase M7**: Testing & validation (align with PRD test IDs)
- **Phase M8**: Documentation & cleanup
- Timeline estimates (4-5 weeks solo, 2-3 weeks pair)
- File structure after migration
- Risk management

**When to read**: When ready to start coding

---

### 4. **Testing Strategy Guide** (READ ALONGSIDE IMPLEMENTATION)
**File**: `testing-strategy-per-phase.md`

**Purpose**: Comprehensive testing approach for validating each phase before proceeding

**Contents**:
- Testing philosophy (Red-Green-Refactor)
- **Phase M1**: Database schema, repository, and seed tests
- **Phase M2**: Tool unit tests and integration tests
- **Phase M3**: Agent prompt validation and content quality tests
- **Phase M4**: Workflow orchestration and E2E tests
- **Phase M5**: API contract and performance tests
- **Phase M6**: Frontend E2E and dependency audit tests
- **Phase M7**: RTM validation and comprehensive test suite
- Test helper utilities and patterns
- Exit criteria validation scripts for each phase

**When to read**: Before starting each phase (read relevant section)

---

### 5. **Testing Quick Reference** (KEEP HANDY)
**File**: `TESTING-QUICK-REFERENCE.md`

**Purpose**: Fast lookup for test commands and patterns

**Contents**:
- Test command cheat sheet for each phase
- Test pattern templates (unit, integration, API, E2E)
- Exit criteria checklists
- Common test utilities and helpers
- Debugging failed tests guide
- Test performance tips
- Critical test files per phase

**When to read**: During implementation (quick reference)

---

### 6. **Original Demo Plan** (HISTORICAL)
**File**: `wisdom-pixels-demo-plan.md`

**Purpose**: Earlier, simpler plan (now superseded by execution-plan-v2.md)

**Status**: ⚠️ Archived - Use execution-plan-v2.md instead

---

## Current Project Status

### ✅ What's Complete (P0-Current)

- React frontend with all UI screens
- Brand dashboard, card gallery, card detail views
- Basic Mastra integration (1 agent, 3 tools)
- fal.ai image generation (wrong model: Schnell)
- 47 Playwright E2E tests (wrong test IDs)
- Seed data for FlowForm brand

### ❌ What's Missing (70% of PRD)

- Database persistence layer (LibSQL/SQLite)
- 5 specialized agents (have 1 generic agent)
- 3 orchestrated workflows
- REST API backend layer
- Infrastructure tools (DbTool, ContentFetcherTool, etc.)
- Correct FLUX model (alpha-image-232/edit-image)
- Test suite aligned with PRD

### 📍 Where We Are Now

**Current Phase**: P0-Current (Prototype Complete)
**Next Phase**: M1 (Database Foundation)
**Overall Progress**: 30% of PRD implemented

---

## Getting Started with Implementation

### Step 1: Understand Requirements
```bash
# Read the PRD (30-45 minutes)
cat wisdom-pixels-mastra-flux2-react-plan.md | less

# Focus on these sections:
# - Section 2: PRD (Stakeholder needs)
# - Section 3: SRS (System requirements)
# - Section 3.7: System architecture diagram
# - Section 7: Data contract
```

### Step 2: Review Clarifications
```bash
# Read the addendum (15-20 minutes)
cat wisdom-pixels-prd-addendum-v2.md | less

# Key sections:
# - Section 1: FLUX model clarification
# - Section 3: Current implementation state
# - Section 4: Architecture migration strategy
```

### Step 3: Follow Execution Plan
```bash
# Read the execution plan (30-40 minutes)
cat wisdom-pixels-execution-plan-v2.md | less

# Start with Phase M1:
# - Install dependencies
# - Create database schema
# - Implement repositories
# - Seed database
```

### Step 4: Verify Prerequisites

Before starting Phase M1:

```bash
# 1. Check you have API keys
cat ../.env  # Should have FAL_KEY and OPENAI_API_KEY or ANTHROPIC_API_KEY

# 2. Verify fal.ai model availability
# (See execution-plan-v2.md Appendix section 14)

# 3. Confirm database location
mkdir -p ../app/.data  # For SQLite database

# 4. Review current codebase
cd ../app
ls -la mastra/  # Should see: agents/, tools/, index.ts
ls -la src/     # Should see: components/, pages/, lib/
```

---

## Phase Checklist

Use this to track progress:

- [ ] **M1: Database Foundation** (2-3 days)
  - [ ] Install LibSQL/Drizzle dependencies
  - [ ] Create schema with 6 tables
  - [ ] Implement repositories
  - [ ] Seed database with FlowForm data
  - [ ] TEST-301 passing

- [ ] **M2: Infrastructure Tools** (2-3 days)
  - [ ] Create DbTool
  - [ ] Create ContentFetcherTool
  - [ ] Create ImageGenerationTool (alpha-image-232)
  - [ ] Create UrlSlugTool
  - [ ] TEST-501, TEST-502 passing

- [ ] **M3: Specialized Agents** (3-4 days)
  - [ ] Create ContentAnalysisAgent
  - [ ] Create CardQueryAgent
  - [ ] Create CardAnswerAgent
  - [ ] Create SafetyAgent
  - [ ] Create ImageBriefAgent
  - [ ] TEST-302, TEST-304, TEST-306 passing

- [ ] **M4: Workflows** (4-5 days)
  - [ ] Create BrandOnboardingWorkflow
  - [ ] Create CardGenerationWorkflow
  - [ ] Create PublishingWorkflow
  - [ ] WorkflowRun tracking
  - [ ] TEST-001, TEST-002, TEST-006 passing

- [ ] **M5: REST API** (3-4 days)
  - [ ] Set up Express server
  - [ ] Implement 8 endpoints
  - [ ] Add middleware (validation, error handling)
  - [ ] TEST-201, TEST-102 passing

- [ ] **M6: Frontend Migration** (2-3 days)
  - [ ] Create API client
  - [ ] Update React components
  - [ ] Remove direct Mastra calls
  - [ ] TEST-101, TEST-103 passing

- [ ] **M7: Testing** (2-3 days)
  - [ ] Align test IDs with PRD
  - [ ] Create missing tests
  - [ ] Performance testing
  - [ ] All PRD tests passing

- [ ] **M8: Documentation** (1-2 days)
  - [ ] Update README
  - [ ] API documentation
  - [ ] Clean up old code
  - [ ] Final validation

---

## Key Decisions Documented

### Decision 1: Strangler Fig Migration
**What**: Build new system alongside current, migrate incrementally
**Why**: Lower risk, always have working demo, easier debugging
**When**: Phases M1-M6
**Document**: execution-plan-v2.md Section 2

### Decision 2: Use alpha-image-232/edit-image (Not Schnell)
**What**: Switch from flux/schnell to alpha-image-232/edit-image
**Why**: Supports reference images (image_urls[]), better for product placement
**When**: Phase M2
**Document**: prd-addendum-v2.md Section 1

### Decision 3: 5 Specialized Agents (Not 1 Generic)
**What**: Replace single contentAgent with 5 focused agents
**Why**: Separation of concerns, testability, maintainability per PRD
**When**: Phase M3
**Document**: execution-plan-v2.md Section 3, Phase M3

### Decision 4: REST API Layer (Not Direct Mastra Calls)
**What**: Add Express API between frontend and Mastra
**Why**: PRD architecture requires separation, better for auth/validation
**When**: Phase M5
**Document**: prd-addendum-v2.md Section 4

### Decision 5: LibSQL/SQLite (Not JSON Files)
**What**: Use database instead of seed data
**Why**: PRD requirement REQ-003, needed for constraints and concurrency
**When**: Phase M1
**Document**: prd-addendum-v2.md Section 12, Q2

---

## Success Metrics

### Technical Metrics (Must Achieve)
- ✅ All 5 specialized agents operational
- ✅ All 3 workflows execute successfully
- ✅ All 4 infrastructure tools working
- ✅ Database persists all entities
- ✅ REST API responds <500ms
- ✅ 95%+ workflow success rate
- ✅ Images from alpha-image-232/edit-image

### Functional Metrics (Must Achieve)
- ✅ Brand onboarding extracts 3+ personas, 3+ environments, 5 influencers
- ✅ Card generation produces 20+ valid cards
- ✅ All cards have non-empty imageUrl from FLUX
- ✅ SafetyAgent flags medical claims
- ✅ Queries mention influencers, responses mention product

### User Experience Metrics (Should Achieve)
- ✅ Demo user completes flow in <3 minutes
- ✅ Gallery loads 20 cards in <2 seconds
- ✅ UI responsive during workflows
- ✅ Clear, actionable error messages

---

## Questions? Issues?

### Common Questions

**Q: Where do I start?**
A: Read the PRD, then addendum, then start Phase M1 in execution plan.

**Q: Can I skip phases?**
A: No. Each phase depends on the previous. Bottom-up approach is critical.

**Q: What if alpha-image-232/edit-image is unavailable?**
A: Check fal.ai docs for replacement. Update PRD addendum with new model.

**Q: Why not just use the current simple implementation?**
A: It doesn't meet PRD requirements. Missing 70% of functionality and wrong architecture.

**Q: How long will this take?**
A: 4-5 weeks solo, 2-3 weeks for a pair. See execution-plan-v2.md Section 7.

### Issue Tracking

If you find issues in the plans:

1. Document the issue
2. Update the relevant plan document
3. Add to the "Deviations from plan" section
4. Update phase notes in execution log

---

## Document Versions

| Document | Version | Last Updated | Status |
|----------|---------|--------------|--------|
| wisdom-pixels-mastra-flux2-react-plan.md | 0.2-draft | 2025-11-23 | ✅ Active |
| wisdom-pixels-prd-addendum-v2.md | 2.0 | 2025-11-23 | ✅ Active |
| wisdom-pixels-execution-plan-v2.md | 2.0 | 2025-11-23 | ✅ Active |
| testing-strategy-per-phase.md | 1.0 | 2025-11-23 | ✅ Active |
| TESTING-QUICK-REFERENCE.md | 1.0 | 2025-11-23 | ✅ Active |
| UPDATES-2025-11-23.md | 1.0 | 2025-11-23 | 📋 Changelog |
| wisdom-pixels-demo-plan.md | 1.0 | (Earlier) | ⚠️ Archived |

---

## Recent Updates

**2025-11-23**: Clarified testing stack and tools
- Added testing stack overview to all testing documents
- Specified **Jest** for backend (M1-M4), **Supertest + Jest** for API (M5), **Playwright** for frontend (M6-M7)
- Established file naming convention: `.test.ts` (Jest) vs `.spec.ts` (Playwright)
- See `UPDATES-2025-11-23.md` for full details

---

## References

- **Mastra Documentation**: https://mastra.ai/docs
- **fal.ai API Docs**: https://fal.ai/models/fal-ai/alpha-image-232/edit-image
- **Drizzle ORM Docs**: https://orm.drizzle.team/
- **Project Repository**: /home/kirill/hachathons/wisdom-pixels-hackathon-251122/

---

**Last Updated**: 2025-11-23
**Maintained By**: Implementation Team
**Status**: 📋 Ready for Phase M1 Implementation
