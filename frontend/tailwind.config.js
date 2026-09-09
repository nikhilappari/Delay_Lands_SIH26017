/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          dark: '#191D23',      // Obsidian Charcoal
          steel: '#57707A',     // Muted Slate Teal / Steel
          slate: '#7E919F',     // Cool Slate Blue
          gray: '#979DAB',      // Soft Slate Gray
          lavender: '#C5BAC4',  // Muted Lavender Pearl
          pearl: '#DEDCDC',     // Soft Pearl Canvas
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(25, 29, 35, 0.04)',
        'sm': '0 1px 3px 0 rgba(25, 29, 35, 0.05), 0 1px 2px -1px rgba(25, 29, 35, 0.03)',
        'card': '0 1px 3px 0 rgba(25, 29, 35, 0.04), 0 1px 2px -1px rgba(25, 29, 35, 0.02)',
        'elevated': '0 10px 25px -5px rgba(25, 29, 35, 0.08), 0 8px 10px -6px rgba(25, 29, 35, 0.03)',
      }
    },
  },
  plugins: [],
}
