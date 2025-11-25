# Influencer Licensing Handshake – PRD (v0.1 Draft)

**Parent Product**: Wisdom Pixels  
**Author**: Kirill (founder)  
**Status**: Future work / not implemented  
**Related Docs**: `prds/init.md`, `plans/wisdom-pixels-mastra-flux2-react-plan-v2.md`

---

## 1. Problem

Today, Wisdom Pixels focuses on synthetic influencers and demo data. In a real product:

- **Brands** want to license real creators’ likeness and narratives into AI surfaces (ChatGPT, LLM search, in‑app assistants), not just social feeds.
- **Influencers/creators** want control over:
  - which brands they are associated with,
  - how their likeness and voice are used in AI answers,
  - how they get paid (per card, per impression, per training run, rev share, etc.).

There is currently **no protocol** for a “brand AI” to request permission from an “influencer AI” and agree on terms before generating and publishing influencer‑backed training cards.

---

## 2. One‑line Concept

> A two‑sided **licensing handshake protocol** between brand agents and influencer agents that decides if, how, and under what terms a creator’s likeness can be used in Wisdom Pixels cards and downstream AI training datasets.

---

## 3. High‑level Flow (Conceptual)

1. **Brand intent**
   - Brand (or its agent) constructs a **LicensingRequest** describing:
     - brand info, product, campaign,
     - desired influencer(s) and usage (channels, surfaces, duration),
     - rough volume (cards, dataset size).

2. **Influencer agent evaluation**
   - Influencer’s side runs an **InfluencerPolicyAgent** that:
     - checks brand and product category (e.g., no weapons, no scams),
     - checks conflict with current partners / competitors,
     - evaluates semantic fit with creator’s audience and values,
     - proposes a pricing / royalty model.

3. **Handshake / negotiation**
   - Brand agent and Influencer agent exchange a small number of messages:
     - clarify scope (e.g., “AI surfaces only, no social posts”),
     - agree on attribution and disclosure language,
     - converge on pricing.
   - Result is a **LicensingAgreement** with:
     - status (`pending`, `active`, `rejected`, `expired`),
     - permitted surfaces (feeds vs AI assistants vs search),
     - duration, geography, and rev model,
     - audit token / contract ID.

4. **Card generation + tagging**
   - When Wisdom Pixels generates cards that involve this influencer:
     - cards and dataset entries are tagged with `licensingAgreementId`,
     - dataset export includes licensing metadata for downstream systems.

5. **Reporting / rev share**
   - Separate future phase: report volume/impressions per agreement and compute payouts.

---

## 4. Out‑of‑Scope for v0

For the hackathon demo and current codebase:

- No real influencer contracts or payment processing.
- No live brand–influencer negotiation UI.
- No legal review or compliance engine.
- No production‑grade accounting / payouts.

This PRD is strictly a **future‑work specification** and should be referenced as such in top‑level docs (see “Notes & Limitations” in `README.md`).

---

## 5. Proposed Data Shapes (Sketch)

```ts
type LicensingRequest = {
  requestId: string;
  brandId: string;
  influencerId: string;
  campaignName?: string;
  productSummary: string;
  intendedSurfaces: ('ai_assistant' | 'search' | 'feed')[];
  estimatedCards: number;
  notes?: string;
};

type LicensingAgreement = {
  agreementId: string;
  requestId: string;
  brandId: string;
  influencerId: string;
  status: 'pending' | 'active' | 'rejected' | 'expired';
  allowedSurfaces: ('ai_assistant' | 'search' | 'feed')[];
  startDate: string;
  endDate?: string;
  pricingModel: 'flat' | 'per_card' | 'per_impression' | 'rev_share';
  termsSummary: string;
};
```

---

## 6. Integration Points (Future Phases)

When implemented, this handshake would touch:

- **Mastra agents** – a `LicensingAgent` on each side (brand and influencer).
- **Database** – new tables `licensing_requests` and `licensing_agreements`.
- **Workflows** – pre‑step before card generation to ensure only authorized influencers are used.
- **API** – endpoints for brands and influencers to view/approve agreements.
- **Dataset export** – include licensing metadata per card and per dataset.

Implementation of this PRD is intentionally **deferred**; Wisdom Pixels v0 only uses synthetic influencers and does not perform any real licensing.

