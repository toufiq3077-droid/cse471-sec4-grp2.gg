/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f2f8ee",
          100: "#e0eed4",
          200: "#c2ddac",
          300: "#9cc87d",
          400: "#78b054",
          500: "#5a9236",
          600: "#457328",
          700: "#365a22",
          800: "#2d481f",
          900: "#263d1c",
        },
        clay: "#c17a4e",
        wheat: "#f6ecd9",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
