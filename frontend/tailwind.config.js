/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF4FF',
          100: '#D9E7FF',
          200: '#B9D2FF',
          700: '#1A365D',
          800: '#0B2A4A',
          900: '#002045',
          950: '#00142E'
        },
        gold: {
          50: '#FFF8E8',
          100: '#F6E7BC',
          500: '#C5A059',
          600: '#A9822F'
        },
        success: '#2D6A4F',
        danger: '#BA1A1A',
        warning: '#D97706'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};