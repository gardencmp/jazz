module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,jsx,ts,tsx,md,mdx}',
    './components/**/*.{js,jsx,ts,tsx,md,mdx}',
    './theme.config.jsx'
  ],
  theme: {
    extend: {
      display: ['var(--font-manrope)'],
      mono: ['var(--font-pragmata)'],
    }
  },
  plugins: []
}