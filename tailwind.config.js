/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f9',
          100: '#fce7f5',
          200: '#fbcfe9',
          300: '#f8a5d5',
          400: '#f36eb9',
          500: '#e6399b',
          600: '#d9008f',
          700: '#b80075',
          800: '#980261',
          900: '#7e0852',
          950: '#4c002e',
        },
        neon: {
          pink: '#ff007f',
          purple: '#9b00e8',
          cyan: '#00f0ff',
        },
        dark: {
          900: '#0b0c10',
          850: '#111319',
          800: '#161922',
          700: '#1f2430',
          600: '#2a3142',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
