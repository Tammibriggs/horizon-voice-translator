import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0E1116',
          soft: '#171B23',
          line: '#262B35',
        },
        paper: {
          DEFAULT: '#F5F1E8',
          dim: '#C9C4B6',
        },
        dusk: {
          DEFAULT: '#5B7FDE',
          dim: '#334B8C',
          glow: '#8FA9F0',
        },
        dawn: {
          DEFAULT: '#E8A63C',
          dim: '#8C6A2E',
          glow: '#F4C978',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-space-grotesk)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
      },
      animation: {
        drift: 'drift 6s ease-in-out infinite',
        pulseRing: 'pulseRing 1.6s cubic-bezier(0.2,0.6,0.4,1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
