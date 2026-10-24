/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Midnight & Violet Design System
        midnight: {
          bg: '#111118',
          sidebar: '#15151F',
          card: '#1B1B28',
          surface: '#222233',
          'surface-subtle': '#29213D',
          border: '#343347',
          'border-subtle': '#29293A',
          text: '#F4F2FA',
          'text-secondary': '#AAA6BC',
          'text-muted': '#817C95',
        },
        violetlight: {
          bg: '#F7F7FB',
          sidebar: '#FFFFFF',
          card: '#FFFFFF',
          surface: '#F0EFF7',
          'surface-subtle': '#EDE9FE',
          border: '#DDD9E9',
          'border-subtle': '#EAE7F1',
          text: '#242033',
          'text-secondary': '#625D74',
          'text-muted': '#777188',
        },
        violet: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6', // Primary violet in dark theme
          600: '#7C3AED',
          700: '#6D28D9', // Primary violet in light theme
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        }
      }
    },
  },
  plugins: [],
}
