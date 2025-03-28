module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "dark-black": "#1a1a1a", // Deep black for backgrounds
        "dark-gray": "#2d2d2d", // Dark gray for secondary elements
        "light-white": "#ffffff", // White for text
        "accent-gray": "#4a4a4a", // Dark gray accent (replacing tattoo-gray)
        "accent-red": "#e53e3e", // Red accent (replacing tattoo-red)
        "text-gray": "#e5e7eb", // Light gray for text (replacing tattoo-light)
      },
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};