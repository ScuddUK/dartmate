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
        },
        theme: {
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          background: 'var(--color-background)',
          surface: 'var(--color-surface)',
          text: 'var(--color-text)',
          'text-secondary': 'var(--color-text-secondary)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          border: 'var(--color-border)',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'score': ['Consolas', 'Monaco', 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', 'monospace'],
        'main-score': ['Fjalla One', 'sans-serif'],
      }
    },
  },
  plugins: [],
}