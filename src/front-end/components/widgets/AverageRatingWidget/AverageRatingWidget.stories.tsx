import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageRatingWidget from './AverageRatingWidget';

// The properties documented in AverageRatingWidget.tsx are described
// in the Controls panel of each story
const meta = {
  title: 'Widgets/Note moyenne',
  component: AverageRatingWidget,
  // Display the widget with the width of a dashboard column on mobile
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AverageRatingWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Example with a simple average rating of 6,78 / 10
export const Nominal: Story = {
  args: { averageRating: 6.78 },
};

// No movie is rated: the rating is not displayed as 0
export const NoRating: Story = {
  args: { averageRating: null },
};

export const Loading: Story = {
  args: { averageRating: null, status: 'loading' },
};

export const WithError: Story = {
  args: { averageRating: null, status: 'error' },
};
