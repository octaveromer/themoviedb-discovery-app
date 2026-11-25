// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import * as stories from './TopRatedMovieWidget.stories';

afterEach(cleanup);

// The stories as React components, with their args and decorators
const { Nominal, NoPoster, NoRatedMovie, Loading, WithError } =
  composeStories(stories);

describe('TopRatedMovieWidget stories', () => {
  it.each([
    ['Nominal', Nominal, 'The Shawshank Redemption19949,1/ 10'],
    [
      'NoPoster',
      NoPoster,
      'Affiche indisponibleDr. Strangelove or: How I Learned to Stop Worrying and Love the BombAnnée inconnue8,4/ 10',
    ],
    ['NoRatedMovie', NoRatedMovie, 'Aucun film noté.'],
    ['Loading', Loading, 'Chargement…'],
    ['WithError', WithError, 'Impossible de charger les données.'],
  ])('renders the %s story', (_name, Story, expectedText) => {
    // Arrange & Act: render the story as Storybook does.
    render(<Story />);

    // Assert: the widget title and the expected state are displayed.
    const widget = screen.getByRole('article', { name: 'Film le mieux noté' });
    expect(widget.textContent).toBe(`Film le mieux noté${expectedText}`);
  });

  it('renders an accessible poster in the Nominal story', () => {
    // Arrange & Act
    render(<Nominal />);

    // Assert
    expect(
      screen.getByRole('img', { name: 'Affiche de The Shawshank Redemption' }),
    ).toBeTruthy();
  });
});
