import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
// Mock jose for ESM compatibility
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });

// Mock fal to throw once
const falSubscribeMock = jest.fn(async () => {
  throw new Error('timeout');
});
jest.mock('@fal-ai/client', () => ({
  fal: {
    config: jest.fn(),
    subscribe: () => falSubscribeMock(),
  },
}));

import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { brands, cards, influencers, environments, personas, workflowRuns } from '../../mastra/db/schema';

describe('Cards generation failure handling', () => {
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
    falSubscribeMock.mockReset();
    falSubscribeMock.mockRejectedValue(new Error('timeout'));
    await testDb.db.delete(cards);
    await testDb.db.delete(influencers);
    await testDb.db.delete(personas);
    await testDb.db.delete(environments);
    await testDb.db.delete(workflowRuns);
    await testDb.db.delete(brands);
  });

  afterAll(() => testDb.cleanup());

  test('returns 502 and marks workflow run failed on fal error', async () => {
    const brand = await testDb.repos.brands.create({
      name: 'FlowForm Motion Suit',
      domain: 'Wearable Training',
      description: 'FlowForm helps athletes train smarter with motion capture feedback.',
      urlSlug: 'flowform',
      contentSources: ['https://flowform.example.com'],
    });
    await testDb.repos.influencers.create({
      name: 'Ready Influencer',
      bio: 'Bio',
      domain: 'Strength',
      imageUrl: 'https://images.test/headshot.png',
      actionImageUrls: ['https://images.test/action1.png'],
      enabled: true,
      status: 'ready',
    });

    const res = await app.request(`/api/brands/${brand.brandId}/cards/generate`, { method: 'POST' });
    expect(res.status).toBe(502);

    const runs = await testDb.db.select().from(workflowRuns);
    expect(runs.length).toBe(1);
    expect(runs[0].status).toBe('failed');
    expect((runs[0].error || '').toLowerCase()).toContain('timeout');

    const cardsAfter = await testDb.repos.cards.findByBrandId(brand.brandId, {});
    expect(cardsAfter.length).toBe(0);
  });
});
