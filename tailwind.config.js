/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Components are included via the ./app/** rule above
  ],
  theme: {
    extend: {
      fontFamily: {
        // Set Roboto as the default sans-serif font for body text and UI
        sans: ['var(--font-roboto)', ...fontFamily.sans],
        // Keep Poppins available, e.g., for main headings
        poppins: ['var(--font-poppins)', ...fontFamily.sans],
        // Roboto is now the default, but explicitly defined if needed via `font-roboto`
        roboto: ['var(--font-roboto)', ...fontFamily.sans],
         // Keep Nunito Sans available if needed
        'nunito-sans': ['var(--font-nunito-sans)', ...fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: '#00103f', // Your existing dark blue (good for header/footer)
          dark: '#000a29',    // Darker shade for hover states
          light: '#001f7f',   // Lighter shade for accents
        },
        // Added an accent color for buttons, links, highlights
        accent: {
          DEFAULT: '#1a56db', // A brighter, noticeable blue
          dark: '#1e429f',    // Darker shade for hover/active states
          light: '#3f83f8',   // Lighter shade for backgrounds
        },
        // Added neutral shades for backgrounds, borders, and secondary text
        neutral: {
          light: '#f3f4f6',   // Very light gray for backgrounds
          medium: '#6b7280',  // Medium gray for secondary text
          dark: '#374151',    // Darker gray for primary text
        }
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': 'linear-gradient(135deg, #00103f 0%, #001a6b 100%)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  // Added the newly installed plugins + forms plugin
  plugins: [
    require('@tailwindcss/forms'),          // Added previously
    require('@tailwindcss/typography'),     // Newly installed
    require('@tailwindcss/aspect-ratio'),   // Newly installed
  ],
}