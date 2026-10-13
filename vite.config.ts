import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      // Telegram's iOS WebView can expose an older JavaScript runtime than
      // the surrounding Safari version. IE 11 is used here as an ES5 build
      // target so both bootstrap and application contain no ES2015 syntax
      // before React gets a chance to mount.
      targets: ['IE 11'],
      renderModernChunks: false,
    }),
  ],
  base: '/',
})
