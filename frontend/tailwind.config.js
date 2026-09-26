/** @type {import('tailwindcss').Config} */
export default {
  // Class names are only picked up from these files — keep every class a full
  // literal string (no "bg-" + color concatenation).
  content: ["./index.html", "./src/**/*.{vue,js}"],
  darkMode: "media",
  theme: {
    extend: {},
  },
  plugins: [],
};
