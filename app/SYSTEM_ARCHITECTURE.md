# Wisdom Pixels - System Architecture

**Hackathon Submission - November 23, 2025**

---

## 🎯 Project Overview

Wisdom Pixels is an AI-powered training card generation system that creates personalized product education content featuring virtual influencers. The system uses a **multi-agent architecture** built with Mastra to orchestrate content analysis, card generation, safety filtering, and AI image generation.

---

## 🏗️ System Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
│  React 19 + TypeScript + Vite                               │
│  - Brand onboarding UI                                      │
│  - Card gallery with filters                                │
│  - Influencer roster                                        │
│  - Card detail view with editing                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER                               │
│  Express.js REST API (Port 3001)                            │
│  - 8 REST endpoints                                         │
│  - Zod request validation                                   │
│  - CORS + error handling                                    │
│  - Health check endpoint                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   MASTRA BACKEND LAYER                      │
│  Multi-Agent Orchestration (Port 4111)                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           5 SPECIALIZED AGENTS                       │  │
│  │                                                       │  │
│  │  1. ContentAnalysisAgent                            │  │
│  │     - Extracts personas (3+)                        │  │
│  │     - Extracts environments (3+)                    │  │
│  │                                                       │  │
│  │  2. CardQueryAgent                                  │  │
│  │     - Generates questions                            │  │
│  │     - Mentions influencer by name (REQ-202)         │  │
│  │                                                       │  │
│  │  3. CardAnswerAgent                                 │  │
│  │     - Generates influencer responses                │  │
│  │     - Mentions brand/product (REQ-204)              │  │
│  │                                                       │  │
│  │  4. SafetyAgent                                     │  │
│  │     - Reviews content for violations (REQ-106)      │  │
│  │     - Flags medical, offensive, spam                │  │
│  │                                                       │  │
│  │  5. ImageBriefAgent                                 │  │
│  │     - Generates FLUX prompts (REQ-108)              │  │
│  │     - Includes reference images                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           3 ORCHESTRATED WORKFLOWS                   │  │
│  │                                                       │  │
│  │  1. BrandOnboardingWorkflow                         │  │
│  │     → Generate slug                                  │  │
│  │     → Create brand                                   │  │
│  │     → Analyze content (ContentAnalysisAgent)        │  │
│  │     → Save personas & environments (parallel)       │  │
│  │                                                       │  │
│  │  2. CardGenerationWorkflow                          │  │
│  │     → Load context                                   │  │
│  │     → Generate combinations                          │  │
│  │     → For each: Query + Answer + Safety + Image    │  │
│  │     → Save cards (parallel, concurrency=2)          │  │
│  │                                                       │  │
│  │  3. PublishingWorkflow                              │  │
│  │     → Validate cards                                 │  │
│  │     → Publish (parallel, concurrency=5)             │  │
│  │     → Return counts                                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           4 INFRASTRUCTURE TOOLS                     │  │
│  │                                                       │  │
│  │  - DbTool (20 database operations)                  │  │
│  │  - ContentFetcherTool (URL → text)                  │  │
│  │  - ImageGenerationTool (FLUX alpha-image-232)       │  │
│  │  - UrlSlugTool (unique slug generation)             │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                            │
│  SQLite + Drizzle ORM + better-sqlite3                      │
│                                                             │
│  6 Tables:                                                  │
│  - brands (with unique urlSlug)                             │
│  - personas (3+ per brand, FK cascades)                     │
│  - environments (3+ per brand, FK cascades)                 │
│  - influencers (5 preset, toggleable)                       │
│  - cards (Q&A + image, draft/published)                     │
│  - workflow_runs (execution tracking)                       │
│                                                             │
│  6 Repositories:                                            │
│  - BrandsRepository (CRUD + slug generation)                │
│  - PersonasRepository (CRUD + findByBrandId)                │
│  - EnvironmentsRepository (CRUD + findByBrandId)            │
│  - InfluencersRepository (CRUD + toggle)                    │
│  - CardsRepository (CRUD + publish + filters)               │
│  - WorkflowRunsRepository (tracking)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│  - fal.ai (FLUX alpha-image-232/edit-image)                 │
│  - OpenAI (GPT-4o-mini) OR Anthropic (Claude 3.5 Sonnet)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Innovation: Multi-Agent Architecture

### Why Multiple Specialized Agents?

Instead of a single monolithic prompt, Wisdom Pixels uses **5 specialized agents**, each with focused responsibilities:

| Agent | Responsibility | Why Separate? |
|-------|---------------|----------------|
| **ContentAnalysisAgent** | Extract personas & environments | Requires deep content analysis expertise |
| **CardQueryAgent** | Generate questions | Needs understanding of persona pain points |
| **CardAnswerAgent** | Generate influencer responses | Requires authentic voice + brand knowledge |
| **SafetyAgent** | Flag policy violations | Specialized safety/compliance knowledge |
| **ImageBriefAgent** | Create FLUX prompts | Image generation prompt engineering |

### Benefits of Multi-Agent Approach:

1. **Separation of Concerns** - Each agent has a single, well-defined responsibility
2. **Specialized Prompts** - Tailored instructions for each task type
3. **Parallel Execution** - Agents can run simultaneously (personas + environments)
4. **Independent Evolution** - Improve one agent without affecting others
5. **Better Error Handling** - Safety checks before expensive image generation

---

## 📊 Database Schema (ER Diagram)

```
┌─────────────────┐
│     brands      │
│─────────────────│
│ id (PK)         │
│ name            │
│ domain          │
│ urlSlug (UNIQUE)│◄────────┐
│ contentSources[]│         │
│ createdAt       │         │
└─────────────────┘         │
        ▲                   │
        │                   │
        │ FK (ON DELETE     │
        │     CASCADE)      │
        │                   │
┌───────┴─────────┐         │
│    personas     │         │
│─────────────────│         │
│ id (PK)         │         │
│ brandId (FK)    │─────────┤
│ label           │         │
│ description     │         │
│ tags[]          │         │
└─────────────────┘         │
                            │
┌───────────────────┐       │
│   environments    │       │
│───────────────────│       │
│ id (PK)           │       │
│ brandId (FK)      │───────┤
│ label             │       │
│ description       │       │
│ tags[]            │       │
└───────────────────┘       │
                            │
┌─────────────────┐         │
│   influencers   │         │
│─────────────────│         │
│ id (PK)         │         │
│ name            │         │
│ bio             │         │
│ domainExpertise │         │
│ referenceImgUrl │         │
│ enabled         │         │
└─────────────────┘         │
        ▲                   │
        │                   │
        │ FK                │
        │                   │
┌───────┴─────────┐         │
│      cards      │         │
│─────────────────│         │
│ cardId (PK)     │         │
│ brandId (FK)    │─────────┘
│ personaId (FK)  │
│ environmentId   │
│ influencerId    │
│ query           │
│ response        │
│ imageUrl        │
│ imageBrief      │
│ status          │
│ viewCount       │
│ shareCount      │
│ publishedAt     │
└─────────────────┘
```

---

## 🚀 REST API Endpoints

### 8 Core Endpoints + Health Check

| Method | Endpoint | Description | Workflow |
|--------|----------|-------------|----------|
| POST | `/api/brands` | Create brand | BrandOnboardingWorkflow |
| GET | `/api/brands/:id` | Get brand details | - |
| GET | `/api/brands/:id/personas` | List personas | - |
| GET | `/api/brands/:id/environments` | List environments | - |
| POST | `/api/brands/:id/cards/generate` | Generate cards | CardGenerationWorkflow |
| GET | `/api/brands/:id/cards?filters` | List cards | - |
| GET | `/api/cards/:id` | Get card details | - |
| POST | `/api/cards/publish` | Publish cards | PublishingWorkflow |
| GET | `/api/health` | Health check | - |

All endpoints use:
- ✅ Zod validation for type safety
- ✅ Proper HTTP status codes (200, 201, 400, 404, 500)
- ✅ CORS enabled for frontend
- ✅ Async error handling

---

## 🧪 Testing Strategy

### Three-Tier Testing Pyramid

```
       ┌─────────────┐
       │   E2E Tests │  47 Playwright tests
       │  (Slowest)  │  - Full user journeys
       └─────────────┘  - Browser automation
            ▲
            │
       ┌────┴────────┐
       │ Integration │  Pending (37 tests)
       │    Tests    │  - API contracts
       │  (Medium)   │  - Workflow E2E
       └─────────────┘  - Agent integration
            ▲
            │
       ┌────┴────────┐
       │ Unit Tests  │  27 passing tests
       │  (Fastest)  │  - Database schema
       └─────────────┘  - Repositories
```

**Test Coverage:**
- ✅ Database: 27/27 tests passing
- ⚠️ Tools: 25/25 tests (need syntax fix)
- ⏳ Agents: 0/15 tests (pending)
- ⏳ Workflows: 0/12 tests (pending)
- ⏳ API: 0/10 tests (pending)
- ✅ E2E: 47/47 tests passing

---

## 💎 Technology Stack

### Frontend
- **React 19** - Latest React with improved hooks
- **TypeScript 5.9** - Full type safety
- **Vite 7.2** - Fast build tool
- **React Router 7.9** - Client-side routing

### Backend
- **Mastra 0.18.5** - Multi-agent orchestration
- **Express.js 4.21** - REST API server
- **Node.js 20** - JavaScript runtime

### Database
- **SQLite** - Embedded database
- **Drizzle ORM 0.44** - Type-safe ORM
- **better-sqlite3** - Synchronous driver

### AI/ML
- **OpenAI GPT-4o-mini** OR **Anthropic Claude 3.5 Sonnet** - Agent LLMs
- **fal.ai FLUX alpha-image-232/edit-image** - Image generation with reference images

### Testing
- **Jest 30** - Unit testing
- **Playwright 1.56** - E2E testing
- **Supertest 7** - API testing

### Type Safety
- **Zod 4** - Runtime validation
- **TypeScript** - Compile-time type checking
- **Drizzle ORM** - Database query type safety

---

## 🎯 PRD Requirements Satisfied

| Requirement | Description | Status |
|-------------|-------------|--------|
| REQ-001 | Extract brand schema from content | ✅ ContentAnalysisAgent |
| REQ-102 | Extract 3+ personas per brand | ✅ ContentAnalysisAgent |
| REQ-103 | Extract 3+ environments per brand | ✅ ContentAnalysisAgent |
| REQ-105 | Generate 20+ cards per brand | ✅ CardGenerationWorkflow |
| REQ-106 | Safety review before generation | ✅ SafetyAgent |
| REQ-107 | Cards can be published | ✅ PublishingWorkflow |
| REQ-108 | Each card has AI-generated image | ✅ ImageBriefAgent + FLUX |
| REQ-109 | Images use influencer references | ✅ ImageGenerationTool |
| REQ-202 | Queries mention influencer name | ✅ CardQueryAgent |
| REQ-204 | Responses mention brand/product | ✅ CardAnswerAgent |

---

## ⚡ Performance Optimizations

1. **Parallel Execution**
   - Personas & environments saved simultaneously
   - Cards generated with concurrency=2
   - Publishing with concurrency=5

2. **Database Optimizations**
   - Foreign key cascades (automatic cleanup)
   - Indexed queries on brandId, status
   - Unique constraints on urlSlug

3. **Error Handling**
   - Safety filtering before expensive image generation
   - Graceful degradation (cards saved without images on failure)
   - Workflow state tracking for debugging

---

## 📦 Project Structure

```
app/
├── api/                       # REST API Layer
│   ├── server.ts             # Express.js server (8 endpoints)
│   └── index.ts              # Entry point
│
├── mastra/                    # Mastra Backend Layer
│   ├── agents/               # 5 Specialized Agents
│   │   ├── content-analysis-agent.ts
│   │   ├── card-query-agent.ts
│   │   ├── card-answer-agent.ts
│   │   ├── safety-agent.ts
│   │   └── image-brief-agent.ts
│   │
│   ├── workflows/            # 3 Orchestrated Workflows
│   │   ├── brand-onboarding-workflow.ts
│   │   ├── card-generation-workflow.ts
│   │   └── publishing-workflow.ts
│   │
│   ├── tools/                # 4 Infrastructure Tools
│   │   ├── db-tool.ts
│   │   ├── content-fetcher-tool.ts
│   │   ├── image-generation-tool.ts
│   │   └── url-slug-tool.ts
│   │
│   ├── db/                   # Database Layer
│   │   ├── schema.ts         # 6 tables
│   │   ├── client.ts         # Drizzle setup
│   │   ├── migrate.ts        # Migration runner
│   │   ├── seed.ts           # Seed data
│   │   └── repositories/     # 6 repository classes
│   │
│   └── index.ts              # Mastra configuration
│
├── src/                       # Frontend Layer
│   ├── lib/
│   │   └── api-client.ts     # REST API client wrapper
│   ├── components/           # React components
│   ├── pages/                # Route pages
│   └── main.tsx              # Entry point
│
├── tests/                     # Testing Layer
│   ├── unit/db/              # 27 database tests ✅
│   ├── unit/tools/           # 25 tool tests ⚠️
│   ├── TEST-*.spec.ts        # 47 E2E tests ✅
│   └── helpers/              # Test utilities
│
└── .data/                     # SQLite Database
    └── wisdom-pixels.db      # Seeded with FlowForm
```

---

## 🚀 Running the System

### Development Mode (3 Servers)

```bash
# Terminal 1: Mastra Server (Port 4111)
npm run dev:mastra

# Terminal 2: REST API Server (Port 3001)
npm run dev:api

# Terminal 3: Frontend Dev Server (Port 5173)
npm run dev
```

### Testing

```bash
# Run all unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run specific test suites
npm run test:m1  # Database tests
npm run test:e2e # Playwright E2E tests
```

### Database Management

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with FlowForm example
npm run db:seed
```

---

## 📊 Current Status: 70% Complete

### ✅ Completed (Phases M1-M5)
- Database with 6 tables, 6 repositories, 27 tests passing
- 4 infrastructure tools (DbTool, ContentFetcherTool, ImageGenerationTool, UrlSlugTool)
- 5 specialized agents (ContentAnalysis, CardQuery, CardAnswer, Safety, ImageBrief)
- 3 orchestrated workflows (BrandOnboarding, CardGeneration, Publishing)
- 8 REST API endpoints + health check
- API client wrapper for frontend
- Frontend UI with 47 E2E tests passing

### ⏳ Remaining (Phases M6-M8)
- Frontend API integration (update React components)
- Test suite completion (37 tests: 15 agent + 12 workflow + 10 API)
- API documentation (OpenAPI/Swagger)
- Deployment guide

---

## 🏆 What Makes This Special

1. **True Multi-Agent Architecture**
   - Not just prompt chaining - actual Mastra agents with tools
   - Each agent has specialized responsibilities
   - Orchestrated via workflows with parallel execution

2. **Reference-Based Image Generation**
   - FLUX alpha-image-232/edit-image with reference images
   - Consistent influencer appearance across all cards
   - Photorealistic product placement

3. **Type Safety Throughout**
   - TypeScript on frontend and backend
   - Zod for runtime validation
   - Drizzle for type-safe database queries

4. **Proper Separation of Concerns**
   - Frontend → REST API → Mastra → Database → External Services
   - Each layer has clear responsibilities
   - Easy to test and maintain

5. **Production-Ready Patterns**
   - Database migrations with Drizzle
   - Repository pattern for data access
   - Workflow execution tracking
   - Error handling at every layer

---

## 📝 For Hackathon Judges

### Demo Workflow

1. **Brand Onboarding**
   - POST `/api/brands` with brand name and domain
   - BrandOnboardingWorkflow extracts 3+ personas and 3+ environments
   - Database populated with brand context

2. **Card Generation**
   - POST `/api/brands/:id/cards/generate`
   - CardGenerationWorkflow creates 20+ cards
   - Each card: persona × environment × influencer combination
   - Safety filtering + FLUX image generation

3. **Publishing**
   - POST `/api/cards/publish` with card IDs
   - PublishingWorkflow validates and publishes
   - Cards become visible in gallery

### Key Files to Review

- `mastra/index.ts` - See all agents/tools/workflows registered
- `api/server.ts` - See all REST endpoints
- `mastra/workflows/card-generation-workflow.ts` - See multi-agent orchestration
- `mastra/agents/` - See specialized agent prompts
- `IMPLEMENTATION_STATUS.md` - Detailed progress report

---

**Built with ❤️ using Mastra for the Hackathon**
