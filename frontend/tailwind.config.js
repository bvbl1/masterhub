/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      colors: {
        primary: "#486284",
        "primary-hover": "#3a5270",
        "primary-light": "#EEF1F5",
        "bg-main": "#F8FAFC",
        "text-main": "#1E293B",
        "border-main": "#E2E8F0",
      },
    },
  },
  plugins: [],
};
