/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Extracted from Tabler UI - matching existing brand colors (keep for compat)
        primary: {
          DEFAULT: '#467fcf',
          dark: '#3866a6',
        },
        secondary: {
          DEFAULT: '#868e96',
        },
        success: {
          DEFAULT: '#5eba00',
          light: '#d2f1c1',
        },
        danger: {
          DEFAULT: '#cd201f',
          light: '#fdd0d0',
        },
        warning: {
          DEFAULT: '#f1c40f',
          light: '#fcf3cf',
        },
        info: {
          DEFAULT: '#45aaf2',
          light: '#d1ecfc',
        },
        // Prism semantic surface colors
        'surface-page': 'var(--color-surface-page)',
        'surface-card': 'var(--color-surface-card)',
        'surface-subtle': 'var(--color-surface-subtle)',
      },
      borderColor: {
        'border-default': 'var(--color-border-default)',
        'border-subtle': 'var(--color-border-subtle)',
      },
      textColor: {
        'text-primary': 'var(--color-text-primary)',
        'text-strong': 'var(--color-text-strong)',
        'text-body': 'var(--color-text-body)',
        'text-muted': 'var(--color-text-muted)',
      },
      fontFamily: {
        sans: ['Instrument Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      maxWidth: {
        'content': '1320px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0,0,0,0.05)',
        'sm': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'md': '0 4px 8px -2px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'lg': '0 12px 24px -4px rgba(0,0,0,0.08), 0 4px 8px -2px rgba(0,0,0,0.04)',
        'xl': '0 24px 48px -8px rgba(0,0,0,0.10), 0 8px 16px -4px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
