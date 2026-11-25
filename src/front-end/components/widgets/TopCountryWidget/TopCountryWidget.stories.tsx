import type { Meta, StoryObj } from '@storybook/react-vite';
import TopCountryWidget from './TopCountryWidget';

// The properties documented in TopCountryWidget.tsx are described
// in the Controls panel of each story
const meta = {
  title: 'Widgets/Pays le plus représenté',
  component: TopCountryWidget,
  // Display the widget with the width of a dashboard column on mobile
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TopCountryWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Example with the United States of America and 725 movies
export const Nominal: Story = {
  args: {
    topCountry: { name: 'United States of America', movieCount: 725 },
  },
};

// A long country name wraps inside the card
export const LongName: Story = {
  args: {
    topCountry: {
      name: 'United Kingdom of Great Britain and Northern Ireland',
      movieCount: 318,
    },
  },
};

// No movie has a known production country
export const NoCountry: Story = {
  args: { topCountry: null },
};

export const Loading: Story = {
  args: { topCountry: null, status: 'loading' },
};

export const WithError: Story = {
  args: { topCountry: null, status: 'error' },
};
