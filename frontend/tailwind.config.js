/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: '#1A1A1A',
        'green-accent': '#2D6A4F',
        'green-light': '#E8F5E9',
        border: '#F0F0F0',
        'text-secondary': '#6B7280',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
      },
    },
  },
  plugins: [],
};
