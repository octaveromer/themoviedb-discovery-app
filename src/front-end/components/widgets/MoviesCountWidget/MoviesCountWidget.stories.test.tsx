// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import * as stories from './MoviesCountWidget.stories';

afterEach(cleanup);

// The stories as React components, with their args and decorators
const { Nominal, NoMovie, NoData, Loading, WithError } =
  composeStories(stories);

describe('MoviesCountWidget stories', () => {
  it.each([
    ['Nominal', Nominal, '1 234films'],
    ['NoMovie', NoMovie, '0film'],
    ['NoData', NoData, 'Aucune donnée disponible.'],
    ['Loading', Loading, 'Chargement…'],
    ['WithError', WithError, 'Impossible de charger les données.'],
  ])('renders the %s story', (_name, Story, expectedText) => {
    // Arrange & Act: render the story as Storybook does.
    render(<Story />);

    // Assert: the widget title and the expected state are displayed.
    const widget = screen.getByRole('article', { name: 'Films en base' });
    expect(widget.textContent).toBe(`Films en base${expectedText}`);
  });
});
