import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageRuntimeWidget from './AverageRuntimeWidget';

// The properties documented in AverageRuntimeWidget.tsx are described
// in the Controls panel of each story
const meta = {
  title: 'Widgets/Durée moyenne',
  component: AverageRuntimeWidget,
  // Display the widget with the width of a dashboard column on mobile
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AverageRuntimeWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Demonstration with an average runtime of 107 minutes
export const Nominal: Story = {
  args: { averageRuntime: 107 },
};

// No movie has a known runtime: no value is displayed
export const NoData: Story = {
  args: { averageRuntime: null },
};

export const Loading: Story = {
  args: { averageRuntime: null, status: 'loading' },
};

export const WithError: Story = {
  args: { averageRuntime: null, status: 'error' },
};
