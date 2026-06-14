/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          900: '#0F1B2D',
          800: '#1B2A4A',
          700: '#243558',
          600: '#2D4170',
          500: '#3D5A99',
          50: '#EEF2FB',
        },
        slate: {
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
        },
        gold: {
          300: '#E8C97A',
          400: '#C9A84C',
          500: '#A07C28',
        },
        green: {
          400: '#4ADE80',
          500: '#2D6A4F',
          600: '#1F4A38',
        },
        warm: {
          50: '#FAFAF8',
          100: '#F5F4F0',
          200: '#ECEAE3',
        },
        red: {
          400: '#F87171',
          500: '#DC2626',
        },
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'bar-grow': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
        'bar-grow': 'bar-grow 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1) both',
      },
      boxShadow: {
        lift: '0 10px 30px -10px rgba(15,27,45,0.25)',
      },
    },
  },
  plugins: [],
}
