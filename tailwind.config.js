/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfcf8',
          100: '#f8f5ef',
          200: '#efe9dc',
        },
        forest: {
          50: '#f0f5f1',
          100: '#dce8de',
          400: '#4f7d5f',
          500: '#2f5d43',
          600: '#274c37',
          700: '#1f3d2c',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
