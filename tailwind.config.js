/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Roboto"', 'sans-serif'], // Default font is now Roboto
        roboto: ['"Roboto"', 'sans-serif'],
        poppins: ['"Poppins"', 'sans-serif'],
        'nunito-sans': ['"Nunito Sans"', 'sans-serif'],
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