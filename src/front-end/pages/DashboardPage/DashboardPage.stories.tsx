import type { Meta, StoryObj } from '@storybook/react-vite';
import DashboardPage from './DashboardPage';

const meta = {
  title: 'Pages/DashboardPage',
  component: DashboardPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DashboardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// The dashboard before any widget is configured
export const WithoutWidgets: Story = {};

// Placeholder cards showing how the widgets are laid out in the grid
export const WithWidgets: Story = {
  args: {
    children: ['Films en base', 'Durée moyenne', 'Note moyenne'].map(
      (title) => (
        <article
          key={title}
          style={{
            padding: 20,
            border: '1px solid var(--line)',
            borderRadius: 8,
            background: 'var(--surface)',
          }}
        >
          {title}
        </article>
      ),
    ),
  },
};
