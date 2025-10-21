import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Modern Design System (Deutsch-Profi inspired)
        primary: colors.blue,
        secondary: colors.purple,
        success: colors.green,
        danger: colors.red,
        warning: colors.orange,
        
        // Legacy Kahoot colors (für Kompatibilität)
        kahoot: {
          purple: '#8B5CF6', // purple-500
          pink: '#EC4899', // pink-500
          blue: '#3B82F6', // blue-500
          green: '#10B981', // green-500
          orange: '#F97316', // orange-500
          red: '#EF4444', // red-500
          yellow: '#F59E0B', // yellow-500
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

