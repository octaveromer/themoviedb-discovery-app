// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import * as stories from './MostPopularMovieWidget.stories';

afterEach(cleanup);

// The stories as React components, with their args and decorators
const { Nominal, NoPoster, UnknownValue, Loading, WithError } =
  composeStories(stories);

describe('MostPopularMovieWidget stories', () => {
  it.each([
    [
      'Nominal',
      Nominal,
      'Avatar: The Way of Water20221 036,49popularitéIndice de popularité TMDB',
    ],
    [
      'NoPoster',
      NoPoster,
      'Affiche indisponibleThe Last Kingdom: Seven Kings Must Die2023312,80popularitéIndice de popularité TMDB',
    ],
    [
      'UnknownValue',
      UnknownValue,
      'Avatar: The Way of Water2022Aucune donnée disponible.',
    ],
    ['Loading', Loading, 'Chargement…'],
    ['WithError', WithError, 'Impossible de charger les données.'],
  ])('renders the %s story', (_name, Story, expectedText) => {
    // Arrange & Act: render the story as Storybook does.
    render(<Story />);

    // Assert: the widget title and the expected state are displayed.
    const widget = screen.getByRole('article', {
      name: 'Film le plus populaire',
    });
    expect(widget.textContent).toBe(`Film le plus populaire${expectedText}`);
  });
});
