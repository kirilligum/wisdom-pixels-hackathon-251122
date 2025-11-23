# Wisdom Pixels Backend Architecture

## Recommended Mastra Features

Based on the Wisdom Pixels requirements, the following Mastra features are recommended:

### 1. **Agents**
Agents will handle the AI-powered content generation and analysis:

- **Content Analysis Agent**: Extracts personas, environments, and influencer profiles from brand marketing content
- **Card Generation Agent**: Generates customer queries and influencer-endorsed responses
- **Image Prompt Agent**: Creates detailed prompts for image generation based on card context

**Why Agents?**
- Complex reasoning required for extracting structured data from unstructured marketing content
- Context-aware generation of natural queries and responses
- Can use tools to fetch content and call external services

### 2. **Workflows**
Workflows orchestrate the multi-step card generation process:

- **Brand Onboarding Workflow**: Handles content ingestion → extraction → review
- **Card Generation Workflow**: Orchestrates persona/influencer selection → text generation → image generation
- **Publishing Workflow**: Manages card approval and status transitions

**Why Workflows?**
- Multi-step process with clear dependencies (extract before generate)
- Human-in-the-loop approval steps (suspend/resume for brand review)
- Error handling and retry logic for external API calls
- State management across steps

### 3. **Tools**
Tools provide integration with external services and utilities:

- **Content Fetcher Tool**: Fetches and processes marketing content from URLs
- **Image Generation Tool**: Integrates with FLUX 1.1 or similar image generation APIs
- **Database Tools**: CRUD operations for brands, personas, influencers, and cards

**Why Tools?**
- Reusable across different agents and workflows
- Structured input/output validation with Zod schemas
- Can be called by agents when needed

### 4. **Storage (LibSQL/PostgreSQL)**
Persist application data:

- Brands, Personas, Environments, Influencers
- Cards (with queries, responses, image URLs, status)
- Workflow state and execution history
- Memory/conversation threads for brand interactions

**Why Storage?**
- Workflows need persistent state for suspend/resume
- Memory requires storage for conversation history
- Production app needs reliable data persistence

### 5. **Memory** (Optional for v0, Recommended for Production)
Track conversations and context:

- Maintain brand interaction history
- Remember user preferences and feedback
- Context for iterative card refinement

**Why Memory?**
- Multi-turn conversations with brand marketers
- Maintain context across sessions
- Improve quality through learning from feedback

### 6. **RAG (Future Enhancement)**
Retrieve brand-specific knowledge when generating cards:

- Store and retrieve brand guidelines, tone, voice
- Access product features and benefits
- Reference successful card examples

**Why RAG?**
- Ensures consistency with brand messaging
- Reduces hallucination by grounding responses in brand data
- Scales to multiple brands with dedicated knowledge bases

---

## System Architecture Diagrams

### v0 Demo Architecture (Current - Hackathon)

```mermaid
graph TB
    subgraph "Frontend - Next.js/React"
        UI[Web Application UI]
        UI_BRAND[Brand Setup Screen]
        UI_REVIEW[Persona/Influencer Review]
        UI_GEN[Card Generation Screen]
        UI_GALLERY[Card Gallery]
        UI_DETAIL[Card Detail View]
        UI_PUBLISH[Publish View]
    end

    subgraph "Static Resources"
        JSON[Static JSON Files<br/>- brand-flowform.json<br/>- 20 Cards<br/>- Personas<br/>- Influencers]
        IMAGES[Pre-generated Images<br/>- 20 Card Images<br/>- Influencer Avatars]
    end

    UI --> UI_BRAND
    UI --> UI_REVIEW
    UI --> UI_GEN
    UI --> UI_GALLERY
    UI --> UI_DETAIL
    UI --> UI_PUBLISH

    UI_BRAND --> JSON
    UI_REVIEW --> JSON
    UI_GEN --> JSON
    UI_GALLERY --> JSON
    UI_DETAIL --> JSON
    UI_PUBLISH --> JSON

    UI_GALLERY --> IMAGES
    UI_DETAIL --> IMAGES

    style JSON fill:#e1f5ff
    style IMAGES fill:#e1f5ff
    style UI fill:#fff4e1
```

---

### Future Production Architecture (with Mastra)

```mermaid
graph TB
    subgraph "Client"
        WEB[Web App<br/>Next.js/React]
        MOBILE[Mobile App<br/>Future]
    end

    subgraph "Mastra Backend"
        subgraph "API Layer"
            API[Mastra Server<br/>API Routes]
        end

        subgraph "Agents"
            AGENT_CONTENT[Content Analysis Agent<br/>- Extract Personas<br/>- Extract Environments<br/>- Extract Influencer Profiles]
            AGENT_CARD[Card Generation Agent<br/>- Generate Queries<br/>- Generate Responses]
            AGENT_IMAGE[Image Prompt Agent<br/>- Create Image Prompts<br/>- Optimize for FLUX]
        end

        subgraph "Workflows"
            WF_ONBOARD[Brand Onboarding<br/>Workflow<br/>- Fetch Content<br/>- Extract Data<br/>- Human Review]
            WF_GENERATE[Card Generation<br/>Workflow<br/>- Select Personas/Influencers<br/>- Generate Text<br/>- Generate Images<br/>- Human Approval]
            WF_PUBLISH[Publishing<br/>Workflow<br/>- Validate Cards<br/>- Update Status<br/>- Generate URLs]
        end

        subgraph "Tools"
            TOOL_FETCH[Content Fetcher<br/>Tool]
            TOOL_IMAGE[Image Generation<br/>Tool]
            TOOL_DB[Database<br/>CRUD Tools]
        end

        subgraph "Infrastructure"
            STORAGE[LibSQL/PostgreSQL<br/>Storage<br/>- Brands<br/>- Personas<br/>- Influencers<br/>- Cards<br/>- Workflow State]
            MEMORY[Memory System<br/>- Conversation History<br/>- Brand Context]
            VECTOR[Vector Store<br/>Future/Optional<br/>- Brand Knowledge<br/>- Card Examples]
        end
    end

    subgraph "External Services"
        FLUX[FLUX 1.1 API<br/>Image Generation]
        CDN[Image CDN<br/>Cloudflare/S3]
        OPENAI[OpenAI/Anthropic<br/>LLM Services]
    end

    %% Client connections
    WEB --> API
    MOBILE -.-> API

    %% API to Workflows
    API --> WF_ONBOARD
    API --> WF_GENERATE
    API --> WF_PUBLISH

    %% Workflows use Agents
    WF_ONBOARD --> AGENT_CONTENT
    WF_GENERATE --> AGENT_CARD
    WF_GENERATE --> AGENT_IMAGE

    %% Agents use Tools
    AGENT_CONTENT --> TOOL_FETCH
    AGENT_CARD --> TOOL_DB
    AGENT_IMAGE --> TOOL_IMAGE

    %% Tools use Storage and External Services
    TOOL_FETCH --> STORAGE
    TOOL_DB --> STORAGE
    TOOL_IMAGE --> FLUX

    %% Workflows use Storage
    WF_ONBOARD --> STORAGE
    WF_GENERATE --> STORAGE
    WF_PUBLISH --> STORAGE

    %% Agents use Memory
    AGENT_CONTENT --> MEMORY
    AGENT_CARD --> MEMORY

    %% Memory uses Storage
    MEMORY --> STORAGE

    %% External service connections
    AGENT_CONTENT --> OPENAI
    AGENT_CARD --> OPENAI
    AGENT_IMAGE --> OPENAI
    FLUX --> CDN
    WEB --> CDN

    %% Future RAG
    AGENT_CONTENT -.-> VECTOR
    AGENT_CARD -.-> VECTOR
    VECTOR -.-> STORAGE

    %% Styling
    style AGENT_CONTENT fill:#d4edff
    style AGENT_CARD fill:#d4edff
    style AGENT_IMAGE fill:#d4edff
    style WF_ONBOARD fill:#e1f5d4
    style WF_GENERATE fill:#e1f5d4
    style WF_PUBLISH fill:#e1f5d4
    style TOOL_FETCH fill:#fff4d4
    style TOOL_IMAGE fill:#fff4d4
    style TOOL_DB fill:#fff4d4
    style STORAGE fill:#ffe1f5
    style MEMORY fill:#ffe1f5
    style VECTOR fill:#f0f0f0
    style API fill:#fff4e1
    style WEB fill:#e8f4fd
```

---

### Detailed Card Generation Workflow

```mermaid
graph TB
    START[Start: User Selects<br/>Personas & Influencers]

    subgraph "Card Generation Workflow"
        STEP1[Step 1: Validate Input<br/>- Check personas exist<br/>- Check influencers enabled]
        STEP2[Step 2: Generate Card Texts<br/>Card Generation Agent]
        STEP3[Step 3: Create Image Prompts<br/>Image Prompt Agent]
        STEP4[Step 4: Generate Images<br/>Image Generation Tool]
        STEP5[Step 5: Save Cards<br/>Database Tool]
        SUSPEND[Suspend for Review]
        STEP6[Step 6: Update Status<br/>Draft → Published]
    end

    END[End: Cards Ready]

    START --> STEP1
    STEP1 -->|Valid| STEP2
    STEP1 -->|Invalid| ERROR[Return Error]

    STEP2 -->|For Each Card| STEP3
    STEP3 --> STEP4
    STEP4 -->|Success| STEP5
    STEP4 -->|Failure| RETRY[Retry Image Gen]
    RETRY -->|Max Retries| ERROR
    RETRY --> STEP4

    STEP5 --> SUSPEND
    SUSPEND -->|User Approves| STEP6
    SUSPEND -->|User Rejects| STEP2

    STEP6 --> END

    style STEP2 fill:#d4edff
    style STEP3 fill:#d4edff
    style STEP4 fill:#fff4d4
    style STEP5 fill:#fff4d4
    style SUSPEND fill:#ffe1e1
```

---

### Data Flow: Brand Onboarding to Card Publication

```mermaid
sequenceDiagram
    participant User as Brand Marketer
    participant UI as Web UI
    participant API as Mastra API
    participant WF as Onboarding Workflow
    participant Agent as Content Analysis Agent
    participant Tool as Content Fetcher Tool
    participant Storage as Database Storage

    User->>UI: Submit Brand + URLs
    UI->>API: POST /api/brands
    API->>WF: Start Workflow

    WF->>Tool: Fetch Content
    Tool-->>WF: HTML Content

    WF->>Agent: Analyze Content
    Note over Agent: Extract:<br/>- Personas<br/>- Environments<br/>- Influencer Profiles
    Agent-->>WF: Structured Data

    WF->>Storage: Save Brand Data
    Storage-->>WF: Confirmation

    WF-->>API: Suspend for Review
    API-->>UI: Show Review Screen

    User->>UI: Approve/Edit Data
    UI->>API: Resume Workflow
    API->>WF: Resume with Updates

    WF->>Storage: Update Data
    Storage-->>WF: Success

    WF-->>API: Complete
    API-->>UI: Brand Ready
    UI-->>User: Show Card Generation Screen
```

---

## Key Architecture Decisions

### 1. **Why Workflows over Direct Agent Calls?**
   - **Suspend/Resume**: Brand marketers need to review and approve extracted data and generated cards
   - **State Management**: Track progress through multi-step generation (30+ cards per brand)
   - **Error Recovery**: Retry image generation or text generation on failure
   - **Auditability**: Log each step for debugging and compliance

### 2. **Why Multiple Agents vs. One Agent?**
   - **Separation of Concerns**: Content extraction requires different capabilities than text generation
   - **Specialized Models**: Can use different LLMs for different tasks (e.g., GPT-4 for extraction, GPT-4o-mini for generation)
   - **Parallel Execution**: Image prompt generation can happen in parallel with text generation
   - **Easier Testing**: Test each agent independently

### 3. **Why Tools for External Services?**
   - **Reusability**: Same image generation tool used by multiple agents/workflows
   - **Schema Validation**: Ensure image prompts match FLUX 1.1 requirements
   - **Error Handling**: Centralized retry logic and error messages
   - **Cost Tracking**: Monitor API usage per tool

### 4. **Storage Choice: LibSQL vs. PostgreSQL**
   - **v0/Demo**: LibSQL (in-memory or file-based) for simplicity
   - **Production**: PostgreSQL for:
     - Better query performance for card filtering/search
     - Full-text search for finding cards by query/response
     - Robust backup and replication
     - Existing ecosystem (e.g., Prisma, PostgREST)

### 5. **When to Use Memory?**
   - **Multi-Turn Conversations**: Brand marketer iterates on card generation with feedback
   - **Context Preservation**: Remember previous generations and user preferences
   - **Personalization**: Tailor responses based on brand's industry, tone, etc.

### 6. **Future: Why RAG?**
   - **Brand Guidelines**: Retrieve tone of voice, prohibited terms, compliance rules
   - **Product Catalog**: Access full product specs when generating responses
   - **Card Templates**: Learn from high-performing cards
   - **Multi-Brand**: Scale to 100+ brands without fine-tuning per brand

---

## Implementation Phases

### **Phase 1: v0 Demo (Current)**
- Static JSON + Pre-generated images
- Next.js frontend only
- No Mastra backend

### **Phase 2: Mastra Backend Foundation**
- Set up Mastra server with Storage (LibSQL)
- Implement Content Analysis Agent
- Implement Brand Onboarding Workflow (no suspend/resume yet)
- Database Tools for CRUD operations

### **Phase 3: Card Generation**
- Implement Card Generation Agent
- Implement Image Prompt Agent
- Integrate Image Generation Tool (FLUX 1.1 API)
- Implement Card Generation Workflow

### **Phase 4: Human-in-the-Loop**
- Add Workflow suspend/resume for brand review
- Implement approval UI in frontend
- Add Memory for conversation tracking

### **Phase 5: Scale & Polish**
- Migrate to PostgreSQL for production
- Add RAG for brand knowledge
- Implement multi-brand support
- Add observability and monitoring

---

## Technology Stack Summary

| Component | v0 Demo | Production |
|-----------|---------|------------|
| **Frontend** | Next.js + React | Next.js + React |
| **Backend** | None (static) | Mastra Server |
| **Agents** | N/A | Mastra Agents (GPT-4, GPT-4o-mini) |
| **Workflows** | N/A | Mastra Workflows |
| **Tools** | N/A | Mastra Tools |
| **Storage** | Static JSON | LibSQL → PostgreSQL |
| **Memory** | N/A | Mastra Memory |
| **RAG** | N/A | Future: Mastra RAG |
| **Image Gen** | Pre-generated | FLUX 1.1 API |
| **Image Hosting** | Local/Vercel | Cloudflare R2 / S3 + CDN |
| **LLM Provider** | N/A | OpenAI / Anthropic |
| **Deployment** | Vercel | Vercel / Cloud Run |

---

## Next Steps

1. **Complete v0 demo** with static data (as per plan)
2. **Set up Mastra project** with basic server configuration
3. **Implement Content Analysis Agent** and test with FlowForm marketing content
4. **Build Brand Onboarding Workflow** with single-step extraction
5. **Add suspend/resume** for human review
6. **Implement Card Generation Workflow** with text generation first
7. **Integrate FLUX 1.1** via Image Generation Tool
8. **Add Memory** for multi-turn conversations
9. **Scale to production** with PostgreSQL and monitoring
