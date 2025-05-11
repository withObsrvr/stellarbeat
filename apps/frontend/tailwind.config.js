/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind where to look for class names 👇
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],

  /*
   * If you want Tailwind’s CSS reset (Preflight) to coexist with Bootstrap 4
   * **without** fighting over <button>, <input>, etc. styles, leave this as‑is.
   * If you’d rather keep Bootstrap’s reset and skip Tailwind’s, uncomment:
   *
   * corePlugins: { preflight: false },
   */

  theme: {
    extend: {
      /* Example customisations – remove or change to suit your brand
      colors: {
        'brand-blue': '#0d6efd',
      },
      fontFamily: {
        sans: ['Inter', ...require('tailwindcss/defaultTheme').fontFamily.sans],
      },
      */
    },
  },

  // Drop in official plugins whenever you need them
  plugins: [
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
};
