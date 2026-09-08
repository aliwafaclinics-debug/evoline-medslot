/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette
        cream:    '#faf8f4',
        cream2:   '#f3efe8',
        cream3:   '#e8e2d9',
        ink:      '#0f1117',
        ink2:     '#1e2330',
        ink3:     '#2d3348',
        teal: {
          DEFAULT: '#0d7377',
          light:   '#e6f4f4',
          dark:    '#0a5c60',
          600:     '#0b6568',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light:   '#fdf6e3',
          dark:    '#a8893e',
        },
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:  ['var(--font-geist)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '20px',
      },
      boxShadow: {
        sm:  '0 1px 3px rgba(15,17,23,0.08), 0 1px 2px rgba(15,17,23,0.04)',
        md:  '0 4px 16px rgba(15,17,23,0.08), 0 2px 6px rgba(15,17,23,0.04)',
        lg:  '0 20px 60px rgba(15,17,23,0.12), 0 8px 24px rgba(15,17,23,0.06)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        fadeUp:  'fadeUp 0.4s ease forwards',
      },
    },
  },
  plugins: [],
};
