import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TrialJourney } from './components/TrialJourney.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx'

const isTrial = new URLSearchParams(window.location.search).get('trial') === 'cells';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      {isTrial ? <TrialJourney /> : <App />}
    </AppErrorBoundary>
  </StrictMode>,
)
