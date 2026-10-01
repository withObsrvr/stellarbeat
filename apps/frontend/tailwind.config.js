/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Radar tokens ────────────────────────────────────────
        // Defined in src/assets/tailwind.css. Prefer these over
        // literal palette values (`gray-200`, `red-600`, …) in new
        // and migrated components.
        surface: {
          page: 'var(--color-surface-page)',
          card: 'var(--color-surface-card)',
          subtle: 'var(--color-surface-subtle)',
        },
        line: {
          DEFAULT: 'var(--color-border-default)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
        },
        ink: {
          DEFAULT: 'var(--color-text-body)',
          primary: 'var(--color-text-primary)',
          strong: 'var(--color-text-strong)',
          body: 'var(--color-text-body)',
          muted: 'var(--color-text-muted)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
        },
        // Severity only — safe / fragile / at-risk. Not decoration.
        signal: {
          safe: 'var(--color-signal-safe)',
          'safe-subtle': 'var(--color-signal-safe-subtle)',
          warn: 'var(--color-signal-warn)',
          'warn-subtle': 'var(--color-signal-warn-subtle)',
          risk: 'var(--color-signal-risk)',
          'risk-subtle': 'var(--color-signal-risk-subtle)',
          neutral: 'var(--color-signal-neutral)',
          'neutral-subtle': 'var(--color-signal-neutral-subtle)',
        },

        // ─── DEPRECATED: Tabler UI brand colors ──────────────────
        // Retained only so the ~66 not-yet-migrated components keep
        // building. Do not use in new work — reach for `signal-*`
        // for severity and `accent` for brand. Remove once the
        // Bootstrap/Tabler migration completes.
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
      ringColor: {
        DEFAULT: 'var(--color-focus-ring)',
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
        'card': '0 1px 2px rgba(26,26,26,.04), 0 8px 28px rgba(26,26,26,.05)',
      },
    },
  },
  plugins: [],
}
