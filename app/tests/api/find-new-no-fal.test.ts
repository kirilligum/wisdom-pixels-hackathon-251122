import { describe, test, expect, afterAll, jest } from '@jest/globals';

// Mock ESM-only deps so ts-jest doesn't choke on ESM jose in node_modules
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jest.fn(),
}), { virtual: true });
import { createApiApp } from '../../api/app';
import { setupTestDb } from '../helpers/db-test-helper';
import { influencers } from '../../mastra/db/schema';

describe('Find New API without FAL key', () => {
  const testDb = setupTestDb();
  const app = createApiApp({
    db: testDb.db,
    config: {
      allowedOrigins: [],
      authDisabled: true,
      falKey: undefined,
    },
  });

  afterAll(() => {
    testDb.cleanup();
  });

  test('returns 503 when fal key missing', async () => {
    await testDb.db.delete(influencers);
    const res = await app.request('/api/influencers/find-new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(503);
    const body: any = await res.json();
    expect(body.error).toMatch(/FAL key missing/i);
  });
});
