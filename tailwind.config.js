/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05080f',
          900: '#070d18',
          850: '#0a1220',
          800: '#0d1728',
          750: '#111e33',
          700: '#16253e',
          600: '#1e304d',
          500: '#2a3f61',
        },
        league: {
          red: '#e11d2e',
          redDark: '#b01222',
          redSoft: '#ff4d5d',
          blue: '#2563eb',
          blueSoft: '#4f83f1',
          gold: '#f5b82e',
        },
        mist: {
          50: '#f7f8fc',
          100: '#eef1f7',
          200: '#dde3ee',
          300: '#bdc7d8',
          400: '#8e9db5',
          500: '#6b7c97',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['"Barlow Condensed"', '"Arial Narrow"', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 22px 60px -24px rgba(0, 0, 0, 0.85)',
        glow: '0 0 0 1px rgba(225, 29, 46, 0.35), 0 18px 40px -18px rgba(225, 29, 46, 0.55)',
        lift: '0 26px 50px -24px rgba(0, 0, 0, 0.9)',
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(circle at 82% 18%, rgba(225,29,46,0.38), transparent 34%), radial-gradient(circle at 20% 0%, rgba(37,99,235,0.28), transparent 42%), linear-gradient(120deg, #0b1424 0%, #080e1a 60%, #0b0f1c 100%)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.25s ease-out both',
        'pop-in': 'pop-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
