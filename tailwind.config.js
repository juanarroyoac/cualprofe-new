/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme'); // Import defaultTheme

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Removed duplicate "./components/**/*.{js,ts,jsx,tsx,mdx}" as it's covered by the ./app/** rule
  ],
  theme: {
    extend: {
      fontFamily: {
        // Reference the CSS variables set up in layout.tsx
        // Use defaultTheme.sans for sensible fallbacks
        sans: ['var(--font-roboto)', ...fontFamily.sans], // Set Roboto as the default sans-serif font
        roboto: ['var(--font-roboto)', ...fontFamily.sans],
        poppins: ['var(--font-poppins)', ...fontFamily.sans],
        'nunito-sans': ['var(--font-nunito-sans)', ...fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: '#00103f',
          dark: '#000b2a',
          light: '#001f7f',
        },
      },
    },
  },
  plugins: [],
}