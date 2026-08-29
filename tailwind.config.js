/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        monad: {
          50: '#f5f2ff',
          100: '#ede8ff',
          200: '#ddd5ff',
          300: '#c3b4ff',
          400: '#a288ff',
          500: '#8354fe',
          600: '#7234f5',
          700: '#6021df',
          800: '#4e19be',
          900: '#200052',
          purple: '#8354FE',
          dark: '#0e091b',
          card: '#160f29',
          border: '#2a1e4a',
        },
        cyber: {
          cyan: '#00f0ff',
          pink: '#ff007a',
          yellow: '#ffe600',
          green: '#00ff88',
          orange: '#ff6600',
          blue: '#00a3ff',
        }
      },
      fontFamily: {
        sans: ['"Chakra Petch"', '"Rajdhani"', 'system-ui', 'sans-serif'],
        display: ['"Russo One"', '"Chakra Petch"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px rgba(131, 84, 254, 0.45)',
        'glow-cyan': '0 0 25px rgba(0, 240, 255, 0.45)',
        'glow-pink': '0 0 25px rgba(255, 0, 122, 0.45)',
        'glow-yellow': '0 0 25px rgba(255, 230, 0, 0.45)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(131, 84, 254, 0.6))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 5px rgba(131, 84, 254, 0.2))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
