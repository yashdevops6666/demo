/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      colors: {
        gold: {
          DEFAULT: "#d4a853",
          light: "#f0c978",
          dark: "#b8892e",
        },
      },
    },
  },
  plugins: [],
};
