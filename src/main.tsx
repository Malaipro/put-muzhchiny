import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TrialJourney } from './components/TrialJourney.tsx'

const isTrial = new URLSearchParams(window.location.search).get('trial') === 'cells';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isTrial ? <TrialJourney /> : <App />}
  </StrictMode>,
)
