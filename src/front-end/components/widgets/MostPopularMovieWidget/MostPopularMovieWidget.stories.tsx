import type { Meta, StoryObj } from '@storybook/react-vite';
import MostPopularMovieWidget from './MostPopularMovieWidget';

// The properties documented in MostPopularMovieWidget.tsx are described
// in the Controls panel of each story
const meta = {
  title: 'Widgets/Film le plus populaire',
  component: MostPopularMovieWidget,
  // Display the widget with the width of a dashboard column on mobile
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MostPopularMovieWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Example with a popularity index of 1 036,49
export const Nominal: Story = {
  args: {
    movie: {
      title: 'Avatar: The Way of Water',
      posterPath: '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
      releaseYear: 2022,
      popularity: 1036.49,
    },
  },
};

// No poster and a long title that wraps
export const NoPoster: Story = {
  args: {
    movie: {
      title: 'The Last Kingdom: Seven Kings Must Die',
      posterPath: null,
      releaseYear: 2023,
      popularity: 312.8,
    },
  },
};

// The movie is known but not its popularity: no value is displayed
export const UnknownValue: Story = {
  args: {
    movie: {
      title: 'Avatar: The Way of Water',
      posterPath: '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
      releaseYear: 2022,
      popularity: null,
    },
  },
};

export const Loading: Story = {
  args: { movie: null, status: 'loading' },
};

export const WithError: Story = {
  args: { movie: null, status: 'error' },
};
