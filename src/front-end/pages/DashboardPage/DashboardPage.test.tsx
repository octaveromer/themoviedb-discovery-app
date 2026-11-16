// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DashboardPage from './DashboardPage';

afterEach(cleanup);

describe('DashboardPage', () => {
  it('renders the dashboard title and an empty state when no widget is configured', () => {
    // Arrange & Act: render the page without widgets.
    render(<DashboardPage />);

    // Assert: the page presents its title, introduction, and empty widgets area.
    expect(screen.getByRole('main')).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tableau de bord des films',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Une vue d'ensemble des films enregistrés/),
    ).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Widgets' }).textContent).toBe(
      "Aucun widget n'est encore configuré.",
    );
  });

  it('renders the given widgets instead of the empty state', () => {
    // Arrange & Act: render the page with two widgets.
    render(
      <DashboardPage>
        <article>Films en base</article>
        <article>Note moyenne</article>
      </DashboardPage>,
    );

    // Assert: the widgets are displayed and the empty state is hidden.
    const widgets = screen.getByRole('region', { name: 'Widgets' });
    expect(widgets.querySelectorAll('article')).toHaveLength(2);
    expect(screen.getByText('Films en base')).toBeTruthy();
    expect(
      screen.queryByText("Aucun widget n'est encore configuré."),
    ).toBeNull();
  });
});
