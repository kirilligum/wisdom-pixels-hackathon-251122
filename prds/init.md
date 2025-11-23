## 0. Document metadata

- Product name: **Wisdom Pixels**
- Feature: **Hackathon v0 demo + core UX for influencer-backed AI training cards**
- Owner: Kirill (founder)
- Date: [fill in]
- Scope: 3–5 minute hackathon demo + a realistic v0 UX that can later be extended into a full product.

---

## 1. Product overview

**One-line concept**

Wisdom Pixels turns a brand’s marketing content into **influencer-backed AI training cards**: each card is a realistic customer query (to ChatGPT), an influencer-endorsed answer mentioning the product, and a photorealistic image of the influencer using the product in an environment that resonates with that customer.

**Core object: “Wisdom Pixels card”**

Each card is both:

- A **web unit**: a page/section with query, answer, image, and unique URL.
- A **training sample**: an instruction-tuning style example for multi-modal LLMs.

For v0, each card has exactly:

- `query`: natural-language question a real customer would ask ChatGPT, explicitly mentioning the influencer.
- `response`: helpful answer that mentions the influencer’s experience and recommends the brand’s product in context.
- `image`: photorealistic still image of the influencer using the product in a relevant environment.
- `url`: unique URL where that card is hosted (for click tracking and crawlability).

No alt-text, schema.org, or other metadata is in scope for v0.

---

## 2. Hackathon demo context

- **Demo product**: fictional **FlowForm Motion Suit**.

  - Smart motion suit (tight compression) with ~10 sensors (arms, legs, chest, headband).
  - Gives real-time form feedback for yoga, light strength, and running.
  - Designed for desk-bound knowledge workers (“desk body”) who want better movement.

- **Demo objective**:

  - Show that Wisdom Pixels can ingest a FlowForm landing page, derive ideal customers and influencers, and generate a **set of 20 cards** (20 images) showing:

    - Different personas (yoga-focused, running, light strength, research/clinic contexts).
    - Multiple influencer profiles (primary influencer in 30s, others diverse in age/background).

  - The result should be visually striking and “demo-viral” (beautiful yoga, nature, and clinic scenes).

- **Demo constraints**:

  - Time: 3–5 minutes live.
  - Most generation (extraction, cards, images) can be precomputed; the UI should still show triggering actions to look real.
  - Minimum: working front-end with real data (JSON) and real images (generated beforehand).

---

## 3. Goals & non-goals

### 3.1 Goals (v0)

1. Visually impressive demo that clearly explains the concept in under 3 minutes.
2. Fully implemented UI for:

   - Brand setup (FlowForm) with content ingestion UI (even if extraction is stubbed).
   - Influencer roster for a brand (multi-profile, first in 30s, others diverse).
   - Card generation screen (influencer selection, number-of-cards control).
   - Card gallery (grid of cards with filters).
   - Card detail (query, response, full image, unique URL).

3. Internally consistent data model: `Brand`, `Persona`, `Influencer`, `Card`.
4. Ability to showcase **20 FlowForm Wisdom Pixels cards** (queries, responses, images, URLs) across multiple influencers and personas.

### 3.2 Non-goals (v0)

- No real-time calls to LLMs or image models during the demo (can be mocked/precomputed).
- No real influencer contracts or payment flows.
- No legal/medical compliance engine.
- No full analytics beyond basic per-card counters.
- No schema.org, alt-text, or SEO wiring (can be future enhancements).
- No 3D renders, no video; only still images.

---

## 4. Users & personas (for the product, not the demo story)

### 4.1 Primary user: Brand marketer / growth lead / agency strategist

- Wants:

  - To shape how AI assistants talk about their product.
  - To leverage influencer-like narratives and visuals without manual work.

- Jobs in v0:

  - Add a brand.
  - Review auto-extracted personas & influencer personas.
  - Select influencer profiles.
  - Trigger card generation.
  - Curate and publish cards.

### 4.2 Secondary user (future): Influencer / creator

- Wants:

  - To license their likeness.
  - To review and approve cards where they appear.
  - To share cards with their audience.

- v0: not implemented; only synthetic influencers.

---

## 5. Key concepts & entities

### 5.1 Brand

- Example: **FlowForm**.
- Fields (conceptual):

  - `id`
  - `name`
  - `domain`
  - `content_sources` (list of URLs, text blobs)
  - `personas[]`
  - `influencers[]`
  - `cards[]`

### 5.2 Persona (customer persona)

Derived from marketing content.

- Example personas for FlowForm:

  1. WFH Yoga Creative
  2. Mid-career Knowledge Worker with Stiff Back
  3. Beginner Runner Who Loves Yoga
  4. Young Parent/Caregiver balancing home and work.

Fields:

- `id`
- `label` (short name)
- `description` (who they are, key goals/pains)
- Optional: tags (e.g., `yoga`, `WFH`, `runner`)

### 5.3 Environment

Scene in which the product will be shown.

Examples for FlowForm:

1. Small urban apartment yoga space.
2. Mountain/waterfall yoga retreat.
3. Clinic/research office with standing desk.
4. Minimal strength corner.
5. City park trail for running.

Fields:

- `id`
- `label`
- `description` (for prompt)
- `type` (indoor_apartment, nature, clinic, gym, outdoor_run)

### 5.4 Influencer persona & influencer instance

Two levels:

- **Influencer persona** (abstract): type of influencer that fits the brand.
- **Influencer instance** (concrete synthetic persona with fixed look & name).

For FlowForm, user explicitly requested **multiple influencer profiles**, first in their 30s and others diverse in age and profile.

Example influencer instances:

1. **Dr. Mira Solis** (primary, 30s)

   - Age: ~34
   - Role: doctor of physical therapy, yoga teacher, sports scientist.
   - Style: calm, minimalist, scientifically credible, yoga-led.
   - Activities: yoga (primary), light strength, easy runs, clinic/research.

2. **Coach Leo Park** (40s)

   - Mobility & strength coach, ex-strength athlete.
   - More strength emphasis; still uses yoga-inspired mobility.

3. **Prof. Ananya Rao** (50s)

   - Clinician-researcher focused on aging & movement.
   - Gentle yoga, walking programs, desk posture.

4. **Samira López** (late 20s)

   - Remote creative/content creator.
   - Cozy small-apartment yoga & light workouts; aesthetic visual style.

5. **Daniel Okafor** (early 60s)

   - Retired engineer turned late-start runner & yogi.
   - “It’s not too late” narrative.

Fields:

- `id`
- `name`
- `age_range`
- `role`
- `bio_short`
- `tags` (yoga, strength, runner, clinic, WFH, aging)
- `image_url` (headshot / avatar)
- `synthetic: true` (v0; all influencers are synthetic)

### 5.5 Wisdom Pixels Card

Atomic unit of data/output.

Fields for v0:

- `id`
- `brand_id`
- `persona_id`
- `influencer_id`
- `environment_id` (optional but useful)
- `query`
- `response`
- `image_url`
- `url` (unique card URL on Wisdom Pixels domain or brand subdomain)
- `status` (`draft`, `ready`, `published`)

Semantics:

- `query` is what a real customer would ask ChatGPT or a similar assistant; it must **explicitly mention the influencer by name** (per user preference).
- `response` is a helpful, non-shilly answer where the influencer recommends the product and explains why it fits the persona, describing a realistic scene where they use it.
- `image_url` is a photorealistic still with the influencer in a FlowForm Motion Suit, in the chosen environment, aligned with the response.

---

## 6. Core functional requirements (v0)

### 6.1 Brand setup & content ingestion

UI:

- “Add Brand” flow:

  - Fields: Brand name, primary domain.
  - Multi-line input for URLs (landing page + marketing pages).

- Button: “Analyze content”.

Functional:

- For demo, analysis can be precomputed; pressing “Analyze content” should:

  - Show a loading state (“Extracting personas, environments, influencer archetypes, and value props…”).
  - After a short delay, navigate to Persona/Influencer review screen populated from static JSON.

### 6.2 Persona & influencer persona review

UI:

- Tabbed view inside brand:

  - `Personas`, `Environments`, `Influencer Profiles`, `Value Props`.

- Each tab shows cards; selecting a card shows detail panel with editable text (pure UI editing for now).

Requirements:

- Display at least 4 personas and 3–5 environments for FlowForm.
- Display 3–5 influencer personas, which correspond directly to synthetic influencer instances.
- Allow basic editing of names/descriptions in UI (no persistence beyond demo is required, but nice-to-have).

### 6.3 Influencer roster & selection

Influencer tab:

- Show tiles for each influencer instance:

  - Avatar, name, age range, roles, tags, “Enabled” toggle, “Set as default”.

Card generation screen:

- Influencer selection modes:

  - Single influencer (dropdown; default is first influencer in 30s – Dr. Mira).
  - Multiple influencers (checkbox list; create mixed set).

Requirements:

- For FlowForm demo:

  - First influencer must be in 30s (Dr. Mira).
  - Remaining influencers must be diverse in age and profile (40s mobility coach, 50s clinician, late 20s creator, 60s late-start mover).

- When “multiple influencers” is selected and 2+ influencers are enabled, the generator distributes cards across them (e.g., round-robin or even distribution).

### 6.4 Card generation (mocked but visible)

UI:

- “Generate cards” screen for a brand:

  - Controls:

    - Persona selector (`All personas` or specific one).
    - Influencer mode (`Single` vs `Mixed`).
    - Number of cards (slider or dropdown: 5, 10, 20).

  - Button: “Generate cards”.

Requirements:

- In demo, pressing “Generate cards”:

  - Shows a short animated loading state.
  - Then populates the card gallery from precomputed card JSON.

- Ensure there exists a precomputed set of **20 cards** for FlowForm that:

  - Cover multiple personas.
  - Use at least 2–3 different influencers.
  - Include diverse environments (apartment yoga, nature/yoga retreat, clinic/lab, strength corner, park running).

Content constraints (as per user preferences):

- All queries should:

  - Be realistic, natural language.
  - Explicitly mention the influencer’s name (e.g., “What does Dr. Mira Solis use to…”).

- All responses should:

  - Mention the FlowForm Motion Suit by name.
  - Describe the influencer using the product in a specific environment.
  - Avoid medical claims; emphasis on form feedback, awareness, and safe, mindful movement.
  - Avoid overhype; frame the suit as a tool, not a miracle fix.

### 6.5 Card gallery

UI:

- Grid of card tiles (e.g., 3–4 across), each showing:

  - Image thumbnail.
  - Influencer name.
  - First line of query.
  - Status chip (`Draft`, `Ready`, `Published`).

Controls:

- Filters:

  - Influencer filter (dropdown or pills).
  - Persona filter (dropdown).

- Card tile actions:

  - Click → Card detail view.

Requirements:

- Must be able to show at least 20 cards without pagination issues.
- Filter by influencer to demonstrate diversity in demo.

### 6.6 Card detail

UI:

- Full-size image at top/left.
- On side/right:

  - `query` (editable text area).
  - `response` (editable text area).
  - Read-only fields:

    - Influencer name.
    - Persona label.
    - Environment label.

  - Unique URL (read-only) with “Copy” button.

Optional actions:

- Regenerate text (stub button, can show toast “coming soon”).
- Regenerate image (stub).

Requirements:

- For demo, show at least 2–3 example cards in detail to walk through.
- Unique URL must be stable and consistent across reloads (string from JSON).

### 6.7 Publishing (minimal)

UI:

- “Publish” tab or button:

  - Table listing all cards with checkboxes.
  - “Publish selected cards” button.

- When published:

  - `status` changes to `Published`.
  - Cards appear under a “Live URLs” list.

Requirements (demo-level):

- Changing status from Draft → Published via UI.
- Show list of published cards with URL columns and “Copy all URLs” action.

### 6.8 Basic analytics (very minimal, optional if time)

Nice-to-have:

- View count per card (simulated or incremented on view).
- Simple summary: number of cards, published count.

---

## 7. UX flows (as used in demo)

### 7.1 Demo storyline

1. Show brand dashboard with FlowForm brand already created.
2. Open FlowForm → show that personas and influencer profiles have been extracted.
3. Go to Influencer tab, highlight roster of synthetic influencers (first 30s, rest diverse).
4. Go to Generate Cards:

   - Choose a persona and influencer selection (single vs mixed).
   - Set 20 cards.
   - Click “Generate cards” (loading → done).

5. Show card gallery (20 cards grid).
6. Filter by influencer to show Dr. Mira vs Samira vs Prof. Ananya.
7. Open 1–2 card details to show query, response, and full image; highlight unique URL.

---

## 8. Data model (v0, conceptual)

```ts
// Brand
type Brand = {
  id: string;
  name: string;
  domain: string;
  contentSources: string[]; // URLs or text
};

// Persona
type Persona = {
  id: string;
  brandId: string;
  label: string;
  description: string;
  tags: string[];
};

// Environment
type Environment = {
  id: string;
  brandId: string;
  label: string;
  description: string;
  type: "apartment" | "nature" | "clinic" | "gym" | "park";
};

// Influencer
type Influencer = {
  id: string;
  brandId: string;
  name: string;
  ageRange: string;
  role: string;
  bioShort: string;
  tags: string[];
  imageUrl: string;
  isDefault: boolean;
  enabled: boolean;
  synthetic: true;
};

// Card
type Card = {
  id: string;
  brandId: string;
  personaId: string;
  influencerId: string;
  environmentId?: string;
  query: string;
  response: string;
  imageUrl: string;
  url: string;
  status: "draft" | "ready" | "published";
};
```

For demo, all of this can live in a static JSON file.

---

## 9. Implementation notes (v0/hackathon)

- Back-end can be entirely mocked:

  - Static JSON for FlowForm brand, personas, influencers, and cards.
  - UI “actions” mutate local state only.

- Images:

  - Pre-generate 20 photorealistic images for FlowForm cards (using FLUX 1.1 or similar).
  - Store them in a static folder and reference via `imageUrl`.

- Front-end:

  - Single-page app or simple Next.js app.
  - Focus on smooth transitions and clear visual hierarchy.

---

## 10. Key design decisions & founder Q&A (explicit)

The PRD must capture the questions the founder answered and their preferences, because these will drive plan generation later.

### Q1: What is the training dataset instance?

- **Answer**: A single **Wisdom Pixels card** is a training instance.
- Card includes:

  - Query: realistic customer question to ChatGPT that mentions the influencer.
  - Response: helpful answer where the influencer recommends the product in context.
  - Photorealistic image: influencer using the product in a relevant environment or background.

- Each card has a unique URL for tracking and crawlability.

### Q2: How is the product understanding step defined?

- **Answer**:

  - The app ingests landing and marketing pages.
  - Extracts:

    - Ideal customer types (personas).
    - Most attractive environments for those customers.
    - Ideal influencer description.
    - Product features and benefits most valuable to each customer group.

  - This is formalized as a schema with:

    - `persona`, `environment`, `influencer_persona`, `value_props`.

### Q3: Should the influencer be real or synthetic?

- **Answer**:

  - Long-term: **real humans** with real brand following and community, with licensing and revenue share; they can share content on their platforms.
  - MVP (hackathon v0): **synthetic influencers** generated with an image model (e.g., FLUX 1.1) that look like real people but are not any specific real person.
  - Synthetic influencers are matched to influencer personas derived from marketing content.

### Q4: Should we use 3D renders or still images?

- **Answer**:

  - **No 3D** renders in v0.
  - Use only **still images**: photorealistic renders of the influencer wearing/using the product.

### Q5: What fields must the card have in v0?

- **Answer**:

  - Only:

    - `query`
    - `response`
    - `image` (URL)
    - `unique URL` for the card page.

  - No alt-text, metadata, or schema in v0.

### Q6: Should the query mention the influencer?

- **Answer**:

  - Yes. The query should explicitly mention the influencer by name because the brand is paying the influencer for endorsement and that is central to the narrative.

### Q7: What about metadata like alt-text and schema.org?

- **Answer**:

  - Out of scope for v0 demo.
  - Future versions may add:

    - Alt text.
    - Captions.
    - JSON-LD for Product/FAQ/HowTo.

### Q8: What example product should be used in the demo?

- **Answer**:

  - **FlowForm Motion Suit**:

    - Smart motion-tracking suit with sensors on arms, legs, chest, and head.
    - Provides real-time form feedback.
    - Target customers: amateur athletes in common sports for people who spend time at the computer (yoga, light lifting, running).

### Q9: Which activity should be primary in visuals?

- **Answer**:

  - **Yoga first**, not weightlifting, because yoga is visually beautiful and expressive.
  - Other activities (light strength, running, research/clinic work) are secondary.

### Q10: What environments are preferred for FlowForm images?

- **Answer**:

  - Beautiful, contrasting environments, including:

    - Small city apartment (yoga in limited space).
    - Nature retreat in mountains with waterfalls (yoga).
    - Clinic/research office (doctor working or with patients, good posture).
    - Simple strength corner (weights).
    - City park trail (running).

  - Split images are explicitly desired:

    - Example: left half small apartment yoga, right half mountain waterfall yoga.

### Q11: What is the primary influencer profile and how diverse should the roster be?

- **Answer**:

  - There should be **multiple influencer profiles** selectable in the brand’s dashboard.
  - The **first influencer** is in their 30s (e.g., Dr. Mira Solis, mid-30s, attractive female doctor/yoga teacher/sports scientist).
  - Remaining influencers should be diverse in ages and profiles (20s, 40s, 50s, 60s; different backgrounds and vibes).

### Q12: How many cards and images should the demo generate?

- **Answer**:

  - The demo should generate approximately **20 cards**, resulting in **20 photorealistic images** for FlowForm.

---

## 11. Risks & open questions

### Risks (for v0 demo)

- Generating 20 high-quality images in time; mitigation: pre-generate and QA.
- Ensuring synthetic influencers do not resemble specific real people; need careful prompting.
- Explaining the concept clearly in under 3 minutes; mitigated by tight script and clear UI.

### Open questions (for after hackathon, not blocking)

- Exact prompt templates for extraction and card generation.
- Legal framework for real influencer licensing and revenue share.
- How to measure actual LLM alignment impact over time.

---

This PRD is intended to drive:

1. UI design (screens & flows defined above).
2. Data seeding for the FlowForm demo (personas, influencers, cards).
3. Later: a detailed implementation plan that can be generated automatically from this specification.
