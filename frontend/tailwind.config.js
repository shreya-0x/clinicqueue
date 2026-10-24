/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        clinic: {
          bg: '#f4f8f8',
          ink: '#1b2b34',
          accent: '#0b6e6e',
          'accent-hover': '#085252',
          'accent-light': '#e6f4f4',
          line: '#d5dfe3',
        },
        brand: {
          50: '#f0fdfa',
          100: '#e6f4f4',
          200: '#b2dfdf',
          300: '#5eead4',
          400: '#14b8a6',
          500: '#0b6e6e',
          600: '#0b6e6e',
          700: '#085252',
          800: '#063f3f',
          900: '#042828',
        },
        navy: {
          50: '#f4f8f8',
          100: '#eef3f5',
          200: '#d5dfe3',
          300: '#9db4bd',
          400: '#64808c',
          500: '#435f6c',
          600: '#324a55',
          700: '#263b44',
          800: '#1b2b34',
          900: '#1b2b34',
          950: '#121e24'
        }
      }
    },
  },
  plugins: [],
}
