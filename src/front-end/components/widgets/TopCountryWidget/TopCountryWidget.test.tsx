// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TopCountryWidget from './TopCountryWidget';

afterEach(cleanup);

/** Returns the text of the widget, without its title. */
function getWidgetContent(): string {
  const widget = screen.getByRole('article', {
    name: 'Pays le plus représenté',
  });
  return widget.textContent?.replace('Pays le plus représenté', '') ?? '';
}

describe('TopCountryWidget', () => {
  it('renders the label, the country name and its number of movies', () => {
    // Arrange & Act
    render(
      <TopCountryWidget
        topCountry={{ name: 'United States of America', movieCount: 725 }}
      />,
    );

    // Assert
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Pays le plus représenté',
      }),
    ).toBeTruthy();
    expect(screen.getByText('United States of America').className).toBe(
      'widget-card-highlight',
    );
    expect(getWidgetContent()).toBe('United States of America725films');
  });

  it('renders the number of movies in the French format with the right unit', () => {
    // Arrange & Act: render a large count and a single movie.
    render(
      <>
        <TopCountryWidget topCountry={{ name: 'France', movieCount: 1250 }} />
        <TopCountryWidget topCountry={{ name: 'Islande', movieCount: 1 }} />
      </>,
    );

    // Assert
    const [france, iceland] = screen.getAllByRole('article');
    expect(france.textContent).toContain('France1 250films');
    expect(iceland.textContent).toContain('Islande1film');
  });

  it('renders a message when no country is known', () => {
    // Arrange & Act
    render(<TopCountryWidget topCountry={null} />);

    // Assert: neither a name nor a count is displayed.
    expect(getWidgetContent()).toBe('Aucun pays connu.');
  });

  it.each([
    ['loading', 'Chargement…'],
    ['error', 'Impossible de charger les données.'],
  ] as const)('renders the %s state', (status, expectedText) => {
    // Arrange & Act
    render(
      <TopCountryWidget
        topCountry={{ name: 'France', movieCount: 10 }}
        status={status}
      />,
    );

    // Assert: the country is hidden while loading or after an error.
    expect(getWidgetContent()).toBe(expectedText);
  });
});
