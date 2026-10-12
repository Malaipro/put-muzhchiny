import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // Telegram Desktop and older mobile WebViews can lag behind Chrome.
    target: 'es2019',
  },
})
