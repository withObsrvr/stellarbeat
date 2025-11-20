/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Extracted from Tabler UI - matching existing brand colors
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
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // Optional: Prefix Tailwind classes if conflicts arise with Bootstrap
  // prefix: 'tw-',
}
