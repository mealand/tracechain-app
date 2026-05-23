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
          DEFAULT: '#004C99',
          50: '#e6f0fa',
          100: '#b3d0f0',
          200: '#80b0e6',
          300: '#4d90dc',
          400: '#2670d2',
          500: '#004C99',
          600: '#003d7a',
          700: '#002e5c',
          800: '#001f3d',
          900: '#000f1f',
        },
        secondary: '#E5EEF7',
        accent: {
          DEFAULT: '#00B3A4',
          dark: '#008a7e',
        },
        success: '#2E8B57',
        error: '#E63946',
        textPrimary: '#1A1A1A',
        textSecondary: '#555555',
        surface: '#F4F8FC',
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 16px rgba(0, 76, 153, 0.08)',
        cardHover: '0 8px 32px rgba(0, 76, 153, 0.15)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #004C99 0%, #0070E0 50%, #00B3A4 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0D1B2A 0%, #0a2540 50%, #0D2E4A 100%)',
      },
    },
  },
  plugins: [],
}
