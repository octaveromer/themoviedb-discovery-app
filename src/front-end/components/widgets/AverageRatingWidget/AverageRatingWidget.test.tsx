// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageRatingWidget from './AverageRatingWidget';

afterEach(cleanup);

/** Returns the text of the widget, without its title. */
function getWidgetContent(): string {
  const widget = screen.getByRole('article', { name: 'Note moyenne' });
  return widget.textContent?.replace('Note moyenne', '') ?? '';
}

describe('AverageRatingWidget', () => {
  it('renders the rating with two decimals in the French format and the / 10 scale', () => {
    // Arrange & Act
    render(<AverageRatingWidget averageRating={6.78} />);

    // Assert: the decimal separator is a comma and the average is described as simple.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Note moyenne' }),
    ).toBeTruthy();
    expect(getWidgetContent()).toBe('6,78/ 10Moyenne simple des notes');
  });

  it.each([
    [7, '7,00'],
    [6.8, '6,80'],
    [6.789, '6,79'],
  ])('renders %d with exactly two decimals', (averageRating, expected) => {
    // Arrange & Act
    render(<AverageRatingWidget averageRating={averageRating} />);

    // Assert
    expect(getWidgetContent()).toBe(`${expected}/ 10Moyenne simple des notes`);
  });

  it('renders 0 as a valid rating', () => {
    // Arrange & Act
    render(<AverageRatingWidget averageRating={0} />);

    // Assert
    expect(getWidgetContent()).toBe('0,00/ 10Moyenne simple des notes');
  });

  it('renders a no data message instead of 0 when no movie is rated', () => {
    // Arrange & Act
    render(<AverageRatingWidget averageRating={null} />);

    // Assert: neither the scale nor the description is displayed.
    expect(getWidgetContent()).toBe('Aucune donnée disponible.');
  });

  it.each([
    ['loading', 'Chargement…'],
    ['error', 'Impossible de charger les données.'],
  ] as const)('renders the %s state', (status, expectedText) => {
    // Arrange & Act
    render(<AverageRatingWidget averageRating={6.78} status={status} />);

    // Assert: the rating is hidden while loading or after an error.
    expect(getWidgetContent()).toBe(expectedText);
  });
});
