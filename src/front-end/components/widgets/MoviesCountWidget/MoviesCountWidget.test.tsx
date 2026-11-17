// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MoviesCountWidget from './MoviesCountWidget';

afterEach(cleanup);

/** Returns the main value of the widget, e.g. "1 234films". */
function getValue(): string | null {
  return (
    screen
      .getByRole('article', { name: 'Films en base' })
      .querySelector('.widget-card-value')?.textContent ?? null
  );
}

describe('MoviesCountWidget', () => {
  it('renders the number of movies in the French format', () => {
    // Arrange & Act
    render(<MoviesCountWidget count={1234} />);

    // Assert: the thousands are separated by a narrow no-break space.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Films en base' }),
    ).toBeTruthy();
    expect(getValue()).toBe('1 234films');
  });

  it.each([
    [0, '0film'],
    [1, '1film'],
    [2, '2films'],
  ])('renders %i with the right unit', (count, expected) => {
    // Arrange & Act
    render(<MoviesCountWidget count={count} />);

    // Assert: 0 is a valid count, displayed as such.
    expect(getValue()).toBe(expected);
  });

  it('renders a no data message instead of 0 when the count is unknown', () => {
    // Arrange & Act
    render(<MoviesCountWidget count={null} />);

    // Assert
    expect(screen.getByText('Aucune donnée disponible.')).toBeTruthy();
    expect(getValue()).toBeNull();
  });

  it('renders the loading and error states of the card', () => {
    // Arrange & Act: render a loading widget and a failed one.
    render(
      <>
        <MoviesCountWidget count={null} status="loading" />
        <MoviesCountWidget count={null} status="error" />
      </>,
    );

    // Assert
    expect(screen.getByText('Chargement…')).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Aucune donnée disponible.')).toBeNull();
  });
});
