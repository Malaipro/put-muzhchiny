import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TrialJourney } from './components/TrialJourney.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx'

const OPTIONAL_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap'

function loadOptionalFonts(): void {
  if (document.querySelector('[data-kemp-fonts]')) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = OPTIONAL_FONTS_URL
  link.media = 'print'
  link.dataset.kempFonts = 'true'
  link.onload = () => {
    link.media = 'all'
  }
  document.head.appendChild(link)
}

const isTrial = new URLSearchParams(window.location.search).get('trial') === 'cells';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      {isTrial ? <TrialJourney /> : <App />}
    </AppErrorBoundary>
  </StrictMode>,
)

// External fonts are cosmetic. Load them only after the first application
// frame so a blocked Google host can never hold the Telegram startup screen.
window.requestAnimationFrame(() => {
  window.setTimeout(loadOptionalFonts, 0)
})
