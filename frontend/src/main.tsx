import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SaaSApp from './SaaSApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SaaSApp />
  </StrictMode>,
)
