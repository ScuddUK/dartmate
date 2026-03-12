/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dart-gold': '#FFD700', // Gold color
        'dart-dark': '#1a1a1a', // Dark background
        'dart-red': '#E53E3E', // Red color
      },
      fontFamily: {
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
