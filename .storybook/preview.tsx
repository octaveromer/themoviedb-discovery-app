import type { Preview } from '@storybook/react-vite';
import '../src/front-end/global.css';
import '../src/front-end/app.css';

const preview: Preview = {
  // Toolbar menu to display the stories with the light or dark theme
  globalTypes: {
    theme: {
      description: 'Theme of the application',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      // The application reads the theme from this attribute, as in App.tsx
      document.documentElement.dataset.theme = context.globals.theme;
      return <Story />;
    },
  ],
};

export default preview;
