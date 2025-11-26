/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3f2',
          100: '#fee5e2',
          200: '#fdcfca',
          300: '#fbada4',
          400: '#f67c6f',
          500: '#ec5545',
          600: '#d93a2a',
          700: '#b62d1f',
          800: '#96291d',
          900: '#7c281e',
          950: '#44100b',
        },
        accent: {
          50: '#fffaeb',
          100: '#fff1c6',
          200: '#ffe088',
          300: '#ffc94a',
          400: '#ffb420',
          500: '#f99007',
          600: '#dd6b02',
          700: '#b74906',
          800: '#94380c',
          900: '#7a2f0d',
          950: '#461602',
        },
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'SF Pro Display', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Noto Sans TC', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(236, 85, 69, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(236, 85, 69, 0.6)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

