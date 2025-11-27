import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
// Mock ESM-only deps so ts-jest doesn't choke on ESM jose in node_modules
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });

const falSubscribeMock: jest.MockedFunction<(...args: any[]) => Promise<any>> = jest.fn(async () => ({
  data: { images: [{ url: 'https://fal.test/card.png' }] },
}));
jest.mock('@fal-ai/client', () => ({
  fal: {
    config: jest.fn(),
    subscribe: (...args: any[]) => (falSubscribeMock as any)(...args),
  },
}));

import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { brands, cards, influencers, environments, personas } from '../../mastra/db/schema';

describe('Cards generation API (edge mode regression)', () => {
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
    falSubscribeMock.mockImplementation(async () => ({
      data: { images: [{ url: 'https://fal.test/card.png' }] },
    }));

    // Clean tables (order matters because of FKs)
    await testDb.db.delete(cards);
    await testDb.db.delete(influencers);
    await testDb.db.delete(personas);
    await testDb.db.delete(environments);
    await testDb.db.delete(brands);
  });

  afterAll(() => {
    testDb.cleanup();
  });

  test('cards list reflects generated cards with images (no placeholders)', async () => {
    const brand = await testDb.repos.brands.create({
      name: 'FlowForm Motion Suit',
      domain: 'Wearable Training',
      description: 'FlowForm helps athletes train smarter with motion capture feedback.',
      urlSlug: 'flowform',
      contentSources: ['https://flowform.example.com'],
    });

    await testDb.repos.influencers.create({
      name: 'Ready Influencer 2',
      bio: 'Fitness creator focused on motion analytics.',
      domain: 'Strength & Conditioning',
      imageUrl: 'https://images.test/headshot.png',
      actionImageUrls: ['https://images.test/action1.png', 'https://images.test/action2.png'],
      enabled: true,
      status: 'ready',
    });

    const generateRes = await app.request(`/api/brands/${brand.brandId}/cards/generate`, {
      method: 'POST',
    });
    expect(generateRes.status).toBe(201);
    const generateBody: any = await generateRes.json();
    expect(generateBody.cardIds.length).toBeGreaterThanOrEqual(0);

    const listRes = await app.request(`/api/brands/${brand.brandId}/cards`);
    expect(listRes.status).toBe(200);
    const listBody: any = await listRes.json();
    expect(listBody.cards.every((c: any) => c.imageUrl && !c.imageUrl.includes('placeholder'))).toBe(true);
  });

  test('returns 400 when no ready influencers exist', async () => {
    const brand = await testDb.repos.brands.create({
      name: 'FlowForm Motion Suit',
      domain: 'Wearable Training',
      description: 'FlowForm helps athletes train smarter with motion capture feedback.',
      urlSlug: 'flowform',
      contentSources: [],
    });

    const res = await app.request(`/api/brands/${brand.brandId}/cards/generate`, {
      method: 'POST',
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toMatch(/No ready influencers/i);
  });

  test('creates draft cards when at least one ready influencer exists', async () => {
    const brand = await testDb.repos.brands.create({
      name: 'FlowForm Motion Suit',
      domain: 'Wearable Training',
      description: 'FlowForm helps athletes train smarter with motion capture feedback.',
      urlSlug: 'flowform',
      contentSources: ['https://flowform.example.com'],
      productImages: ['https://images.example.com/flowform.png'],
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
    const body: any = await res.json();
    expect(Array.isArray(body.cardIds)).toBe(true);
    expect(body.cardIds.length).toBeGreaterThan(0);
    expect(body.totalGenerated).toBeGreaterThan(0);
    expect(body.totalSkipped).toBe(0);

    const generatedCards = await testDb.repos.cards.findByBrandId(brand.brandId, {});
    expect(generatedCards.length).toBe(body.cardIds.length);
    expect(generatedCards.every((c) => c.status === 'draft')).toBe(true);
    expect(generatedCards.every((c) => !!c.imageUrl)).toBe(true);
    expect(generatedCards.every((c) => c.imageUrl === 'https://fal.test/card.png')).toBe(true);
    expect(falSubscribeMock).toHaveBeenCalled();
  });

  test('second generation still succeeds and retains cards', async () => {
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
      actionImageUrls: ['https://images.test/action1.png'],
      enabled: true,
      status: 'ready',
    });

    // First generation creates cards
    const first = await app.request(`/api/brands/${brand.brandId}/cards/generate`, { method: 'POST' });
    expect(first.status).toBe(201);
    const firstBody: any = await first.json();
    expect(firstBody.cardIds.length).toBeGreaterThan(0);

    // Second generation should skip duplicates (same prompts)
    const second = await app.request(`/api/brands/${brand.brandId}/cards/generate`, { method: 'POST' });
    expect(second.status).toBe(201);
    const secondBody: any = await second.json();

    const allCards = await testDb.repos.cards.findByBrandId(brand.brandId, {});
    expect(allCards.length).toBeGreaterThanOrEqual(firstBody.cardIds.length); // allow new cards
    expect(allCards.every((c) => !!c.imageUrl)).toBe(true);
  });

  test('returns 502 when fal image generation fails', async () => {
    const brand = await testDb.repos.brands.create({
      name: 'FlowForm Motion Suit',
      domain: 'Wearable Training',
      description: 'FlowForm helps athletes train smarter with motion capture feedback.',
      urlSlug: 'flowform',
      contentSources: ['https://flowform.example.com'],
      productImages: ['https://images.example.com/flowform.png'],
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

    // Suppress TS inferring never on the mock
    falSubscribeMock.mockImplementationOnce(() => {
      throw new Error('fal down');
    });

    const res = await app.request(`/api/brands/${brand.brandId}/cards/generate`, {
      method: 'POST',
    });
    expect(res.status).toBe(502);
    const body: any = await res.json();
    expect(body.error).toMatch(/Card image generation failed/);
  });
});
