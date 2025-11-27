import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
// Mock jose for ESM compatibility
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });

import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { brands, cards, influencers, environments, personas } from '../../mastra/db/schema';

describe('Cards delete subset', () => {
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

  test('deletes only requested cards', async () => {
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
    const card1 = await testDb.repos.cards.create({
      brandId: brand.brandId,
      influencerId: influencer.influencerId,
      personaId: null,
      environmentId: null,
      query: 'Q1',
      response: 'A1',
      imageUrl: 'https://images.test/card1.png',
      imageBrief: 'brief',
      status: 'draft',
    });
    const card2 = await testDb.repos.cards.create({
      brandId: brand.brandId,
      influencerId: influencer.influencerId,
      personaId: null,
      environmentId: null,
      query: 'Q2',
      response: 'A2',
      imageUrl: 'https://images.test/card2.png',
      imageBrief: 'brief',
      status: 'draft',
    });

    const res = await app.request('/api/cards/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardIds: [card1.cardId] }),
    });
    expect(res.status).toBe(200);

    const remaining = await testDb.repos.cards.findByBrandId(brand.brandId, {});
    expect(remaining.length).toBe(1);
    expect(remaining[0].cardId).toBe(card2.cardId);
  });
});
