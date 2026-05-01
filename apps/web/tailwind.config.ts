import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#E8F2EF',
          100: '#C5DDD8',
          200: '#9DC4BC',
          300: '#74ABA0',
          400: '#5A9589',
          500: '#4A7C6F',
          600: '#3D6A5E',
          700: '#2D5248',
          800: '#1E3930',
          900: '#0F2018',
        },
        sand: {
          50: '#FDFCF9',
          100: '#F5F0E8',
          200: '#EDE4D0',
          300: '#DDD3B8',
        },
        terracotta: {
          50: '#FAF0EA',
          100: '#F5D6C4',
          200: '#E9AA88',
          400: '#C4714F',
          600: '#9B5038',
        },
        stone: {
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
        flowi: '10px',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
