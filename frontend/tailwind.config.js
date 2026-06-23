/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        candy: {
          bg:        '#F8FAFC',
          surface:   '#FFFFFF',
          sidebar:   '#EEF2F7',
          primary:   '#E11D48',
          success:   '#10B981',
          warning:   '#F59E0B',
          danger:    '#EF4444',
          info:      '#3B82F6',
          text:      '#0F172A',
          muted:     '#64748B',
          border:    '#E2E8F0',
        },
        'candy-dark': {
          bg:        '#0F0F1A',
          surface:   '#1A1A2E',
          sidebar:   '#13131F',
          text:      '#F1F5F9',
          muted:     '#94A3B8',
          border:    'rgba(255,255,255,0.08)',
        },
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
      },
      boxShadow: {
        'card':  '0 4px 24px rgba(15,23,42,0.06)',
        'modal': '0 8px 40px rgba(15,23,42,0.12)',
      },
    },
  },
  plugins: [],
};