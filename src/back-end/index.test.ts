import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './index';

describe('API routes', () => {
  it('registers the health and movies routes', async () => {
    // Act
    const health = await request(app).get('/api/health');
    const movie = await request(app).get('/api/movies/not-a-number');

    // Assert
    expect(health.status).not.toBe(404);
    expect(movie.status).not.toBe(404);
  });

  it('does not expose the root route anymore', async () => {
    // Act
    const response = await request(app).get('/');

    // Assert
    expect(response.status).toBe(404);
  });
});
