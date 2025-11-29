import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
// Mock ESM-only deps so ts-jest doesn't choke on ESM jose in node_modules
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });

// Mock fal client to avoid network calls and make tests deterministic
jest.mock('@fal-ai/client', () => ({
  fal: {
    config: jest.fn(),
    subscribe: jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: { images: [{ url: 'https://fal.test/image.png' }] },
        output: 'ok',
      }),
    ),
  },
}));

import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { influencers } from '../../mastra/db/schema';

describe('Find New API flow (regression)', () => {
  const testDb = setupTestDb();
  const app = createApiApp({
    db: testDb.db,
    config: {
      allowedOrigins: [],
      authDisabled: true,
      falKey: 'test-key',
    },
  });

  const legacyNames = new Set([
    'jordan lee',
    'priya nair',
    'diego alvarez',
    'mia patel',
    'alex chen',
    'sarah williams',
    'marcus johnson',
    'emma rodriguez',
  ]);

  beforeEach(async () => {
    process.env.FALAI_API_KEY = 'test-key';
    await testDb.db.delete(influencers);
  });

  afterAll(() => {
    testDb.cleanup();
  });

  test('empty DB -> one new influencer, no legacy names', async () => {
    const res = await app.request('/api/influencers/find-new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(202);
    const body: any = await res.json();
    expect(body.influencer).toBeDefined();
    expect(legacyNames.has(body.influencer.name.toLowerCase())).toBe(false);
  });

  test('second call adds exactly one unique influencer, no legacy names', async () => {
    const first = await app.request('/api/influencers/find-new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(first.status).toBe(202);
    const firstBody: any = await first.json();
    const firstName = firstBody.influencer.name.toLowerCase();

    const second = await app.request('/api/influencers/find-new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(second.status).toBe(202);
    const secondBody: any = await second.json();
    const secondName = secondBody.influencer.name.toLowerCase();
    expect(secondName).not.toBe(firstName);
    expect(legacyNames.has(firstName)).toBe(false);
    expect(legacyNames.has(secondName)).toBe(false);
  });
});
