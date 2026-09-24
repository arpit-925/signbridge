/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0D9488', light: '#14B8A6', dark: '#0F766E' },
        accent: { DEFAULT: '#F97316', light: '#FB923C', dark: '#EA580C' },
        sidebar: { DEFAULT: '#1E3A5F', light: '#2A4A73', dark: '#152D4A' },
        surface: '#FFFFFF',
        background: '#F3F4F6',
        success: { DEFAULT: '#10B981', light: '#D1FAE5' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7' },
        danger: { DEFAULT: '#EC4899', light: '#FCE7F3' },
        info: { DEFAULT: '#3B82F6', light: '#DBEAFE' },
        'dark-purple': '#4C1D95',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
