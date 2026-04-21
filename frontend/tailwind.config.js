/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // surfaces
        base:     '#08090d',
        surface:  '#0d1117',
        elevated: '#131920',
        hover:    '#181f2a',
        active:   '#1d2537',
        // borders
        rim:      'rgba(255,255,255,0.06)',
        rimMed:   'rgba(255,255,255,0.10)',
        rimHi:    'rgba(255,255,255,0.16)',
        // text
        tx1:      '#eef0f8',
        tx2:      '#8892a8',
        tx3:      '#45506a',
        // brand accents
        cyan: {
          DEFAULT: '#22d3ee',
          dim:     'rgba(34,211,238,0.10)',
          glow:    'rgba(34,211,238,0.22)',
        },
        med: {
          purple:  '#a78bfa',
          purpledim: 'rgba(167,139,250,0.10)',
          green:   '#4ade80',
          greendim: 'rgba(74,222,128,0.10)',
          amber:   '#fbbf24',
          amberdim: 'rgba(251,191,36,0.10)',
          red:     '#f87171',
          reddim:  'rgba(248,113,113,0.10)',
        },
        // legacy compat
        border:  'rgba(255,255,255,0.06)',
        input:   '#131920',
        ring:    '#22d3ee',
        danger:  { 600: '#f87171', dim: 'rgba(248,113,113,0.10)' },
        primary: { 600: '#22d3ee', dim: 'rgba(34,211,238,0.10)' },
      },
      fontFamily: {
        sans:  ['Geist', 'system-ui', 'sans-serif'],
        mono:  ['Geist Mono', 'monospace'],
      },
      borderRadius: {
        sm:  '8px',
        md:  '12px',
        lg:  '16px',
        xl:  '20px',
        '2xl': '24px',
      },
      boxShadow: {
        card:       '0 2px 12px rgba(0,0,0,0.35)',
        'card-hover':'0 6px 24px rgba(0,0,0,0.5)',
        glow:       '0 0 20px rgba(34,211,238,0.18)',
      },
      borderWidth: { '3': '3px' },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
        pulse: { '0%,100%': { opacity: '.5' }, '50%': { opacity: '1' } },
      },
      animation: {
        fadeUp: 'fadeUp 0.4s ease both',
        spin:   'spin 1s linear infinite',
        pulse:  'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}