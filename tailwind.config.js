/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Enabled class-based dark mode from main branch
  darkMode: 'class',
  theme: {
    extend: {
      // You can add custom brand colors here later if needed
    },
  },
  plugins: [],
}