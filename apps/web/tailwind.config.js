/** @type {import('tailwindcss').Config} */
// Calm Clinical design system. Semantic surfaces/ink/lines are CSS-variable
// backed (so a dark theme is a variable flip, not a rewrite); the brand + status
// scales are static and calibrated. Components should reach for these tokens
// (surface, line, ink, brand, band-*) rather than raw teal-*/gray-*.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Brand — a considered medical teal (Tailwind teal, calibrated).
        brand: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf',
          500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a',
          DEFAULT: '#0d9488',
        },
        // Semantic, theme-able via CSS vars in index.css.
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-alt': 'rgb(var(--surface-alt) / <alpha-value>)',
        'surface-brand': 'rgb(var(--surface-brand) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-mute': 'rgb(var(--ink-mute) / <alpha-value>)',
        // Confidence bands + status — one reused palette, no more one-offs.
        band: {
          confirmed: '#059669', // emerald-600
          likely: '#0d9488',    // brand
          possible: '#d97706',  // amber-600
          exclude: '#e11d48',   // rose-600
        },
      },
      borderRadius: {
        card: '1.25rem',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.05)',
        'card-hover': '0 6px 16px -4px rgb(15 23 42 / 0.10), 0 3px 8px -3px rgb(15 23 42 / 0.06)',
        elevated: '0 16px 40px -12px rgb(15 23 42 / 0.20)',
        focus: '0 0 0 3px rgb(13 148 136 / 0.20)',
      },
      keyframes: {
        'question-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'field-fill': { '0%': { backgroundColor: 'rgb(153 246 228 / 0.55)' }, '100%': { backgroundColor: 'transparent' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'question-in': 'question-in 0.35s ease-out both',
        'chip-in': 'question-in 0.3s ease-out both',
        'field-fill': 'field-fill 1.6s ease-out both',
        'scale-in': 'scale-in 0.24s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
