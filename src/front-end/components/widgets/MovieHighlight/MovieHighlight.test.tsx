// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MovieHighlight from './MovieHighlight';

afterEach(cleanup);

describe('MovieHighlight', () => {
  it('renders the poster, the title, the year and the highlighted value', () => {
    // Arrange & Act
    render(
      <MovieHighlight
        title="Parasite"
        posterPath="/parasite.jpg"
        releaseYear={2019}
      >
        <p>8,5 / 10</p>
      </MovieHighlight>,
    );

    // Assert: the poster is a TMDB image described by its alternative text.
    const poster = screen.getByRole('img', { name: 'Affiche de Parasite' });
    expect(poster.getAttribute('src')).toBe(
      'https://image.tmdb.org/t/p/w185/parasite.jpg',
    );
    expect(screen.getByText('Parasite')).toBeTruthy();
    expect(screen.getByText('2019')).toBeTruthy();
    expect(screen.getByText('8,5 / 10')).toBeTruthy();
  });

  it('renders an explicit placeholder when the movie has no poster', () => {
    // Arrange & Act
    render(
      <MovieHighlight title="Parasite" posterPath={null} releaseYear={2019} />,
    );

    // Assert: the placeholder is an accessible image with a visible text.
    const placeholder = screen.getByRole('img', {
      name: 'Affiche indisponible pour Parasite',
    });
    expect(placeholder.textContent).toBe('Affiche indisponible');
    expect(
      screen.queryByRole('img', { name: 'Affiche de Parasite' }),
    ).toBeNull();
  });

  it('replaces a poster that can not be loaded, then tries a new poster', () => {
    // Arrange
    const { rerender } = render(
      <MovieHighlight
        title="Parasite"
        posterPath="/broken.jpg"
        releaseYear={2019}
      />,
    );

    // Act: the image fails to load.
    fireEvent.error(screen.getByRole('img', { name: 'Affiche de Parasite' }));

    // Assert: the placeholder is displayed instead.
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour Parasite' }),
    ).toBeTruthy();

    // Act: a new poster path is provided.
    rerender(
      <MovieHighlight
        title="Parasite"
        posterPath="/new.jpg"
        releaseYear={2019}
      />,
    );

    // Assert: the new poster is displayed.
    expect(
      screen
        .getByRole('img', { name: 'Affiche de Parasite' })
        .getAttribute('src'),
    ).toBe('https://image.tmdb.org/t/p/w185/new.jpg');
  });

  it('renders an explicit text when the release year is unknown', () => {
    // Arrange & Act
    render(
      <MovieHighlight title="Parasite" posterPath={null} releaseYear={null} />,
    );

    // Assert
    expect(screen.getByText('Année inconnue')).toBeTruthy();
  });
});
