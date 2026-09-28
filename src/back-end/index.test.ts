import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './index';

describe('API routes', () => {
  it('exposes the health endpoint', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('does not expose the root route anymore', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(404);
  });
});
