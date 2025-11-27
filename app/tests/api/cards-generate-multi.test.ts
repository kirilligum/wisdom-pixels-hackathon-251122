import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
// Mock jose for ESM compatibility
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });

// Mock fal client to avoid network calls and to validate per-card generation
const falSubscribeMock = jest.fn(async () => ({
  data: { images: [{ url: 'https://fal.test/card.png' }] },
}));
jest.mock('@fal-ai/client', () => ({
  fal: {
    config: jest.fn(),
    subscribe: () => falSubscribeMock(),
  },
}));

import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { brands, cards, influencers, environments, personas, workflowRuns } from '../../mastra/db/schema';

describe('Cards generation with multiple influencers', () => {
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
    falSubscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.test/card.png' }] } });
    await testDb.db.delete(cards);
    await testDb.db.delete(influencers);
    await testDb.db.delete(personas);
    await testDb.db.delete(environments);
    await testDb.db.delete(workflowRuns);
    await testDb.db.delete(brands);
  });

  afterAll(() => testDb.cleanup());

  test('generates up to 3 cards with dedupe and images', async () => {
    const brand = await testDb.repos.brands.create({
      name: 'FlowForm Motion Suit',
      domain: 'Wearable Training',
      description: 'FlowForm helps athletes train smarter with motion capture feedback.',
      urlSlug: 'flowform',
      contentSources: ['https://flowform.example.com'],
    });

    // Three ready influencers with images
    for (let i = 0; i < 3; i++) {
      await testDb.repos.influencers.create({
        name: `Influencer ${i}`,
        bio: 'Bio',
        domain: 'Strength & Conditioning',
        imageUrl: `https://images.test/headshot${i}.png`,
        actionImageUrls: [`https://images.test/action${i}.png`],
        enabled: true,
        status: 'ready',
      });
    }

    const res = await app.request(`/api/brands/${brand.brandId}/cards/generate`, { method: 'POST' });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.cardIds.length).toBeGreaterThanOrEqual(1);
    expect(body.cardIds.length).toBeLessThanOrEqual(3);

    const allCards = await testDb.repos.cards.findByBrandId(brand.brandId, {});
    expect(allCards.length).toBeGreaterThanOrEqual(body.cardIds.length);
    expect(allCards.some((c) => !!c.imageUrl && c.imageUrl.includes('fal.test'))).toBe(true);
    expect(falSubscribeMock).toHaveBeenCalled();
  });
});
