// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import StatValue from './StatValue';

afterEach(cleanup);

describe('StatValue', () => {
  it('renders the value in the French format followed by its unit', () => {
    // Arrange & Act
    const { container } = render(<StatValue value={12345} unit="films" />);

    // Assert: the thousands are separated by a narrow no-break space.
    expect(container.textContent).toBe('12 345films');
    expect(screen.getByText('films').className).toBe('widget-card-unit');
  });

  it('rounds the value to the requested number of decimals', () => {
    // Arrange & Act: no decimal by default, one when requested.
    const { container } = render(
      <>
        <StatValue value={106.66} unit="min" />
        <StatValue value={106.66} unit="min" maximumFractionDigits={1} />
      </>,
    );

    // Assert: the French decimal separator is a comma.
    expect(container.textContent).toBe('107min106,7min');
  });

  it('renders 0 as a valid value', () => {
    // Arrange & Act
    const { container } = render(<StatValue value={0} unit="film" />);

    // Assert
    expect(container.textContent).toBe('0film');
  });

  it('renders a no data message instead of 0 when the value is unknown', () => {
    // Arrange & Act
    const { container } = render(<StatValue value={null} unit="min" />);

    // Assert
    expect(container.textContent).toBe('Aucune donnée disponible.');
  });
});
