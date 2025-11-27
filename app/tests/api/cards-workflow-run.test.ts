import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
// Mock jose for ESM compatibility
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });

import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { brands, cards, influencers, environments, personas, workflowRuns } from '../../mastra/db/schema';

describe('Card generation workflow run tracking', () => {
  const testDb = setupTestDb();
  const app = createApiApp({
    db: testDb.db,
    config: {
      allowedOrigins: [],
      authDisabled: true,
      falKey: 'test-key',
    },
  });

  beforeEach(async () => {
    await testDb.db.delete(cards);
    await testDb.db.delete(influencers);
    await testDb.db.delete(personas);
    await testDb.db.delete(environments);
    await testDb.db.delete(workflowRuns);
    await testDb.db.delete(brands);
  });

  afterAll(() => testDb.cleanup());

  test('create run and fetch status after generation', async () => {
    const brand = await testDb.repos.brands.create({
      name: 'FlowForm Motion Suit',
      domain: 'Wearable Training',
      description: 'FlowForm helps athletes train smarter with motion capture feedback.',
      urlSlug: 'flowform',
      contentSources: ['https://flowform.example.com'],
    });

    await testDb.repos.influencers.create({
      name: 'Ready Influencer',
      bio: 'Fitness creator focused on motion analytics.',
      domain: 'Strength & Conditioning',
      imageUrl: 'https://images.test/headshot.png',
      actionImageUrls: ['https://images.test/action1.png', 'https://images.test/action2.png'],
      enabled: true,
      status: 'ready',
    });

    const res = await app.request(`/api/brands/${brand.brandId}/cards/generate`, {
      method: 'POST',
    });
    expect(res.status).toBe(201);

    const runRows = await testDb.db.select().from(workflowRuns);
    expect(runRows.length).toBe(1);
    const runId = runRows[0].runId;

    const runRes = await app.request(`/api/workflow-runs/${runId}`);
    expect(runRes.status).toBe(200);
    const body: any = await runRes.json();
    expect(body.run.status).toBe('completed');
    expect(body.run.output?.cardIds?.length).toBeGreaterThanOrEqual(0);
  });
});
