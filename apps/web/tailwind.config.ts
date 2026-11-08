import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf8',
          100: '#d1faf0',
          200: '#a7f3e1',
          300: '#6ee7cb',
          400: '#34d3b0',
          500: '#0f9f85',
          600: '#0d7f6c',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          700: '#334155',
          900: '#0f172a',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        soft: '0 10px 40px -20px rgba(15, 118, 110, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
