import type { Meta, StoryObj } from '@storybook/react-vite';
import TopRatedMovieWidget from './TopRatedMovieWidget';

// The properties documented in TopRatedMovieWidget.tsx are described
// in the Controls panel of each story
const meta = {
  title: 'Widgets/Film le mieux noté',
  component: TopRatedMovieWidget,
  // Display the widget with the width of a dashboard column on mobile
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TopRatedMovieWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Demonstration with a rating of 9,1 / 10
export const Nominal: Story = {
  args: {
    movie: {
      title: 'The Shawshank Redemption',
      posterPath: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
      releaseYear: 1994,
      rating: 9.1,
    },
  },
};

// No poster, a long title and an unknown year stay readable
export const NoPoster: Story = {
  args: {
    movie: {
      title:
        'Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb',
      posterPath: null,
      releaseYear: null,
      rating: 8.4,
    },
  },
};

// No movie is rated
export const NoRatedMovie: Story = {
  args: { movie: null },
};

export const Loading: Story = {
  args: { movie: null, status: 'loading' },
};

export const WithError: Story = {
  args: { movie: null, status: 'error' },
};
