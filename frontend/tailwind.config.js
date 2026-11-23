/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a0f',
          surface: '#121218',
          elevated: '#17171f',
          border: '#26262e',
        },
        accent: {
          violet: '#7c5cff',
          violetDark: '#6344e6',
          blue: '#4d8eff',
        },
        text: {
          primary: '#f4f4f6',
          muted: '#9ca3af',
          subtle: '#6b7280',
        },
        status: {
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};