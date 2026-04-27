/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          red: '#e50914',
          orange: '#f5a623',
          blue: '#2563eb',
          purple: '#7c3aed',
        },
        bg: {
          amoled: '#000000',
          dark: '#0a0a0a',
          light: '#f5f5f5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        'fade-up': 'fadeUp 0.4s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'slide-out': 'slideOut 0.3s ease forwards',
        'zoom-slow': 'zoomSlow 8s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer: {
          'from': { backgroundPosition: '-200% 0' },
          'to': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          'from': { opacity: 0, transform: 'translateY(20px)' },
          'to': { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          'from': { opacity: 0, transform: 'translateX(100%)' },
          'to': { opacity: 1, transform: 'translateX(0)' },
        },
        slideOut: {
          'from': { opacity: 1, transform: 'translateX(0)' },
          'to': { opacity: 0, transform: 'translateX(100%)' },
        },
        zoomSlow: {
          'from': { transform: 'scale(1)' },
          'to': { transform: 'scale(1.08)' },
        }
      }
    },
  },
  plugins: [],
}
