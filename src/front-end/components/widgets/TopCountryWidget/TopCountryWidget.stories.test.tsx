// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import * as stories from './TopCountryWidget.stories';

afterEach(cleanup);

// The stories as React components, with their args and decorators
const { Nominal, LongName, NoCountry, Loading, WithError } =
  composeStories(stories);

describe('TopCountryWidget stories', () => {
  it.each([
    ['Nominal', Nominal, 'United States of America725films'],
    [
      'LongName',
      LongName,
      'United Kingdom of Great Britain and Northern Ireland318films',
    ],
    ['NoCountry', NoCountry, 'Aucun pays connu.'],
    ['Loading', Loading, 'Chargement…'],
    ['WithError', WithError, 'Impossible de charger les données.'],
  ])('renders the %s story', (_name, Story, expectedText) => {
    // Arrange & Act: render the story as Storybook does.
    render(<Story />);

    // Assert: the widget title and the expected state are displayed.
    const widget = screen.getByRole('article', {
      name: 'Pays le plus représenté',
    });
    expect(widget.textContent).toBe(`Pays le plus représenté${expectedText}`);
  });
});
