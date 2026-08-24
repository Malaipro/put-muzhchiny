/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#111310',
        graphite: '#20231E',
        bone: '#E8E1D3',
        bronze: '#B58A4A',
        olive: '#4C5138',
        red: '#8A3027',
        copper: '#8C5B37',
        muted: '#918F86',
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['36px', { lineHeight: '1.1', fontWeight: '500' }],
        h1: ['26px', { lineHeight: '1.15', fontWeight: '500' }],
        h2: ['19px', { lineHeight: '1.2', fontWeight: '500' }],
        body: ['16px', { lineHeight: '1.55' }],
        caption: ['13px', { lineHeight: '1.4' }],
      },
      spacing: {
        'safe': '16px',
        'section': '24px',
      },
      borderRadius: {
        card: '14px',
      },
      minHeight: {
        'cta': '54px',
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
