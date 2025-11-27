import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
// Mock jose for ESM compatibility
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });

import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { brands, cards, influencers, environments, personas } from '../../mastra/db/schema';

describe('Cards publish fallback (edge mode)', () => {
  const testDb = setupTestDb();
  const app = createApiApp({
    db: testDb.db,
    config: { allowedOrigins: [], authDisabled: true },
  });

  beforeEach(async () => {
    await testDb.db.delete(cards);
    await testDb.db.delete(influencers);
    await testDb.db.delete(personas);
    await testDb.db.delete(environments);
    await testDb.db.delete(brands);
  });

  afterAll(() => testDb.cleanup());

  test('publishes cards directly when mastra workflow is unavailable', async () => {
    const brand = await testDb.repos.brands.create({
      name: 'FlowForm Motion Suit',
      domain: 'Wearable Training',
      description: 'Motion suit.',
      urlSlug: 'flowform',
      contentSources: [],
    });
    const influencer = await testDb.repos.influencers.create({
      name: 'Test Influencer',
      bio: 'Bio',
      domain: 'Strength',
      imageUrl: 'https://images.test/headshot.png',
      actionImageUrls: ['https://images.test/action1.png'],
      enabled: true,
      status: 'ready',
    });
    const card = await testDb.repos.cards.create({
      brandId: brand.brandId,
      influencerId: influencer.influencerId,
      personaId: null,
      environmentId: null,
      query: 'Q',
      response: 'A',
      imageUrl: 'https://images.test/card.png',
      imageBrief: 'brief',
      status: 'draft',
    });

    const res = await app.request('/api/cards/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardIds: [card.cardId] }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.publishedCount).toBe(1);
    expect(body.publishedCardIds).toContain(card.cardId);

    const updated = await testDb.repos.cards.findById(card.cardId);
    expect(updated?.status).toBe('published');
    expect(updated?.publishedAt).toBeDefined();
  });
});
