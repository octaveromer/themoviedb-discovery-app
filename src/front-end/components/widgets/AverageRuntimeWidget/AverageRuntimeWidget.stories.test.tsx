// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import * as stories from './AverageRuntimeWidget.stories';

afterEach(cleanup);

// The stories as React components, with their args and decorators
const { Nominal, NoData, Loading, WithError } = composeStories(stories);

describe('AverageRuntimeWidget stories', () => {
  it.each([
    ['Nominal', Nominal, '107min'],
    ['NoData', NoData, 'Aucune donnée disponible.'],
    ['Loading', Loading, 'Chargement…'],
    ['WithError', WithError, 'Impossible de charger les données.'],
  ])('renders the %s story', (_name, Story, expectedText) => {
    // Arrange & Act: render the story as Storybook does.
    render(<Story />);

    // Assert: the widget title and the expected state are displayed.
    const widget = screen.getByRole('article', { name: 'Durée moyenne' });
    expect(widget.textContent).toBe(`Durée moyenne${expectedText}`);
  });
});
