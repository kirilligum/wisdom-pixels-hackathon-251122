import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
// Mock jose to satisfy ts-jest for ESM module
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });

import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { cards, influencers, brands, environments, personas } from '../../mastra/db/schema';

describe('Cards delete validation', () => {
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

  test('returns 400 when no ids provided', async () => {
    const res = await app.request('/api/cards/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardIds: [] }),
    });
    expect(res.status).toBe(400);
  });

  test('deletes arbitrary ids without uuid validation', async () => {
    const res = await app.request('/api/cards/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardIds: ['card_001', 'card_002'] }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.deleted).toBe(2);
  });
});
