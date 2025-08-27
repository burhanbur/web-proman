module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Project primary color (used by toast and components)
        primary: {
          50: '#e8f7f9',
          100: '#d1eff2',
          200: '#a7e0e6',
          300: '#7dd1da',
          400: '#4fc3cf',
          500: '#17a2b8', // main primary (matches src/utils/toast.js)
          600: '#128f9f',
          700: '#0f6b78',
          800: '#0b4950',
          900: '#07282a',
        }
      }
    },
  },
  plugins: [],
}
