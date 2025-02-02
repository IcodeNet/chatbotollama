/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#007bff",
          dark: "#0056b3",
        },
        secondary: {
          DEFAULT: "#f0f0f0",
          dark: "#e0e0e0",
        },
        error: {
          DEFAULT: "#DC143C", // Crimson red
          dark: "#B01030",
        },
      },
      animation: {
        "bounce-in": "bounce-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
      keyframes: {
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: 0 },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        "slide-in": {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
