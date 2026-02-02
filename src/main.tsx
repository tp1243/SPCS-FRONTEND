import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Ensure production uses the provided Render API URL by default
try {
  if (import.meta.env.PROD) {
    const desired = 'https://smart-police-complaint-system.onrender.com'
    const current = localStorage.getItem('apiBaseOverride') || ''
    if (current !== desired) localStorage.setItem('apiBaseOverride', desired)
  }
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
