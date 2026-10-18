/** Shared theme: Person D reuses this for the teacher pages. Agree changes in chat. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fbf6ea',
        ink: '#17323b',
        brand: { DEFAULT: '#0f766e', dark: '#0b5a54', light: '#d5efeb' },
        sun: { DEFAULT: '#f2a900', light: '#fdeec0' },
        given: { DEFAULT: '#2f855a', light: '#d7f0e0' },
        asked: { DEFAULT: '#c05621', light: '#fde3d2' },
      },
      fontFamily: {
        // System fonts only: no web-font download on weak connections.
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Kannada', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
