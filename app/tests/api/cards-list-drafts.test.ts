import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
// Mock jose for ESM compatibility
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });

import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { brands, cards, influencers, environments, personas } from '../../mastra/db/schema';

describe('Cards listing returns drafts', () => {
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

  test('draft card is returned by /api/brands/:brandId/cards', async () => {
    const brand = await testDb.repos.brands.create({
      name: 'FlowForm Motion Suit',
      domain: 'Wearable Training',
      description: 'Motion suit.',
      urlSlug: 'flowform',
      contentSources: [],
    });
    const influencer = await testDb.repos.influencers.create({
      name: 'Draft Influencer',
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
      query: 'Draft Q',
      response: 'Draft A',
      imageUrl: 'https://images.test/card.png',
      imageBrief: 'brief',
      status: 'draft',
    });

    const res = await app.request(`/api/brands/${brand.brandId}/cards`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.cards.length).toBe(1);
    expect(body.cards[0].cardId).toBe(card.cardId);
    expect(body.cards[0].status).toBe('draft');
  });
});
