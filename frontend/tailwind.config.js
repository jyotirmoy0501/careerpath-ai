/** @type {import('tailwindcss').Config} */
export default { content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'], theme: { extend: { colors: { ink: '#172c27', forest: '#245e4c', lime: '#d9f36b', paper: '#f7f8f4', muted: '#77837d' }, fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] }, boxShadow: { card: '0 12px 34px rgba(27,50,40,.06)' } } }, plugins: [] }
