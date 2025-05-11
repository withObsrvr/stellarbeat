/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  // Use a prefix to avoid conflicts with Bootstrap
  prefix: 'tw-',
  theme: {
    extend: {},
  },
  // Set to true to make Tailwind's classes always win in specificity
  important: true,
  plugins: [],
}