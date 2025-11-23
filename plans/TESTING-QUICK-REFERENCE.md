# Testing Quick Reference

**Purpose**: Fast lookup for testing commands and patterns between phases

---

## Testing Stack

| What | Tool | File Extension |
|------|------|----------------|
| Backend tests (DB, Tools, Agents, Workflows) | **Jest** | `.test.ts` |
| API tests (HTTP endpoints) | **Supertest + Jest** | `.test.ts` |
| Frontend E2E (Browser flows) | **Playwright** | `.spec.ts` |

**Key**:
- `.test.ts` = Jest (no browser needed)
- `.spec.ts` = Playwright (real browser)

---

## Test Commands Cheat Sheet

### Phase M1: Database Foundation (Jest)
```bash
# Run tests
npm run test:m1  # Jest tests for DB schema & repositories

# Validate exit criteria
npm run validate:m1

# If pass → git tag
git tag -a m1-database -m "Phase M1: Database complete"
```

### Phase M2: Infrastructure Tools (Jest)
```bash
# Unit tests only (fast, with mocks)
npm run test:m2:unit  # Jest with mocked fal.ai, HTTP

# Integration tests (slower, real services)
npm run test:m2:integration  # Jest with real DB

# All M2 tests
npm run test:m2

# Validate
npm run validate:m2

# Tag
git tag -a m2-tools -m "Phase M2: Tools complete"
```

### Phase M3: Specialized Agents (Jest)
```bash
# Run tests (may be slow due to LLM calls)
npm run test:m3  # Jest with mocked LLM responses

# With LLM response caching (faster)
LLM_CACHE=true npm run test:m3

# Validate
npm run validate:m3

# Tag
git tag -a m3-agents -m "Phase M3: Agents complete"
```

### Phase M4: Workflows (Jest)
```bash
# Integration tests
npm run test:m4:integration  # Jest with real DB, mocked APIs

# E2E tests (slowest, full workflows)
npm run test:m4:e2e  # Jest with full workflow execution

# All M4 tests
npm run test:m4

# Validate
npm run validate:m4

# Tag
git tag -a m4-workflows -m "Phase M4: Workflows complete"
```

### Phase M5: REST API (Supertest + Jest)
```bash
# API contract tests
npm run test:m5:api  # Supertest + Jest (no browser)

# Performance tests
npm run test:m5:perf  # Supertest + Jest

# All M5 tests
npm run test:m5

# Validate
npm run validate:m5

# Tag
git tag -a m5-rest-api -m "Phase M5: REST API complete"
```

### Phase M6: Frontend Migration (Playwright + Jest)
```bash
# E2E tests (Playwright)
npm run test:m6:e2e  # Playwright (real browser)

# Dependency audit
npm run test:m6:deps  # Jest (checks no @mastra/client-js)

# All M6 tests
npm run test:m6

# Validate
npm run validate:m6

# Tag
git tag -a m6-frontend-migration -m "Phase M6: Frontend migration complete"
```

### Phase M7: Testing & Validation (Jest + Playwright)
```bash
# Run all PRD tests
npm run test:prd  # Mix of Jest and Playwright

# RTM validation
npm run test:rtm  # Jest

# Coverage report
npm run test:coverage  # Jest coverage

# Validate
npm run validate:m7

# Tag
git tag -a m7-testing -m "Phase M7: Testing complete"
```

---

## Test Patterns Quick Reference

### 1. Unit Test Pattern (Phase M1-M3)

```typescript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('ComponentName', () => {
  let resource: any;

  beforeEach(() => {
    // Setup (create in-memory DB, mocks, etc.)
    resource = setupResource();
  });

  afterEach(() => {
    // Cleanup
    resource.cleanup();
  });

  test('TEST-MX-001: Should do something', () => {
    const result = resource.doSomething();
    expect(result).toBeDefined();
  });
});
```

### 2. Integration Test Pattern (Phase M2-M4)

```typescript
import { describe, test, expect } from '@jest/globals';
import { setupTestDb } from '../../helpers/db-test-helper';

describe('Integration: Tool + DB', () => {
  test('TEST-MX-001: Should integrate successfully', async () => {
    const { db, cleanup } = setupTestDb();

    try {
      // Test integration
      const result = await tool.execute({ context, db });
      expect(result).toBeDefined();
    } finally {
      cleanup();
    }
  });
});
```

### 3. API Test Pattern (Phase M5)

```typescript
import request from 'supertest';
import { app } from '../../../app/server';

test('TEST-MX-001: Should return correct response', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({ data })
    .expect(200)
    .expect('Content-Type', /json/);

  expect(response.body.result).toBeDefined();
});
```

### 4. E2E Test Pattern (Phase M6)

```typescript
import { test, expect } from '@playwright/test';

test('TEST-MX-001: User flow should work', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="button"]');
  await expect(page.getByText('Success')).toBeVisible();
});
```

---

## Exit Criteria Checklist

### Phase M1 ✓
- [ ] All 6 tables created
- [ ] All repositories implement CRUD
- [ ] Seed data loads successfully
- [ ] TEST-301: Foreign keys enforced

### Phase M2 ✓
- [ ] All 4 tools created
- [ ] ImageGenerationTool uses alpha-image-232/edit-image
- [ ] TEST-501: Image generation returns URL
- [ ] TEST-502: Error handling works

### Phase M3 ✓
- [ ] All 5 agents defined
- [ ] TEST-302: Queries include influencer
- [ ] TEST-304: Responses include product
- [ ] TEST-306: Safety flags violations

### Phase M4 ✓
- [ ] All 3 workflows executable
- [ ] TEST-001: Onboarding extracts schema
- [ ] TEST-006: Card generation creates cards
- [ ] WorkflowRun tracking works

### Phase M5 ✓
- [ ] All 8 endpoints implemented
- [ ] TEST-201: Endpoints respond correctly
- [ ] TEST-102: Card list API <500ms

### Phase M6 ✓
- [ ] Frontend uses API exclusively
- [ ] No @mastra/client-js in frontend
- [ ] TEST-101: Full flow <3 minutes
- [ ] TEST-103: Gallery renders <2s

### Phase M7 ✓
- [ ] All PRD test IDs implemented
- [ ] >95% test pass rate
- [ ] RTM fully satisfied

---

## Common Test Utilities

### Database Test Helper
```typescript
// tests/helpers/db-test-helper.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/libsql';

export function setupTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  sqlite.exec('PRAGMA foreign_keys = ON');
  migrate(db, { migrationsFolder: './app/mastra/db/migrations' });

  return {
    db,
    sqlite,
    cleanup: () => sqlite.close(),
  };
}
```

### Mock LLM Responses
```typescript
// tests/helpers/llm-mock.ts
import { jest } from '@jest/globals';

export function mockLLMResponse(response: string) {
  return jest.fn().mockResolvedValue({
    text: response,
    usage: { tokens: 100 },
  });
}
```

### Mock fal.ai
```typescript
// tests/helpers/fal-mock.ts
jest.mock('@fal-ai/client', () => ({
  fal: {
    config: jest.fn(),
    subscribe: jest.fn().mockResolvedValue({
      data: {
        images: [{
          url: 'https://example.com/test.jpg',
          width: 1024,
          height: 768,
        }],
      },
    }),
  },
}));
```

---

## Debugging Failed Tests

### If M1 tests fail:
```bash
# Check database schema
sqlite3 :memory: < app/mastra/db/migrations/*.sql
.schema

# Check repository implementation
npm run test:m1 -- --verbose
```

### If M2 tests fail:
```bash
# Test tools individually
npm test tests/unit/tools/db-tool.test.ts
npm test tests/unit/tools/image-generation-tool.test.ts

# Check mocks are working
DEBUG=* npm run test:m2:unit
```

### If M3 tests fail:
```bash
# LLM responses may be non-deterministic
# Run multiple times to verify
npm run test:m3 -- --repeat=3

# Check agent prompts
cat app/mastra/agents/*.ts | grep instructions
```

### If M4 tests fail:
```bash
# Workflow orchestration issues
# Check workflow state tracking
npm test tests/integration/workflows -- --verbose

# Check WorkflowRun records
sqlite3 test.db "SELECT * FROM workflow_runs;"
```

### If M5 tests fail:
```bash
# API endpoint issues
# Check server logs
DEBUG=express:* npm run test:m5:api

# Test endpoint directly
curl -X POST http://localhost:4000/api/brands \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","domain":"test","contentSources":[]}'
```

### If M6 tests fail:
```bash
# E2E issues
# Run with headed browser to see what's happening
npm run test:m6:e2e -- --headed

# Check network tab
npm run test:m6:e2e -- --debug
```

### If M7 tests fail:
```bash
# RTM validation issues
# Check which requirements are missing tests
npm run test:rtm -- --verbose

# Generate coverage report
npm run test:coverage
open coverage/index.html
```

---

## Test Performance Tips

### Speed up tests:

1. **Use in-memory databases**
   ```typescript
   const sqlite = new Database(':memory:');
   ```

2. **Mock external services**
   ```typescript
   jest.mock('@fal-ai/client');
   ```

3. **Cache LLM responses**
   ```bash
   LLM_CACHE=true npm test
   ```

4. **Run tests in parallel**
   ```json
   {
     "jest": {
       "maxWorkers": 4
     }
   }
   ```

5. **Use test.only for debugging**
   ```typescript
   test.only('TEST-MX-001: Debug this test', () => {
     // ...
   });
   ```

---

## When to Run What

| Situation | Command | Time |
|-----------|---------|------|
| Quick check during development | `npm test -- --watch` | Instant |
| Before committing code | `npm run test:mX` | 30s-2min |
| Before merging PR | `npm run test:all` | 5-10min |
| Before phase completion | `npm run validate:mX` | 1-3min |
| Weekly full validation | `npm run test:coverage` | 10-15min |

---

## Red-Green-Refactor Workflow

```
1. 🔴 RED: Write failing test
   └─> npm run test:mX
       ❌ 1 test failed

2. 🟢 GREEN: Implement feature
   └─> npm run test:mX
       ✅ All tests passed

3. 🔵 REFACTOR: Improve code
   └─> npm run test:mX
       ✅ All tests still pass

4. ✅ VALIDATE: Check exit criteria
   └─> npm run validate:mX
       ✅ Phase ready

5. 🏷️ TAG: Mark completion
   └─> git tag -a mX-name -m "Phase MX complete"
```

---

## Critical Test Files Per Phase

### M1
```
tests/unit/db/schema.test.ts              ⭐ Critical
tests/unit/db/repositories/*.test.ts       ⭐ Critical
scripts/validate-m1.ts                     ⭐ Critical
```

### M2
```
tests/unit/tools/image-generation-tool.test.ts  ⭐ Critical (FLUX model)
tests/unit/tools/db-tool.test.ts               ⭐ Critical
scripts/validate-m2.ts                          ⭐ Critical
```

### M3
```
tests/unit/agents/card-query-agent.test.ts     ⭐ Critical (TEST-302)
tests/unit/agents/card-answer-agent.test.ts    ⭐ Critical (TEST-304)
tests/unit/agents/safety-agent.test.ts         ⭐ Critical (TEST-306)
```

### M4
```
tests/integration/workflows/card-generation.workflow.test.ts  ⭐ Critical
tests/e2e/workflows/full-card-generation-flow.test.ts        ⭐ Critical
```

### M5
```
tests/api/brands.api.test.ts           ⭐ Critical
tests/api/performance.api.test.ts      ⭐ Critical (TEST-102)
```

### M6
```
tests/e2e/frontend/brand-setup-flow.spec.ts      ⭐ Critical (TEST-101)
tests/e2e/frontend/card-gallery-flow.spec.ts     ⭐ Critical (TEST-103)
```

### M7
```
tests/rtm-validation.test.ts           ⭐ Critical
tests/prd/TEST-*.test.ts               ⭐ Critical (all)
```

---

**Last Updated**: 2025-11-23
**Status**: Ready for use starting Phase M1
