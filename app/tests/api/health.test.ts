import request from 'supertest';
import { app, server } from '../../api/server';

describe('API Health', () => {
  afterAll(() => {
    server.close();
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
