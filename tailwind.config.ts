// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palet hijau CBS System
        green: {
          50:  '#f0faf4',
          100: '#d4f0e0',
          200: '#a8e0c1',
          300: '#6ec99a',
          400: '#3db874',
          500: '#1e7d49',  // Warna utama
          600: '#166139',
          700: '#0f4a2b',
          800: '#0a3320',
          900: '#061f13',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config