import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './index';

describe('GET /api/health', () => {
  it('returns the ok status', async () => {
    // Act
    const response = await request(app).get('/api/health');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
