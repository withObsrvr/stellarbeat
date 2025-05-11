/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  prefix: 'tw-',
  corePlugins: {
    preflight: false,
  },
  important: true,
  theme: {
    extend: {},
  },
  plugins: [],
}