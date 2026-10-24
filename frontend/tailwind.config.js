import plugin from 'tailwindcss/plugin';

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
        // Midnight Blue Enterprise Design System
        midnight: {
          bg: '#0B1020',
          sidebar: '#0F172A',
          card: '#151D31',
          surface: '#1B263D',
          border: '#29344D',
          'border-subtle': '#1E293B',
          text: '#F1F5F9',
          'text-secondary': '#94A3B8',
          'text-muted': '#64748B',
          'primary-blue': '#60A5FA',
          'secondary-blue': '#93C5FD',
        },
        lighttheme: {
          bg: '#F8FAFC',
          sidebar: '#FFFFFF',
          card: '#FFFFFF',
          surface: '#F1F5F9',
          border: '#E2E8F0',
          'border-subtle': '#CBD5E1',
          text: '#0F172A',
          'text-secondary': '#475569',
          'text-muted': '#64748B',
          'primary-blue': '#2563EB',
          'secondary-blue': '#3B82F6',
        },
        // Healthcare Action Palette
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        health: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#60A5FA',
        }
      },
    },
  },
  plugins: [
    plugin(function({ addVariant }) {
      addVariant('light', 'html.light &');
    })
  ],
}
