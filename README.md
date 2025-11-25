<!-- Demo video -->
[![Wisdom Pixels Demo](https://img.youtube.com/vi/CQqQXRbRwN4/hqdefault.jpg)](https://youtu.be/CQqQXRbRwN4)

Direct link: https://youtu.be/CQqQXRbRwN4

# Wisdom Pixels – Hackathon 2025 Demo

## Screenshots

<table>
  <tr>
    <td>
      <a href="images/wisdojm_pixels_screen_1.png">
        <img src="images/wisdojm_pixels_screen_1.png" alt="Wisdom Pixels Screen 1" width="380">
      </a>
    </td>
    <td>
      <a href="images/wisdojm_pixels_screen_2.png">
        <img src="images/wisdojm_pixels_screen_2.png" alt="Wisdom Pixels Screen 2" width="380">
      </a>
    </td>
  </tr>
  <tr>
    <td>
      <a href="images/wisdojm_pixels_screen_3.png">
        <img src="images/wisdojm_pixels_screen_3.png" alt="Wisdom Pixels Screen 3" width="380">
      </a>
    </td>
    <td>
      <a href="images/wisdojm_pixels_screen_4.png">
        <img src="images/wisdojm_pixels_screen_4.png" alt="Wisdom Pixels Screen 4" width="380">
      </a>
    </td>
  </tr>
</table>

## Overview

Wisdom Pixels is an agentic AI system that turns a brand’s marketing content into **multi‑modal training examples for future AI assistants**.

The system:

- Ingests a product’s landing pages and other marketing URLs.
- Extracts **ideal customer personas**, **environments**, and **influencer profiles** using Mastra agents.
- Automatically generates a set of **Wisdom Cards**:
  - realistic user **queries** (the kind people ask ChatGPT),
  - **influencer‑backed answers** that recommend the product in context,
  - **photorealistic images** of the product in use with an influencer in a relevant environment.

Each Wisdom Card is both:

- a **web unit** (query + answer + image + unique URL), and  
- a **training sample** for instruction‑style, multi‑modal fine‑tuning.

For the demo we built **FlowForm**, a fictional 10‑sensor motion suit for yoga, strength, and running, aimed at desk‑bound knowledge workers. Wisdom Pixels uses:

- **Mastra agents** for content understanding, persona/env extraction, and copy generation.
- **fal.ai Nano Banana Pro** for photorealistic product + influencer scenes (current default model).
- A **React frontend** to browse cards as a gallery, view detail pages, and open full‑size images.

### Problem: Feeds vs AI surfaces

- Today, **influencer marketing runs through feeds** (TikTok, Instagram, YouTube), where targeting is mainly by keywords, tags, and rough segments, and content disappears quickly in the scroll.
- At the same time, **AI surfaces (ChatGPT, LLM search, assistants)** are becoming the place where people ask, “What should I buy?” and “How should I train?”—but brands have almost no way to shape these answers.
- Wisdom Pixels turns a brand’s marketing content into **persona‑ and environment‑aware training cards**, so that future AI systems can answer with:
  - the right **persona** (“WFH yoga creative” vs “late‑start runner”),
  - the right **environment** (small apartment, park loop, clinic),
  - and a **familiar influencer face** wearing/using the product.

---

## Demo Story: FlowForm Motion Suit

**Product**  
FlowForm Motion Suit is a fictional smart motion suit with ~10 sensors (arms, legs, chest, headband). It provides real‑time form feedback for:

- Yoga  
- Light strength work  
- Easy running

Target customers: people who spend most of the day at a desk and want better movement (“desk body” recovery).

**Influencers**

The demo uses synthetic, photorealistic influencer profiles (e.g., *Dr. Mira Solis*, a PT + yoga teacher) across diverse ages and backgrounds. Each Wisdom Card can mention a specific influencer and shows them using the FlowForm suit in:

- A small apartment yoga corner  
- A mountain / waterfall yoga retreat (split images)  
- A clinic / research office  
- A minimal home strength corner  
- A city park running trail

**What the demo shows**

From just FlowForm’s “marketing content,” Wisdom Pixels generates ~20 Wisdom Cards covering:

- Different **personas** (WFH yoga creative, mid‑career desk worker, late‑start runner, young parent, etc.).
- Multiple **influencers**.
- Multiple **environments**.

The React UI renders these as a card gallery. Clicking a card shows:

- The **query** a user might ask an AI assistant (mentioning the influencer),
- The **answer** the assistant should give (influencer‑backed, on‑brand),
- The **image** of the influencer in the FlowForm motion suit in a matching scene,
- A unique URL that can be used for click‑tracking or future multi‑modal training.

---

## Architecture

Repo layout:

- `app/` – application code (frontend + API + Mastra).  
- `prds/` – product requirements and demo spec (see `prds/init.md`).  
- `plans/` – implementation plans and status.

Key components inside `app/`:

**Frontend (React + Vite)**

- `src/pages/HomePage.tsx` – entry; link to FlowForm brand dashboard.  
- `src/pages/BrandSetup.tsx` – brand setup & content ingestion UI.  
- `src/pages/BrandDashboard.tsx` – main dashboard:
  - **Product** tab – FlowForm description, content sources, product gallery (DB‑backed uploads).
  - **Influencers** tab – roster, enable/disable, “Find New”, delete, influencer galleries.
  - **Cards** tab – Wisdom Card gallery (filters, full‑size image lightbox, status badges).
- `src/components/CardGallery.tsx` – card grid with influencer/persona filters and lightbox on image click.

**API (Hono + Node)**

Entry: `api/index.ts` (served by `tsx watch api/index.ts`):

- `GET /api/health` – health check.  
- `POST /api/brands` – brand onboarding workflow.  
- `GET /api/brands` – list brands.  
- `GET /api/brands/:brandId` – get brand by id.  
- `GET /api/brands/slug/:slug` – get brand by slug (used for FlowForm).  
- `GET /api/brands/:brandId/personas` – personas.  
- `GET /api/brands/:brandId/environments` – environments.  
- `GET /api/brands/:brandId/cards` – cards.  
- `GET /api/cards/:cardId` – single card.  
- `GET /api/influencers` – list influencers.  
- `PATCH /api/influencers/:id/enabled` – enable/disable influencer.  
- `DELETE /api/influencers/:id` – delete influencer (cards cascade).  
- `POST /api/influencers/find-new` – generate/add new influencers & galleries.  
- `GET /api/influencers/:id/gallery` – headshot + action images for influencer.  
- `POST /api/brands/:brandId/images` – store product images (used by Product tab).  
- `POST /api/content/generate` – Mastra content agent wrapper.

**Mastra / AI logic**

- `mastra/index.ts` – Mastra app wiring.  
- `mastra/agents/content-agent.ts` – Content Generation Agent:
  - Model selection:
    - `anthropic/claude-haiku-4-5` if `ANTHROPIC_API_KEY` is set, else  
    - `openai/gpt-4o-mini` if `OPENAI_API_KEY` is set.
  - Uses tools from `mastra/tools/content-tool.ts` to generate personas, environments, and training cards.
- `mastra/tools/image-generation-tool.ts` – image generation with **fal-ai/nano-banana-pro** (text) and **fal-ai/nano-banana-pro/edit** (image edit), including reference images for influencer consistency.
- `mastra/workflows/*` – workflows for brand onboarding, card generation, and publishing.

**Data / DB layer**

- SQLite via **better-sqlite3** + **drizzle-orm**.  
- Schema: `mastra/db/schema.ts`:
  - `brands` (includes `productImages` JSON column).  
  - `personas`, `environments`, `influencers`, `cards`, `workflow_runs`.  
- Repositories: `mastra/db/repositories/*`.  
- Migrations: `mastra/db/migrations/`.

---

## System Architecture Diagram

```mermaid
flowchart LR
  U[Brand marketer] --> UI[Brand Dashboard]
  UI --> API[Hono API]
  API --> Mastra[Mastra agents & workflows]
  Mastra --> DB[(SQLite DB)]
  API --> Fal[fal.ai image generation]
  DB --> DS[Wisdom Cards dataset]
```

**How a brand creates a dataset for its product**

1. **Ingest marketing content**  
   The brand user pastes FlowForm landing/marketing URLs in the Product/Brand setup UI.  
   The frontend sends these to the Hono API, which runs a Mastra workflow + content agent to extract:
   - customer personas,
   - environments,
   - influencer personas/value props,  
   and stores them in SQLite.

2. **Configure influencers & images**  
   In the Influencers tab, the brand (or demo) adds synthetic influencer profiles via the API.  
   The API calls fal.ai Nano Banana Pro to generate:
   - headshots,
   - action shots (yoga, strength, running),  
   and saves their URLs in the influencers table.  
   Product hero images can be uploaded via the Product tab and stored on the brand row.

3. **Generate Wisdom Cards**  
   A workflow (CardGeneration) uses personas, environments, influencer personas, and product info to ask the content agent to produce:
   - realistic queries a customer would ask an AI assistant (including influencer names),
   - influencer‑backed answers that mention FlowForm in context.  
   Each card is associated with an influencer, persona, and environment, and an image URL.

4. **Review & publish in the UI**  
   The Cards tab reads cards from `/api/brands/:id/cards` and shows:
   - image thumbnail (influencer + FlowForm in scene),
   - query text,
   - card status.  
   The Publish tab lets the user select “ready” cards to mark as published.

5. **Export as a training dataset**  
   The same cards can be exported from the DB as JSONL (or similar), giving you a **multi‑modal instruction‑style dataset**:
   - `user` message = query,  
   - `assistant` message = answer,  
   - `image` = URL to the FlowForm + influencer scene.  
   This is what Wisdom Pixels ultimately produces for AI search / recommender training.

### Influencer scoring (prototype)

The repo also contains experimental JSON files under `app/public/json/` (for example `priya_nair.json`) that demonstrate how we might score influencers for:

- `semanticFit` – how well their content semantically matches the brand and product.
- `datasetDiversity` – how much new coverage they add to the existing dataset.
- `partners` / `competitors` – brands they’ve worked with or overlap with.

These scores are **not yet wired into the UI**; they are design prototypes for a future “influencer scoring” module.

---

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript.  
- **Backend API**: Hono on Node (via `@hono/node-server`).  
- **Agents & tools**: Mastra (`@mastra/core`, `@mastra/client-js`).  
- **LLMs**:
  - Anthropic Claude Haiku 4.5 (`anthropic/claude-haiku-4-5`) or  
  - OpenAI GPT‑4o‑mini (`openai/gpt-4o-mini`), chosen via env vars.  
- **Image generation (current)**: fal.ai Nano Banana Pro (`fal-ai/nano-banana-pro` and `fal-ai/nano-banana-pro/edit`) via `@fal-ai/client`.  
- **Image generation (hackathon, retired)**: originally built against **fal.ai / BFL FLUX 2 (Alpha Image 232)**. That endpoint was turned off after the hackathon; the FLUX call is kept commented out in the image playground as a reference.
- **Database**: SQLite + drizzle‑orm + better-sqlite3.

---

## Running the Demo Locally

From the repo root, all app code is in `app/`.

### 1. Install dependencies

```bash
cd app
npm install
```

### 2. Configure environment variables

Create `app/.env` if it doesn’t exist and set at least:

```bash
# One of these (for LLMs powering agents/workflows)
OPENAI_API_KEY=your_openai_key_here          # or
# ANTHROPIC_API_KEY=your_anthropic_key_here

# FAL.ai image generation for workflows (backend)
FAL_KEY=your_fal_key_here                    # or
# FALAI_API_KEY=your_fal_key_here

# API base URL for the React app
VITE_API_URL=http://localhost:3001

# Optional: FAL key in the browser for the Image Generator tab only
# (development/demo only – this exposes the key to the client)
VITE_FALAI_API_KEY=your_fal_key_here
```

The demo will:

- Use Anthropic if `ANTHROPIC_API_KEY` is set, otherwise OpenAI if `OPENAI_API_KEY` is set.  
- Use fal.ai Nano Banana Pro for image generation if `FAL_KEY`/`FALAI_API_KEY` is set; otherwise fall back to placeholders in some flows.

### 3. Initialize the database

```bash
cd app
npm run db:migrate
npm run db:seed
```

Notes:

- Current seed creates the FlowForm brand + personas + environments (no demo influencers/cards by default).  
- Use **Find New** in the Influencers tab to add influencers and generate galleries, or pre‑seed via `src/data/flowform-seed.json`.

### 4. Start services

In three terminals (from `app/`):

1. **Mastra dev server** (agents + workflows playground)

   ```bash
   npm run dev:mastra
   ```

2. **API server (Hono)**

   ```bash
   npm run dev:api
   ```

   - Runs on `http://localhost:3001`.  
   - Health: `GET /api/health`.

3. **Frontend (Vite dev server)**

   ```bash
   npm run dev -- --host
   ```

   - Runs on `http://localhost:5173`.

Then open `http://localhost:5173` and:

- Click **View FlowForm Brand** → open the Brand Dashboard.  
- Use the **Product** tab to see FlowForm description, content sources, and upload product images (persisted in DB).  
- Use **Influencers** to add/delete influencers, toggle Enabled, and view galleries.  
- Use **Cards** to browse Wisdom Cards (image + query + response + status).

### Dataset HTML endpoint (for AI crawlers)

When you publish cards for a brand, the API can serve a simple HTML “dataset page” that is meant to be crawlable by AI systems:

- Endpoint: `GET /dataset/:brandId` (served by the Hono API at `http://localhost:3001`).  
- This page contains:
  - narrative instructions for LLM trainers, and  
  - each card’s query, answer, and image in a crawl‑friendly format.

For the FlowForm demo:

1. Open the FlowForm Brand Dashboard in the UI.  
2. Copy the `brandId` from the URL (`/brand/<brandId>/cards`).  
3. Open `http://localhost:3001/dataset/<brandId>` in a browser.

---

## Tests

From `app/`:

```bash
npm test
```

This runs Jest unit tests for:

- DB schema and repositories.  
- Mastra tools and workflows.  
- API endpoints (using an in‑memory SQLite DB; tests no longer write to the app’s `.data` file).  
- Simple validation of card and influencer data.

---

## Notes & Limitations

- For the hackathon, most content and images can be precomputed:
  - Demo data lives in `app/src/data/flowform-seed.json`.  
  - Static assets can be placed under `app/public/images/...` (e.g., `images/influencers`, `images/cards`, `images/product`).
- v0 uses **synthetic influencer personas** only. Real influencer contracts, payments, and compliance controls are deliberately out of scope.
- Image generation and usage should be treated as demo‑only; production use would require stricter controls around likeness, rights, and safety.
- The original hackathon build used **BFL FLUX 2 / Alpha Image 232** for image generation; after that model was turned off, the project switched to **Nano Banana Pro** as the default. The old FLUX call is still present as commented‑out code for future experiments.
- Influencer licensing and an explicit **brand‑AI ↔ influencer‑AI handshake protocol** are not implemented yet. A separate PRD describing this future flow lives at `prds/influencer-licensing-handshake.md`.

If you’re reviewing this for the hackathon, the key idea is how **Wisdom Pixels** turns a single product’s marketing content into a structured, influencer‑backed, multi‑modal dataset—ready to inform how AI assistants *talk about* and *visualize* that product.***
