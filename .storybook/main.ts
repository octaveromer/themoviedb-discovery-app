import type { StorybookConfig } from '@storybook/react-vite';

// Storybook configuration: the stories are written next to the front-end
// components, in *.stories.tsx files, and built with the project Vite config.
const config: StorybookConfig = {
  stories: ['../src/front-end/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
