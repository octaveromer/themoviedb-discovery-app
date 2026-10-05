import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTmdbAccessToken } from './config';

describe('getTmdbAccessToken', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the token defined in the environment', () => {
    // Arrange
    vi.stubEnv('TMDB_ACCESS_TOKEN', 'my-token');

    // Act
    const token = getTmdbAccessToken();

    // Assert
    expect(token).toBe('my-token');
  });

  it('throws an error when the token is not defined', () => {
    // Arrange
    vi.stubEnv('TMDB_ACCESS_TOKEN', '');

    // Act & Assert
    expect(() => getTmdbAccessToken()).toThrow(
      'TMDB_ACCESS_TOKEN is not defined in the environment variables.',
    );
  });
});
