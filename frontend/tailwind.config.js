/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Blue for actions
        accent: '#22c55e',  // Green for AI responses/success
        background: {
          light: '#f9fafb', // Light mode background
          dark: '#111827',  // Optional dark mode background
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
