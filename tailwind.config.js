/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: '#fff',
            a: {
              color: '#f43f5e',
              '&:hover': {
                color: '#fb7185',
              },
            },
          },
        },
      },
    },
  },
  plugins: [],
};