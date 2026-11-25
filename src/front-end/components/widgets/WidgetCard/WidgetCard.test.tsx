// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import WidgetCard from './WidgetCard';

afterEach(cleanup);

describe('WidgetCard', () => {
  it('renders the title and the content when the data is ready', () => {
    // Arrange & Act
    render(
      <WidgetCard title="Films en base" status="ready">
        <p>42</p>
      </WidgetCard>,
    );

    // Assert: the card is named by its title and shows its content.
    const card = screen.getByRole('article', { name: 'Films en base' });
    expect(card.getAttribute('aria-busy')).toBe('false');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Films en base' }),
    ).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders a loading message instead of the content while loading', () => {
    // Arrange & Act
    render(
      <WidgetCard title="Films en base" status="loading">
        <p>42</p>
      </WidgetCard>,
    );

    // Assert: the card is marked busy and the content is hidden.
    const card = screen.getByRole('article', { name: 'Films en base' });
    expect(card.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Chargement…')).toBeTruthy();
    expect(screen.queryByText('42')).toBeNull();
  });

  it('renders an error alert instead of the content when loading failed', () => {
    // Arrange & Act
    render(
      <WidgetCard title="Films en base" status="error">
        <p>42</p>
      </WidgetCard>,
    );

    // Assert: the error is announced and the content is hidden.
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger les données.',
    );
    expect(screen.queryByText('42')).toBeNull();
  });
});
