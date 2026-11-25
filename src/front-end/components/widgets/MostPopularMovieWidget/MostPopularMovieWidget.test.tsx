// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MostPopularMovieWidget, {
  type MostPopularMovie,
} from './MostPopularMovieWidget';

afterEach(cleanup);

const avatar: MostPopularMovie = {
  title: 'Avatar: The Way of Water',
  posterPath: '/avatar.jpg',
  releaseYear: 2022,
  popularity: 1036.49,
};

/** Returns the text of the widget, without its title. */
function getWidgetContent(): string {
  const widget = screen.getByRole('article', {
    name: 'Film le plus populaire',
  });
  return widget.textContent?.replace('Film le plus populaire', '') ?? '';
}

describe('MostPopularMovieWidget', () => {
  it('renders the movie and its popularity with two decimals and its label', () => {
    // Arrange & Act
    render(<MostPopularMovieWidget movie={avatar} />);

    // Assert: French format, "popularité" unit and no "/ 10" scale.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Film le plus populaire' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Affiche de Avatar: The Way of Water' }),
    ).toBeTruthy();
    expect(getWidgetContent()).toBe(
      'Avatar: The Way of Water20221 036,49popularitéIndice de popularité TMDB',
    );
    expect(getWidgetContent()).not.toContain('/ 10');
  });

  it('completes the popularity with zeros up to two decimals', () => {
    // Arrange & Act
    render(<MostPopularMovieWidget movie={{ ...avatar, popularity: 85.5 }} />);

    // Assert
    expect(getWidgetContent()).toContain('85,50popularité');
  });

  it('renders a no data message instead of 0 when the popularity is unknown', () => {
    // Arrange & Act
    render(<MostPopularMovieWidget movie={{ ...avatar, popularity: null }} />);

    // Assert: the movie is still displayed, without value nor description.
    expect(getWidgetContent()).toBe(
      'Avatar: The Way of Water2022Aucune donnée disponible.',
    );
  });

  it('renders the poster placeholder and an unknown year', () => {
    // Arrange & Act
    render(
      <MostPopularMovieWidget
        movie={{ ...avatar, posterPath: null, releaseYear: null }}
      />,
    );

    // Assert
    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Avatar: The Way of Water',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
  });

  it('renders a message when no movie is available', () => {
    // Arrange & Act
    render(<MostPopularMovieWidget movie={null} />);

    // Assert
    expect(getWidgetContent()).toBe('Aucun film disponible.');
  });

  it.each([
    ['loading', 'Chargement…'],
    ['error', 'Impossible de charger les données.'],
  ] as const)('renders the %s state', (status, expectedText) => {
    // Arrange & Act
    render(<MostPopularMovieWidget movie={avatar} status={status} />);

    // Assert: the movie is hidden while loading or after an error.
    expect(getWidgetContent()).toBe(expectedText);
  });
});
