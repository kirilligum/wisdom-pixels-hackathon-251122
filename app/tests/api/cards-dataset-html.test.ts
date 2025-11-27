import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
// Mock jose for ESM compatibility
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });

import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { cards, influencers, brands, environments, personas } from '../../mastra/db/schema';

describe('Dataset HTML rendering', () => {
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

  test('renders dataset with image URLs and Q&A content', async () => {
    const brand = await testDb.repos.brands.create({
      name: 'FlowForm Motion Suit',
      domain: 'Wearable Training',
      description: 'Motion suit with real-time motion capture.',
      urlSlug: 'flowform',
      contentSources: [],
    });
    const influencer = await testDb.repos.influencers.create({
      name: 'Dataset Tester',
      bio: 'Bio',
      domain: 'Strength',
      imageUrl: 'https://images.test/headshot.png',
      actionImageUrls: ['https://images.test/action1.png'],
      enabled: true,
      status: 'ready',
    });
    // published card should appear
    await testDb.repos.cards.create({
      brandId: brand.brandId,
      influencerId: influencer.influencerId,
      personaId: null,
      environmentId: null,
      query: 'What is FlowForm?',
      response: 'FlowForm is a motion suit.',
      imageUrl: 'https://images.test/card.png',
      imageBrief: 'Card image',
      status: 'published',
    });

    // draft card should be excluded
    await testDb.repos.cards.create({
      brandId: brand.brandId,
      influencerId: influencer.influencerId,
      personaId: null,
      environmentId: null,
      query: 'Draft card',
      response: 'Draft response',
      imageUrl: 'https://images.test/card2.png',
      imageBrief: 'Card image 2',
      status: 'draft',
    });

    const res = await app.request(`/api/dataset/${brand.brandId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('FlowForm Motion Suit');
    expect(html).toContain('What is FlowForm?');
    expect(html).toContain('FlowForm is a motion suit.');
    expect(html).toContain('https://images.test/card.png');
    expect(html).not.toContain('Draft card');
    expect(html).not.toContain('https://images.test/card2.png');
  });
});
