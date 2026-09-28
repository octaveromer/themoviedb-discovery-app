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

  it('rejects invalid movie identifiers', async () => {
    const response = await request(app).get('/api/movies/not-a-number');

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('positive integer');
  });
});
