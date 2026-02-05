/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "./services/**/*.{js,ts,jsx,tsx}",
      "./utils/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        },
        colors: {
          'sbs-blue': '#1D3557',
          'sbs-blue-light': '#457B9D',
          'sbs-red': '#E63A47',
          'sbs-red-dark': '#C92A35',
          'premium-bg': '#FFFFFF',
          'premium-surface': '#FFFFFF',
          'premium-surface-subtle': '#F8F9FA',
          'premium-border': '#F1F3F5', 
          'premium-border-hover': '#E2E8F0',
          'text-primary': '#111827',
          'text-secondary': '#4B5563',
          'text-tertiary': '#9CA3AF',
          'input-bg': '#FFFFFF', 
          'input-focus': '#FFFFFF',
        },
        boxShadow: {
          'premium': '0 20px 40px -15px rgba(29, 53, 87, 0.05)', 
          'premium-hover': '0 30px 60px -12px rgba(29, 53, 87, 0.08), 0 10px 20px -5px rgba(29, 53, 87, 0.04)', 
          'premium-card': '0 4px 6px -1px rgba(29, 53, 87, 0.02), 0 2px 4px -1px rgba(29, 53, 87, 0.02)',
          'glow-red': '0 10px 30px -5px rgba(230, 58, 71, 0.25)', 
          'glow-blue': '0 10px 30px -5px rgba(29, 53, 87, 0.15)',
        },
        backgroundImage: {
          'red-gradient': 'linear-gradient(180deg, #FF5D69 0%, #E63A47 100%)',
          'subtle-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
        },
        keyframes: {
          'fade-in-up': {
            '0%': { opacity: '0', transform: 'translateY(20px) scale(0.99)' },
            '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          },
          'float': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-6px)' },
          }
        },
        animation: {
          'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          'float': 'float 6s ease-in-out infinite',
        },
      },
    },
    plugins: [],
  }