/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dart: {
          green: '#2D5016',
          red: '#8B0000',
          gold: '#FFD700',
          dark: '#1a1a1a',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}