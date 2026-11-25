import type { Meta, StoryObj } from '@storybook/react-vite';
import MoviesCountWidget from './MoviesCountWidget';

const meta = {
  title: 'Widgets/Films en base',
  component: MoviesCountWidget,
  // Display the widget with the width of a dashboard column
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MoviesCountWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Nominal state, with a thousands separator
export const Nominal: Story = {
  args: { count: 1234 },
};

// Empty database: 0 is a valid count
export const NoMovie: Story = {
  args: { count: 0 },
};

// Unknown count: no value is displayed
export const NoData: Story = {
  args: { count: null },
};

export const Loading: Story = {
  args: { count: null, status: 'loading' },
};

export const WithError: Story = {
  args: { count: null, status: 'error' },
};
