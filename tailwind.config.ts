import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0D1117', secondary: '#161B22', tertiary: '#21262D' },
        border: { DEFAULT: '#30363D', subtle: '#21262D' },
        text: { primary: '#E6EDF3', secondary: '#8B949E', muted: '#484F58' },
        accent: {
          blue:   '#58A6FF',
          green:  '#3FB950',
          red:    '#F85149',
          yellow: '#D29922',
          purple: '#BC8CFF',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: { 'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' },
    },
  },
  plugins: [],
}
export default config
