// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import * as stories from './AverageRatingWidget.stories';

afterEach(cleanup);

// The stories as React components, with their args and decorators
const { Nominal, NoRating, Loading, WithError } = composeStories(stories);

describe('AverageRatingWidget stories', () => {
  it.each([
    ['Nominal', Nominal, '6,78/ 10Moyenne simple des notes'],
    ['NoRating', NoRating, 'Aucune donnée disponible.'],
    ['Loading', Loading, 'Chargement…'],
    ['WithError', WithError, 'Impossible de charger les données.'],
  ])('renders the %s story', (_name, Story, expectedText) => {
    // Arrange & Act: render the story as Storybook does.
    render(<Story />);

    // Assert: the widget title and the expected state are displayed.
    const widget = screen.getByRole('article', { name: 'Note moyenne' });
    expect(widget.textContent).toBe(`Note moyenne${expectedText}`);
  });
});
