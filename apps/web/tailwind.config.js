/** @type {import('tailwindcss').Config} */
// Calm Clinical design system — M-UI/2 premium pass. Depth is carried by LIGHT
// (layered, brand-tinted shadows) not by hard hairline borders; the confidence
// bands are a coherent teal-intensity ramp (no more emerald-fighting-teal); the
// type scale is tokenized (no ad-hoc text-[NNpx]). Semantic surfaces/ink/lines
// are CSS-variable backed so a dark theme is a variable flip. Components reach
// for these tokens (surface, line, ink, brand, band-*, shadow e1/e2/e3), never
// raw teal-*/gray-*.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    // A clinical type ramp, tokenized and aligned to the app's real sizes so the
    // ~70 legacy text-[NNpx] values map cleanly onto these. Line-heights baked in.
    fontSize: {
      '2xs': ['0.6875rem', { lineHeight: '1rem' }],        // 11
      xs: ['0.75rem', { lineHeight: '1.05rem' }],          // 12
      sm: ['0.8125rem', { lineHeight: '1.2rem' }],         // 13
      base: ['0.9375rem', { lineHeight: '1.5rem' }],       // 15
      md: ['1rem', { lineHeight: '1.55rem' }],             // 16
      lg: ['1.125rem', { lineHeight: '1.6rem' }],          // 18
      xl: ['1.375rem', { lineHeight: '1.7rem', letterSpacing: '-0.01em' }],   // 22
      '2xl': ['1.75rem', { lineHeight: '2.05rem', letterSpacing: '-0.015em' }], // 28
      '3xl': ['2.125rem', { lineHeight: '2.4rem', letterSpacing: '-0.02em' }],  // 34
      '4xl': ['2.625rem', { lineHeight: '2.9rem', letterSpacing: '-0.022em' }], // 42
    },
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
        'surface-raised': 'rgb(var(--surface-raised) / <alpha-value>)',
        'surface-brand': 'rgb(var(--surface-brand) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-mute': 'rgb(var(--ink-mute) / <alpha-value>)',
        // Confidence bands — a COHERENT ramp, not competing hues. Certainty is
        // teal depth (confirmed = deep teal, likely = brand teal); caution steps
        // out to amber; exclude to rose. Kills the old emerald-next-to-teal clash.
        band: {
          confirmed: '#0b7a6e', // deep teal — "locked in"
          likely: '#0d9488',    // brand teal
          possible: '#c2740a',  // amber-ochre (calmer than raw amber-600)
          exclude: '#e11d48',   // rose-600
        },
        // Signal colours, tokenized so components stop reaching for raw amber-*/red-*.
        warn: '#c2740a',
        danger: '#e11d48',
        positive: '#0b7a6e',
      },
      borderRadius: {
        // A tighter "instrument" scale than the old 20px-everywhere.
        sm: '0.5rem',    // 8
        DEFAULT: '0.625rem', // 10
        md: '0.75rem',   // 12
        lg: '0.875rem',  // 14
        card: '1rem',    // 16 — down from 20, less bubbly
        xl: '1.25rem',   // 20 — heroes
        '2xl': '1.5rem', // 24
        pill: '9999px',
      },
      boxShadow: {
        // Light-based, layered, BRAND-TINTED elevation (var(--shadow-color) flips
        // per theme). e1 resting, e2 raised/hover, e3 hero/overlay. Legacy names
        // (card/card-hover/elevated) alias these so existing components upgrade
        // for free.
        e1: '0 1px 2px 0 rgb(var(--shadow-color) / 0.05), 0 2px 8px -2px rgb(var(--shadow-color) / 0.07)',
        e2: '0 2px 6px -1px rgb(var(--shadow-color) / 0.09), 0 14px 28px -8px rgb(var(--shadow-color) / 0.12)',
        e3: '0 8px 24px -8px rgb(var(--shadow-color) / 0.16), 0 32px 64px -20px rgb(var(--shadow-color) / 0.24)',
        card: '0 1px 2px 0 rgb(var(--shadow-color) / 0.05), 0 2px 8px -2px rgb(var(--shadow-color) / 0.07)',
        'card-hover': '0 2px 6px -1px rgb(var(--shadow-color) / 0.09), 0 14px 28px -8px rgb(var(--shadow-color) / 0.12)',
        elevated: '0 8px 24px -8px rgb(var(--shadow-color) / 0.16), 0 32px 64px -20px rgb(var(--shadow-color) / 0.24)',
        // A soft brand glow for the hero diagnosis moment.
        glow: '0 0 0 1px rgb(var(--ring-brand) / 0.12), 0 8px 30px -8px rgb(var(--ring-brand) / 0.28)',
        focus: '0 0 0 3px rgb(var(--ring-brand) / 0.30)',
        // Inner top-highlight — the subtle "material" sheen on raised surfaces.
        hairline: 'inset 0 1px 0 0 rgb(var(--sheen) / 0.7)',
      },
      keyframes: {
        'question-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'field-fill': { '0%': { backgroundColor: 'rgb(153 246 228 / 0.55)' }, '100%': { backgroundColor: 'transparent' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(0.92)' }, '60%': { transform: 'scale(1.01)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'question-in': 'question-in 0.35s ease-out both',
        'chip-in': 'question-in 0.3s ease-out both',
        'field-fill': 'field-fill 1.6s ease-out both',
        'scale-in': 'scale-in 0.24s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
