// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageRuntimeWidget from './AverageRuntimeWidget';

afterEach(cleanup);

/** Returns the text of the widget, without its title. */
function getWidgetContent(): string {
  const widget = screen.getByRole('article', { name: 'Durée moyenne' });
  return widget.textContent?.replace('Durée moyenne', '') ?? '';
}

describe('AverageRuntimeWidget', () => {
  it('renders the label, the average runtime and the min unit', () => {
    // Arrange & Act
    render(<AverageRuntimeWidget averageRuntime={107} />);

    // Assert
    expect(
      screen.getByRole('heading', { level: 2, name: 'Durée moyenne' }),
    ).toBeTruthy();
    expect(getWidgetContent()).toBe('107min');
    expect(screen.getByText('min')).toBeTruthy();
  });

  it('rounds a decimal average to the minute', () => {
    // Arrange & Act
    render(<AverageRuntimeWidget averageRuntime={106.6} />);

    // Assert
    expect(getWidgetContent()).toBe('107min');
  });

  it('renders a no data message instead of 0 when the average is unknown', () => {
    // Arrange & Act
    render(<AverageRuntimeWidget averageRuntime={null} />);

    // Assert: no value nor unit is displayed.
    expect(getWidgetContent()).toBe('Aucune donnée disponible.');
    expect(screen.queryByText('min')).toBeNull();
  });

  it.each([
    ['loading', 'Chargement…'],
    ['error', 'Impossible de charger les données.'],
  ] as const)('renders the %s state', (status, expectedText) => {
    // Arrange & Act
    render(<AverageRuntimeWidget averageRuntime={107} status={status} />);

    // Assert: the value is hidden while loading or after an error.
    expect(getWidgetContent()).toBe(expectedText);
  });
});
