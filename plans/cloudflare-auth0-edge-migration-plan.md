Title and Metadata
  Project: Wisdom Pixels Edge/Cloudflare+Auth0 Migration
  Version: 0.1
  Owners: Backend Lead, Frontend Lead, DevOps Lead
  Date: 2025-02-05
  Contact: eng@wisdompixels.example
  Document ID: WP-CF-AUTH0-PLAN-001
  Summary: Plan to migrate the Wisdom Pixels app to Cloudflare Pages/Workers with Auth0 Universal Login, edge-safe data/storage, and consistent configuration, ensuring secure JWT-protected APIs, D1-backed persistence, and CI/CD readiness.

PRD (Stakeholder/System Needs per IEEE 29148)
  Problem: Current Node-only API and local SQLite block Cloudflare deployment; auth missing; env scattered.
  Users: Marketers (frontend), Ops (deployment), Security (auth), QA (tests).
  Value: Edge latency, secure login, deployability, maintainability.
  Business goals: Deploy to Cloudflare with Auth0; keep feature parity; reduce ops toil; secure APIs.
  Success metrics: p95 API latency < 300ms on CF edge; 0 auth bypass defects in QA; CI green across PRs; D1 migration completion with data integrity verified; 100% TEST suite pass.
  Scope: Frontend on Pages; API on Workers/Pages Functions; D1 migration; Auth0 integration; config unification; minimal R2 unless needed.
  Non-goals: Feature rework of product flows; multi-tenant RBAC beyond basic roles; analytics overhaul.
  Dependencies: Auth0 tenant; Cloudflare account with D1; CI runner with wrangler; fal.ai/OpenAI/Anthropic keys.
  Risks: Edge-incompatible deps; migration data loss; misconfigured callbacks; JWKS caching errors; D1 limits.
  Assumptions: Auth0 tenant available; D1 allowed; Vite build unchanged; no heavy binary deps.

SRS (IEEE 29148)
  Functional requirements (REQ-###, type=func)
    REQ-001 func: Provide Auth0 Universal Login for SPA; handle login/logout/silent auth in frontend.
    REQ-002 func: Protect API routes with JWT verification (iss/aud) using Auth0 JWKS.
    REQ-003 func: Expose /api/health, /api/brands, /api/cards etc. via Cloudflare Worker/Pages Functions using Hono.
    REQ-004 func: Persist data in Cloudflare D1 using Drizzle with migrations applied via wrangler.
    REQ-005 func: Provide environment/config module for server bindings and Vite vars with validation.
    REQ-006 func: CI deploy pipeline applies D1 migrations, builds Vite, and deploys Pages + Functions.
    REQ-007 func: Optional R2 wiring for images if enabled, returning public URLs.
  Non-functional (REQ-###, type=nfr|perf)
    REQ-008 nfr: p95 API latency < 300ms in edge regions under nominal load.
    REQ-009 nfr: JWT verification must cache JWKS and fail closed on errors.
    REQ-010 nfr: No Node-only modules in runtime bundle (fs/path/better-sqlite3).
    REQ-011 nfr: Config validation must fail fast on missing/invalid required vars.
    REQ-012 nfr: CORS restricted to CF preview/prod domains; no wildcard.
  Interfaces/APIs (REQ-###, type=int)
    REQ-013 int: Auth0 SPA config requires VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, VITE_AUTH0_AUDIENCE, callback/logout URLs.
    REQ-014 int: Worker bindings for AUTH0_DOMAIN, AUTH0_AUDIENCE, DB (D1), optional KV/R2.
  Data requirements (REQ-###, type=data)
    REQ-015 data: D1 schema mirrors current SQLite schema; migrations idempotent; referential integrity enforced.
    REQ-016 data: No secrets exposed via VITE_ vars; only public SPA config.
  Error and telemetry expectations
    Log auth failures with reason; do not log tokens. Include request ID per API call.
  Acceptance criteria (mapped to TEST-###)
    AC-001 covers REQ-001 via TEST-001.
    AC-002 covers REQ-002 via TEST-002.
    AC-003 covers REQ-003 via TEST-003.
    AC-004 covers REQ-004 via TEST-004.
    AC-005 covers REQ-005 via TEST-005.
    AC-006 covers REQ-006 via TEST-006.
    AC-007 covers REQ-010 via TEST-007.
    AC-008 covers REQ-012 via TEST-008.

System Architecture Diagram
  Mermaid:
    ```mermaid
    flowchart LR
      A[SPA on Pages] -- HTTPS --> W[Cloudflare Worker / Pages Functions]
      W -- D1 binding --> D[(D1 DB)]
      W -- optional KV --> K[(KV nonce/state)]
      W -- optional R2 --> R[(R2 images)]
      W -- Auth0 JWKS --> J[(Auth0)]
      W -- fal/OpenAI/Anthropic --> X[(External AI APIs)]
    ```
  ASCII C4-style:
    [Users] -> [SPA (Pages)]
    [SPA (Pages)] -> [Worker/API] via HTTPS /api/*
    [Worker/API] -> [D1 DB] via binding
    [Worker/API] -> [KV] (optional state)
    [Worker/API] -> [R2] (optional images)
    [Worker/API] -> [Auth0 JWKS/Auth] for verification
    [Worker/API] -> [External AI APIs] for generation

Detailed Iterative Implementation and Test Plan (ISO/IEC/IEEE 12207 + 29119-3)
  Approach: Edge-first refactor; shared router; env validation; iterative small phases with TDD.
  Environments: Local (wrangler dev + Vite), CF preview, CF prod.
  Roles: Backend (Worker/D1/auth), Frontend (Auth0 SPA), DevOps (wrangler/CI), QA (tests).
  Suspension/Resumption: Suspend if D1 provisioning fails or Auth0 tenant unavailable; resume after creds ready.
  Risk register: 
    - Node-only deps persist; trigger: bundle errors; mitigation: dependency audit/gating.
    - D1 migration failure; trigger: wrangler apply error; mitigation: dry-run preview DB first.
    - Auth misconfig; trigger: 401 loops; mitigation: config validation + preview callbacks in Auth0.
    - CORS mis-set; trigger: blocked requests; mitigation: allowed origins list matching envs.

  Phase Breakdown Strategy: Atomic phases, single-layer scope, 8 phases.

  Master Phase Schedule (WBS)
    | ID  | Name                                      | Primary Goal                                        | Dependencies |
    | P01 | Extract shared Hono router                 | Decouple router from Node server                    | none |
    | P02 | Add Workers/Pages Functions entrypoint     | Edge entry for /api/*                               | P01 |
    | P03 | Config module with validation              | Centralized env/bindings for server + Vite          | P02 |
    | P04 | D1 client swap                             | Replace better-sqlite3 with drizzle-orm/d1          | P02 |
    | P05 | D1 migrations via wrangler                 | Ensure schema applied in CF                        | P04 |
    | P06 | Auth0 JWT guard (jose)                     | Protect API routes with iss/aud/JWKS cache          | P02,P03 |
    | P07 | Frontend Auth0 SPA wiring                  | Login/logout/silent auth + VITE config              | P06 |
    | P08 | CI/CD pipeline for Pages+Functions         | Build, migrate, deploy with secrets/bindings        | P05,P07 |

  Detailed Phase Specifications
    P01 Extract shared Hono router
      Scope/Objectives: Factor routing into shared module; remove Node-only code. REQ-003, REQ-010.
      Test Plan: Unit test router mounts; smoke via wrangler dev hitting /api/health.
      Exit Gate: Green if router importable from Node and Worker; Yellow if Node-only shims remain; Red if build fails.
      Metrics table:
        | Metric | Value | Rationale |
        | Confidence % | 85 | Small refactor |
        | Long-term robustness % | 80 | Reduces coupling |
        | Internal interactions count | 3 | Router, server entry, tests |
        | External interactions count | 0 | None |
        | Complexity % | 25 | Simple extraction |
        | Feature creep % | 5 | Scoped |
        | Technical debt % | 10 | Minimal |
        | YAGNI % | 90 | Only needed pieces |
        | MoSCoW | Must | Core enablement |
        | Local vs Non-local changes | Local | Router files |
        | Architectural changes count | 1 | Entry decouple |

    P02 Add Workers/Pages Functions entrypoint
      Scope/Objectives: Create Worker entry (export default app.fetch), map /api/*, remove @hono/node-server from deploy bundle. REQ-003, REQ-010, REQ-012.
      Test Plan: wrangler dev smoke /api/health; ensure no fs/path in bundle.
      Exit Gate: Green if Worker serves routes; Yellow if partial; Red if runtime errors.
      Metrics:
        | Confidence % | 80 | Known Hono pattern |
        | Long-term robustness % | 85 | Edge-ready |
        | Internal interactions count | 4 | Router, CORS, env, tests |
        | External interactions count | 1 | Cloudflare runtime |
        | Complexity % | 35 | Entry wiring |
        | Feature creep % | 10 | Minor |
        | Technical debt % | 15 | Temp dual entries |
        | YAGNI % | 85 | Minimal extras |
        | MoSCoW | Must | Platform fit |
        | Local vs Non-local changes | Local | Entrypoints |
        | Architectural changes count | 1 | Runtime target |

    P03 Config module with validation
      Scope/Objectives: Typed config for server bindings and Vite; fail fast on missing; map Auth0 vars. REQ-005, REQ-011, REQ-013, REQ-014, REQ-016.
      Test Plan: Unit tests for missing/invalid env; build fails on absent required vars.
      Exit Gate: Green if config covers needed vars and tests pass; Yellow if partial; Red if runtime reads env directly.
      Metrics:
        | Confidence % | 80 |
        | Long-term robustness % | 90 |
        | Internal interactions count | 5 |
        | External interactions count | 0 |
        | Complexity % | 30 |
        | Feature creep % | 10 |
        | Technical debt % | 10 |
        | YAGNI % | 85 |
        | MoSCoW | Must |
        | Local vs Non-local changes | Non-local | Many call sites |
        | Architectural changes count | 1 |

    P04 D1 client swap
      Scope/Objectives: Replace better-sqlite3 client with drizzle-orm/d1; remove fs/path/process signals from runtime. REQ-004, REQ-010, REQ-015.
      Test Plan: Unit tests on repositories against D1 mock/Miniflare; ensure bundle has no native deps.
      Exit Gate: Green if repos work on D1; Yellow if limited; Red if schema mismatch or runtime failure.
      Metrics:
        | Confidence % | 70 |
        | Long-term robustness % | 85 |
        | Internal interactions count | 6 |
        | External interactions count | 1 | D1 |
        | Complexity % | 55 |
        | Feature creep % | 15 |
        | Technical debt % | 20 |
        | YAGNI % | 80 |
        | MoSCoW | Must |
        | Local vs Non-local changes | Non-local | DB layer touch |
        | Architectural changes count | 1 |

    P05 D1 migrations via wrangler
      Scope/Objectives: Add migrations to wrangler; apply to preview/prod; ensure idempotent. REQ-004, REQ-015.
      Test Plan: wrangler d1 migrations apply on preview; verify tables; baseline test run.
      Exit Gate: Green if migration applies clean; Yellow if manual steps; Red if fail/rollback needed.
      Metrics:
        | Confidence % | 75 |
        | Long-term robustness % | 85 |
        | Internal interactions count | 3 |
        | External interactions count | 1 | D1 |
        | Complexity % | 35 |
        | Feature creep % | 5 |
        | Technical debt % | 10 |
        | YAGNI % | 90 |
        | MoSCoW | Must |
        | Local vs Non-local changes | Local | Migrations |
        | Architectural changes count | 0 |

    P06 Auth0 JWT guard (jose)
      Scope/Objectives: Middleware for /api/* with jwks cache, iss/aud checks, fail closed. REQ-001 (backend accept), REQ-002, REQ-009, REQ-012, REQ-013, REQ-014.
      Test Plan: Unit tests for valid/invalid tokens; JWKS fetch mock; wrangler dev auth smoke.
      Exit Gate: Green if guard blocks bad tokens and allows good; Yellow if partial; Red if bypass possible.
      Metrics:
        | Confidence % | 75 |
        | Long-term robustness % | 88 |
        | Internal interactions count | 4 |
        | External interactions count | 1 | Auth0 JWKS |
        | Complexity % | 45 |
        | Feature creep % | 10 |
        | Technical debt % | 15 |
        | YAGNI % | 85 |
        | MoSCoW | Must |
        | Local vs Non-local changes | Local | Middleware |
        | Architectural changes count | 0 |

    P07 Frontend Auth0 SPA wiring
      Scope/Objectives: Configure Auth0 SDK, login/logout, token retrieval for API, env vars. REQ-001, REQ-013, REQ-016.
      Test Plan: UI auth flow in local/preview; e2e login + protected API call.
      Exit Gate: Green if SPA authenticates and calls API with token; Yellow if partial; Red if login loop.
      Metrics:
        | Confidence % | 80 |
        | Long-term robustness % | 85 |
        | Internal interactions count | 5 |
        | External interactions count | 1 | Auth0 |
        | Complexity % | 40 |
        | Feature creep % | 15 |
        | Technical debt % | 15 |
        | YAGNI % | 80 |
        | MoSCoW | Must |
        | Local vs Non-local changes | Local | SPA auth |
        | Architectural changes count | 0 |

    P08 CI/CD pipeline for Pages+Functions
      Scope/Objectives: CI steps to build Vite, run tests, apply D1 migrations, deploy Pages/Functions; secrets/bindings. REQ-006, REQ-008, REQ-012.
      Test Plan: CI dry-run; ensure migrations run; deploy to preview; smoke tests.
      Exit Gate: Green if pipeline completes and preview live; Yellow if manual steps; Red if deploy blocked.
      Metrics:
        | Confidence % | 70 |
        | Long-term robustness % | 88 |
        | Internal interactions count | 6 |
        | External interactions count | 2 | CF API, Auth0 callbacks |
        | Complexity % | 50 |
        | Feature creep % | 20 |
        | Technical debt % | 20 |
        | YAGNI % | 75 |
        | MoSCoW | Must |
        | Local vs Non-local changes | Non-local | CI + env |
        | Architectural changes count | 1 |

Evaluations (YAML)
  ```yaml
  evals:
    - id: dev-smoke
      dataset: local-manual
      tasks: [/api/health, auth-protected GET /api/brands]
      metrics: [pass_fail]
      thresholds: {pass: 100%}
      seed: 1
      runtime_budget: 5m
    - id: auth-unit
      dataset: mocked-jwks
      tasks: [valid-token, expired-token, wrong-aud, wrong-iss]
      metrics: [pass_fail]
      thresholds: {pass: 100%}
      seed: 2
      runtime_budget: 2m
    - id: d1-migration
      dataset: schema-migration
      tasks: [apply, query]
      metrics: [pass_fail]
      thresholds: {pass: 100%}
      seed: 3
      runtime_budget: 3m
    - id: perf-edge
      dataset: synthetic
      tasks: [GET /api/health 100rps 60s]
      metrics: [p95_latency_ms]
      thresholds: {p95_latency_ms: 300}
      seed: 4
      runtime_budget: 10m
  ```

Tests Overview
  | TEST-### | Type | Verifies |
  | TEST-001 | e2e | REQ-001 |
  | TEST-002 | unit/int | REQ-002 |
  | TEST-003 | smoke | REQ-003 |
  | TEST-004 | integration | REQ-004 |
  | TEST-005 | unit | REQ-005 |
  | TEST-006 | pipeline | REQ-006 |
  | TEST-007 | static/bundle audit | REQ-010 |
  | TEST-008 | integration | REQ-012 |

Data Contract (minimal)
  Schema snapshot: D1 tables mirror brands, personas, environments, influencers, cards, workflow_runs with FKs enforced. No schema changes expected beyond Drizzle migrations.
  Invariants: FK integrity; unique slug; non-null required fields; JWTs not persisted; secrets never stored in Vite config.

Reproducibility
  Seeds: as per evals.
  Hardware: any x86_64 runner; OS: Linux; Container: node18+wrangler.
  Ensure `wrangler dev` for local; Vite build deterministic.

RTM (Requirements Traceability Matrix)
  | REQ-### | TEST-### | Phase IDs |
  | REQ-001 | TEST-001 | P06,P07 |
  | REQ-002 | TEST-002 | P06 |
  | REQ-003 | TEST-003 | P01,P02 |
  | REQ-004 | TEST-004 | P04,P05 |
  | REQ-005 | TEST-005 | P03 |
  | REQ-006 | TEST-006 | P08 |
  | REQ-010 | TEST-007 | P01,P02,P04 |
  | REQ-012 | TEST-008 | P02,P06 |

Execution Log (to be filled during execution)
  Phase status: Pending/InProgress/Done per phase.
  Completed steps: ...
  Issues and resolutions: ...
  Failed attempts/alternatives: ...
  Lessons learned / Future awareness: ...
  Design/architecture choices made: ...
  Deviations from plan and why: ...

Assumptions
  Auth0 tenant available with allowed callbacks; Cloudflare account with D1 enabled; existing schema migratable; no binary-only deps needed at runtime; Vite build unchanged.

Consistency Check
  All REQ referenced by TEST and phases; all phases listed have metrics; all TEST map to REQ; architecture impacts isolated per phase.

