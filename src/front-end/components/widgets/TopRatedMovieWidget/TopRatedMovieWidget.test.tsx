// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TopRatedMovieWidget, { type TopRatedMovie } from './TopRatedMovieWidget';

afterEach(cleanup);

const parasite: TopRatedMovie = {
  title: 'Parasite',
  posterPath: '/parasite.jpg',
  releaseYear: 2019,
  rating: 9.1,
};

/** Returns the text of the widget, without its title. */
function getWidgetContent(): string {
  const widget = screen.getByRole('article', { name: 'Film le mieux noté' });
  return widget.textContent?.replace('Film le mieux noté', '') ?? '';
}

describe('TopRatedMovieWidget', () => {
  it('renders the poster, the title, the year and the rating on a scale of 10', () => {
    // Arrange & Act
    render(<TopRatedMovieWidget movie={parasite} />);

    // Assert: the rating has one decimal and a French decimal separator.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Film le mieux noté' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Affiche de Parasite' }),
    ).toBeTruthy();
    expect(getWidgetContent()).toBe('Parasite20199,1/ 10');
  });

  it.each([
    [9, '9,0'],
    [8.66, '8,7'],
  ])('renders the rating %d with one decimal', (rating, expected) => {
    // Arrange & Act
    render(<TopRatedMovieWidget movie={{ ...parasite, rating }} />);

    // Assert
    expect(getWidgetContent()).toBe(`Parasite2019${expected}/ 10`);
  });

  it('renders the poster placeholder and an unknown year', () => {
    // Arrange & Act
    render(
      <TopRatedMovieWidget
        movie={{ ...parasite, posterPath: null, releaseYear: null }}
      />,
    );

    // Assert
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour Parasite' }),
    ).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
  });

  it('renders a message when no movie is rated', () => {
    // Arrange & Act
    render(<TopRatedMovieWidget movie={null} />);

    // Assert
    expect(getWidgetContent()).toBe('Aucun film noté.');
  });

  it.each([
    ['loading', 'Chargement…'],
    ['error', 'Impossible de charger les données.'],
  ] as const)('renders the %s state', (status, expectedText) => {
    // Arrange & Act
    render(<TopRatedMovieWidget movie={parasite} status={status} />);

    // Assert: the movie is hidden while loading or after an error.
    expect(getWidgetContent()).toBe(expectedText);
  });
});
